// The speed set most often across the old per-bani map; ties go to the faster.
export const mostCommonSpeed = (speeds) => {
  const counts = new Map();
  Object.values(speeds ?? {}).forEach((value) => {
    if (Number.isFinite(value)) counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  let best;
  counts.forEach((count, value) => {
    if (
      best === undefined ||
      count > counts.get(best) ||
      (count === counts.get(best) && value > best)
    ) {
      best = value;
    }
  });
  return best;
};

export default mostCommonSpeed;
