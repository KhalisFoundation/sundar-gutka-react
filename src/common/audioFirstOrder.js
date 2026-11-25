// Default bani order with audio banis first, then the rest, then folders.
// Stable: the original order is kept within each group. Import-free on purpose,
// so defaultBaniOrder.js can use it without a circular import.
const audioFirstOrder = (entries, audioIds) => {
  const withAudio = new Set(audioIds);
  const audio = [];
  const noAudio = [];
  const folders = [];
  entries.forEach((entry) => {
    if (entry.id === undefined) folders.push(entry);
    else if (withAudio.has(entry.id)) audio.push(entry);
    else noAudio.push(entry);
  });
  return [...audio, ...noAudio, ...folders];
};

export default audioFirstOrder;
