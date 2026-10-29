// The app keeps reminder times as "h:mm A" (what the scheduler and the picker
// use); the account API stores 24-hour "HH:mm". Both directions live here so
// every sync path converts the same way.

/** "6:05 PM" → "18:05". Anything already 24-hour or unparseable is returned as is. */
export const to24h = (t) => {
  const m = String(t || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*([ap]m)?$/i);
  if (!m) return t;
  let hr = Number(m[1]);
  const meridiem = m[3] ? m[3].toLowerCase() : "";
  if (meridiem === "pm" && hr < 12) hr += 12;
  if (meridiem === "am" && hr === 12) hr = 0;
  return `${String(hr).padStart(2, "0")}:${m[2]}`;
};

/** "18:05" → "6:05 PM". Anything already 12-hour or unparseable is returned as is. */
export const to12h = (t) => {
  if (!t) return t;
  if (/[ap]m\s*$/i.test(t)) return t;
  const [hRaw, mRaw = "0"] = String(t).split(":");
  let hr = Number(hRaw);
  if (Number.isNaN(hr)) return t;
  const min = String(Number(mRaw) || 0).padStart(2, "0");
  const meridiem = hr >= 12 ? "PM" : "AM";
  hr %= 12;
  if (hr === 0) hr = 12;
  return `${hr}:${min} ${meridiem}`;
};
