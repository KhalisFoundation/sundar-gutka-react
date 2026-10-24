// The FCM topics every device subscribes to, so a campaign can be sent to
// everyone, to one platform, or to one language without a token list.
//
// Deliberately few and deliberately not per-feature: a topic is a permanent
// subscription with no UI to leave it, so "new audio" or "donate" campaigns go
// to `all` (or a Firebase audience) rather than to topics a user cannot see.
// Adding one here is an app release; that is the right cost for a channel the
// user has no control over.

export const TOPIC_ALL = "all";

/** Firebase allows [a-zA-Z0-9-_.~%]; language tags carry hyphens, which is fine. */
const safe = (value) => String(value || "").replace(/[^a-zA-Z0-9\-_.~%]/g, "_");

/**
 * @param {{ platform: string, lang: string }} device
 * @returns {string[]} topics, `all` first.
 */
export const topicsFor = ({ platform, lang }) => {
  const topics = [TOPIC_ALL];
  if (platform) topics.push(`platform-${safe(platform)}`);
  if (lang) topics.push(`lang-${safe(lang).toLowerCase()}`);
  return topics;
};

/**
 * Topics to leave when the set changes — a language switch must not leave the
 * device subscribed to both languages' campaigns.
 */
export const topicsToLeave = (previous, next) => previous.filter((t) => !next.includes(t));

export default topicsFor;
