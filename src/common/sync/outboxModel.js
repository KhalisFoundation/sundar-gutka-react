// The outbox: every change to account-owned data that has not yet reached the
// server, persisted with the rest of the store so a change made in a tunnel
// or just before the app was killed still goes up on the next launch.
//
// Pure functions over a plain object, in the style of pothi/model.js. The
// reducer in reducer.js and the drain hook in services/sync are thin wrappers
// around these, which is what keeps the state machine testable without Redux.
//
// Shape:
//   { seq, ops: { [id]: op } }
//   op = { id, feature, kind, key, payload, seq, createdAt,
//          status: "queued" | "sending", attempts, nextAttemptAt, lastError }
//
// `feature` names the owner ("reminders", "pothis"); `kind` is the operation
// that owner understands; `key` identifies WHAT it touches, so a newer change
// to the same thing replaces an older one still waiting — a reminder edited
// three times offline is one upload, not three.

export const OP_QUEUED = "queued";
export const OP_SENDING = "sending";

export const RETRY_BASE_MS = 30 * 1000;
export const RETRY_MAX_MS = 5 * 60 * 1000;

export const emptyOutbox = () => ({ seq: 0, ops: {} });

/**
 * Delay before the next attempt: exponential with ±50% jitter, so every phone
 * that failed during one server blip does not come back in the same second.
 * `random` is injectable for tests.
 */
export const retryDelayMs = (attempts, random = Math.random) => {
  const base = Math.min(RETRY_BASE_MS * 2 ** Math.max(0, attempts - 1), RETRY_MAX_MS);
  return Math.round(base * (0.5 + random()));
};

const opId = (feature, kind, key, seq) => `${feature}:${kind}:${key ?? ""}:${seq}`;

/**
 * Add a change. A queued op for the same feature + key is replaced in place
 * (keeping its turn in the queue); one already in flight is left alone and a
 * new op is added behind it, because the server may already have taken it.
 */
export const enqueue = (state, { feature, kind, key = null, payload = null, now = Date.now() }) => {
  const existing = Object.values(state.ops).find(
    (op) => op.feature === feature && op.key === key && op.status === OP_QUEUED
  );
  if (existing) {
    return {
      ...state,
      ops: {
        ...state.ops,
        [existing.id]: {
          ...existing,
          kind,
          payload,
          attempts: 0,
          nextAttemptAt: 0,
          lastError: null,
        },
      },
    };
  }
  const seq = state.seq + 1;
  const id = opId(feature, kind, key, seq);
  return {
    seq,
    ops: {
      ...state.ops,
      [id]: {
        id,
        feature,
        kind,
        key,
        payload,
        seq,
        createdAt: now,
        status: OP_QUEUED,
        attempts: 0,
        nextAttemptAt: 0,
        lastError: null,
      },
    },
  };
};

const patch = (state, id, fields) =>
  state.ops[id]
    ? { ...state, ops: { ...state.ops, [id]: { ...state.ops[id], ...fields } } }
    : state;

export const markSending = (state, id) => patch(state, id, { status: OP_SENDING });

export const markDone = (state, id) => {
  if (!state.ops[id]) return state;
  const ops = { ...state.ops };
  delete ops[id];
  return { ...state, ops };
};

/** Back to the queue with a later attempt time; the change is never dropped. */
export const markFailed = (state, id, { error = null, now = Date.now(), random } = {}) => {
  const op = state.ops[id];
  if (!op) return state;
  const attempts = op.attempts + 1;
  return patch(state, id, {
    status: OP_QUEUED,
    attempts,
    nextAttemptAt: now + retryDelayMs(attempts, random),
    lastError: error,
  });
};

/** Drop every op of one feature — after a bulk sync has carried them all up. */
export const clearFeature = (state, feature) => {
  const ops = {};
  Object.values(state.ops).forEach((op) => {
    if (op.feature !== feature) ops[op.id] = op;
  });
  return { ...state, ops };
};

/**
 * After a relaunch nothing is in flight any more: whatever was "sending" when
 * the process died goes back to the queue, to be sent again (every op is
 * idempotent on the server side, so a repeat is safe).
 */
export const heal = (state) => {
  const ops = {};
  Object.values(state?.ops ?? {}).forEach((op) => {
    ops[op.id] = op.status === OP_SENDING ? { ...op, status: OP_QUEUED } : op;
  });
  return { seq: state?.seq ?? 0, ops };
};

/**
 * The op a feature should send next: its oldest queued op whose retry time
 * has come — and nothing while one of its ops is already in flight, so a
 * feature's changes reach the server in the order they were made.
 */
export const nextRunnable = (state, feature, now = Date.now()) => {
  const ops = Object.values(state.ops).filter((op) => op.feature === feature);
  if (ops.some((op) => op.status === OP_SENDING)) return null;
  return (
    ops
      .filter((op) => op.status === OP_QUEUED && op.nextAttemptAt <= now)
      .sort((a, b) => a.seq - b.seq)[0] ?? null
  );
};

/** The soonest retry time among a feature's waiting ops, or null. */
export const nextAttemptAt = (state, feature) => {
  const times = Object.values(state.ops)
    .filter((op) => op.feature === feature && op.status === OP_QUEUED)
    .map((op) => op.nextAttemptAt);
  return times.length ? Math.min(...times) : null;
};

export const pendingCount = (state, feature = null) =>
  Object.values(state.ops).filter((op) => feature === null || op.feature === feature).length;
