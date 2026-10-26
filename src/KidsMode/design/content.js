/* eslint-disable */
// Ported verbatim from the Uchaaran design app; kept byte-faithful so the tested screens are what ships.
export const characters = [{ id: 'prem', name: 'Prem Singh' }, { id: 'sehaj', name: 'Sehaj Kaur' }];
// Node centers are percentages of the painted terrain, in pauri order.
export const regions = [
{ name: "The beginning", place: "Fields and quiet groves", start: 1, end: 6, image: "regions/fields-space_1.jpg", description: "Floating platforms among the stars, a ringed planet and drifting asteroids", aspectRatio: 0.8571428571428571, nodes: [[48.1, 87.4], [20.5, 72], [53, 59.8], [82.2, 43.8], [49.2, 29.3], [74.6, 15.1]] },
{ name: "By the river", place: "Riverbanks and quiet groves", start: 7, end: 12, image: "regions/river-snow_1.jpg", description: "Snowfields under an aurora, frozen ponds and snow-dusted pines", aspectRatio: 0.8571428571428571, nodes: [[34.3, 88.4], [61.7, 75.7], [29.5, 60.7], [56.6, 47.6], [82.9, 35.6], [49.1, 21]] },
{ name: "Paths of listening", place: "Bridges and sheltered paths", start: 13, end: 18, image: "regions/paths-plains_1.jpg", description: "Rolling farm plains with a red barn, a windmill and fenced fields", aspectRatio: 0.8571428571428571, nodes: [[20.7, 86.7], [51.2, 78.1], [36.4, 63], [69.6, 54.9], [57.1, 38.6], [28.7, 24.4]] },
{ name: "An open horizon", place: "Where rivers meet the sea", start: 19, end: 24, image: "regions/horizon-lakes_1.jpg", description: "A wide lake with wooded islands, lily pads and distant mountains", aspectRatio: 0.8571428571428571, nodes: [[26, 85.2], [63.5, 79.3], [46.2, 64], [77.3, 49.6], [37.4, 38.9], [68.4, 23.7]] },
{ name: "A world of wonder", place: "Terraced fields and groves", start: 25, end: 30, image: "regions/wonder-sky_1.jpg", description: "Cloud platforms in a bright sky with a rainbow and floating islands", aspectRatio: 0.8571428571428571, nodes: [[22.6, 86.4], [52.6, 79.1], [79.7, 65.9], [51.3, 52.7], [25.6, 39], [53.8, 23.9]] },
{ name: "Growing in grace", place: "Hills and the flowing river", start: 31, end: 38, image: "regions/grace-desert_1.jpg", description: "Desert dunes with cacti, distant mesas and a small oasis", aspectRatio: 0.75, nodes: [[23.8, 89.1], [55.1, 84.5], [78.1, 72], [49.7, 62.3], [19.8, 52.2], [41.9, 39.3], [79.7, 37.6], [60.8, 22]] }];

export const collection = [
{ id: 'classic', name: 'Classic explorer', cost: 0, color: '#c4d4ea' },
{ id: 'sky', name: 'Sky frame', cost: 0, color: '#7daed1' },
{ id: 'sunshine', name: 'Sunshine frame', cost: 10, color: '#d6ad32' },
{ id: 'river', name: 'River explorer', cost: 20, color: '#3477bd' },
{ id: 'garden', name: 'Garden explorer', cost: 30, color: '#65955d' }];

export function lineScore(score, index, lineCount) {
  return score < 95 && index < Math.floor(lineCount / 3) * 3 ? score + (index % 3 === 1 ? -16 : 8) : score;
}
