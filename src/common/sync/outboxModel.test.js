/* eslint-env jest */
import {
  clearFeature,
  emptyOutbox,
  enqueue,
  heal,
  markDone,
  markFailed,
  markSending,
  nextAttemptAt,
  nextRunnable,
  pendingCount,
  retryDelayMs,
  RETRY_BASE_MS,
  RETRY_MAX_MS,
} from "./outboxModel";

const at = (t) => t;

describe("outbox", () => {
  it("queues ops in order and hands them out oldest first", () => {
    let s = emptyOutbox();
    s = enqueue(s, { feature: "reminders", kind: "upsert", key: 2, now: at(1) });
    s = enqueue(s, { feature: "reminders", kind: "upsert", key: 4, now: at(2) });
    expect(pendingCount(s)).toBe(2);
    expect(nextRunnable(s, "reminders", at(3)).key).toBe(2);
  });

  it("a newer change to the same thing replaces the one still waiting", () => {
    let s = emptyOutbox();
    s = enqueue(s, { feature: "reminders", kind: "upsert", key: 2, payload: { time: "05:00" } });
    s = enqueue(s, { feature: "reminders", kind: "upsert", key: 4 });
    s = enqueue(s, { feature: "reminders", kind: "delete", key: 2, payload: null });
    expect(pendingCount(s)).toBe(2);
    const first = nextRunnable(s, "reminders");
    expect(first.key).toBe(2);
    expect(first.kind).toBe("delete"); // replaced in place, kept its turn
  });

  it("an op already in flight is not replaced; the new change queues behind it", () => {
    let s = emptyOutbox();
    s = enqueue(s, { feature: "reminders", kind: "upsert", key: 2, payload: { time: "05:00" } });
    const [id] = Object.keys(s.ops);
    s = markSending(s, id);
    s = enqueue(s, { feature: "reminders", kind: "upsert", key: 2, payload: { time: "06:00" } });
    expect(pendingCount(s)).toBe(2);
    // Nothing runs for the feature while one op is in flight.
    expect(nextRunnable(s, "reminders")).toBeNull();
    s = markDone(s, id);
    expect(nextRunnable(s, "reminders").payload.time).toBe("06:00");
  });

  it("features do not block each other", () => {
    let s = emptyOutbox();
    s = enqueue(s, { feature: "reminders", kind: "upsert", key: 2 });
    s = enqueue(s, { feature: "pothis", kind: "put", key: "mypothi" });
    s = markSending(s, nextRunnable(s, "reminders").id);
    expect(nextRunnable(s, "pothis")).not.toBeNull();
  });

  it("a failure keeps the change and backs off, growing but capped", () => {
    let s = emptyOutbox();
    s = enqueue(s, { feature: "reminders", kind: "upsert", key: 2 });
    const [id] = Object.keys(s.ops);
    const noJitter = () => 0.5;
    s = markFailed(s, id, { error: "offline", now: 1000, random: noJitter });
    expect(s.ops[id].status).toBe("queued");
    expect(s.ops[id].attempts).toBe(1);
    expect(s.ops[id].nextAttemptAt).toBe(1000 + RETRY_BASE_MS);
    expect(nextRunnable(s, "reminders", 1000)).toBeNull();
    expect(nextRunnable(s, "reminders", 1000 + RETRY_BASE_MS).id).toBe(id);
    expect(nextAttemptAt(s, "reminders")).toBe(1000 + RETRY_BASE_MS);
    for (let i = 0; i < 10; i += 1) s = markFailed(s, id, { now: 0, random: noJitter });
    expect(s.ops[id].nextAttemptAt).toBe(RETRY_MAX_MS);
  });

  it("retryDelayMs jitters within ±50%", () => {
    expect(retryDelayMs(1, () => 0)).toBe(RETRY_BASE_MS * 0.5);
    expect(retryDelayMs(1, () => 1)).toBe(RETRY_BASE_MS * 1.5);
  });

  it("a relaunch puts in-flight ops back in the queue and drops nothing", () => {
    let s = emptyOutbox();
    s = enqueue(s, { feature: "reminders", kind: "upsert", key: 2 });
    s = enqueue(s, { feature: "pothis", kind: "put", key: "mypothi" });
    s = markSending(s, nextRunnable(s, "reminders").id);
    const healed = heal(s);
    expect(Object.values(healed.ops).every((op) => op.status === "queued")).toBe(true);
    expect(pendingCount(healed)).toBe(2);
    expect(heal(undefined)).toEqual(emptyOutbox());
  });

  it("clearing a feature leaves the others alone", () => {
    let s = emptyOutbox();
    s = enqueue(s, { feature: "reminders", kind: "upsert", key: 2 });
    s = enqueue(s, { feature: "pothis", kind: "put", key: "mypothi" });
    s = clearFeature(s, "reminders");
    expect(pendingCount(s, "reminders")).toBe(0);
    expect(pendingCount(s, "pothis")).toBe(1);
  });
});
