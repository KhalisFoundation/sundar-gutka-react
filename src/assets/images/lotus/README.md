# Lotus streak assets

14 lotus growth stages, `flower_1.png` (base / just started) → `flower_14.png`
(max bloom). Rendered by `src/DashboardScreen/components/StreakCard.jsx`.

The current streak selects which flower is shown (the "hero"), based on the
day thresholds in `StreakCard.jsx`:

| Stage | File | Streak ≥ (days) |
|-------|------|-----------------|
| 1 | flower_1.png | 0 (start) |
| 2 | flower_2.png | 2 |
| 3 | flower_3.png | 5 |
| 4 | flower_4.png | 10 |
| 5 | flower_5.png | 15 |
| 6 | flower_6.png | 21 |
| 7 | flower_7.png | 30 |
| 8 | flower_8.png | 45 |
| 9 | flower_9.png | 60 |
| 10 | flower_10.png | 90 |
| 11 | flower_11.png | 120 |
| 12 | flower_12.png | 180 |
| 13 | flower_13.png | 270 |
| 14 | flower_14.png | 365 |

A 14-segment bar under the streak shows progress through the stages.

> **Note:** each PNG is ~2 MB. Only the current stage is rendered at a time, but
> consider downsizing these to ~256–512px to cut bundle size and memory.
