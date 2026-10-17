/* eslint-disable */
// Ported verbatim from the Uchaaran design app; kept byte-faithful so the tested screens are what ships.
export const characters = [{ id: 'prem', name: 'Prem Singh' }, { id: 'sehaj', name: 'Sehaj Kaur' }];
// Node centers are percentages of the painted terrain, in pauri order.
export const regions = [
{ name: "The beginning", place: "Fields and quiet groves", start: 1, end: 6, image: "regions/fields-calm.jpg", description: "Broad golden fields, a quiet grove and distant river", aspectRatio: 0.8571428571428571, nodes: [[21, 84.5], [44.5, 65.7], [64, 52.7], [84, 39.3], [51, 27.7], [24, 13.8]] },
{ name: "By the river", place: "Riverbanks and quiet groves", start: 7, end: 12, image: "regions/river-calm.jpg", description: "Broad blue riverbanks, sandy islands and sparse trees", aspectRatio: 0.8571428571428571, nodes: [[21, 84.5], [44.5, 65.7], [64, 52.7], [84, 39.3], [51, 27.7], [24, 13.8]] },
{ name: "Paths of listening", place: "Bridges and sheltered paths", start: 13, end: 18, image: "regions/paths-calm.jpg", description: "Rolling green hills, a stone bridge and sheltered pass", aspectRatio: 0.8571428571428571, nodes: [[21, 84.5], [44.5, 65.7], [64, 52.7], [84, 39.3], [51, 27.7], [24, 13.8]] },
{ name: "An open horizon", place: "Where rivers meet the sea", start: 19, end: 24, image: "regions/horizon-calm.jpg", description: "Open estuary, layered hills and distant sea", aspectRatio: 0.8571428571428571, nodes: [[21, 84.5], [44.5, 65.7], [64, 52.7], [84, 39.3], [51, 27.7], [24, 13.8]] },
{ name: "A world of wonder", place: "Terraced fields and groves", start: 25, end: 30, image: "regions/wonder-calm.jpg", description: "Open terraced fields, stone walls and sparse trees", aspectRatio: 0.8571428571428571, nodes: [[21, 84.5], [44.5, 65.7], [64, 52.7], [84, 39.3], [51, 27.7], [24, 13.8]] },
{ name: "Growing in grace", place: "Hills and the flowing river", start: 31, end: 38, image: "regions/grace-calm.jpg", description: "Gentle hills, quiet groves and a river with a small waterfall", aspectRatio: 0.75, nodes: [[29.5, 87], [66.7, 76], [33.6, 65.3], [70.7, 54.8], [35.2, 43.2], [70.9, 33.2], [35.6, 23], [72, 13.6]] }];

export const collection = [
{ id: 'classic', name: 'Classic explorer', cost: 0, color: '#c4d4ea' },
{ id: 'sky', name: 'Sky frame', cost: 0, color: '#7daed1' },
{ id: 'sunshine', name: 'Sunshine frame', cost: 10, color: '#d6ad32' },
{ id: 'river', name: 'River explorer', cost: 20, color: '#3477bd' },
{ id: 'garden', name: 'Garden explorer', cost: 30, color: '#65955d' }];

export function lineScore(score, index, lineCount) {
  return score < 95 && index < Math.floor(lineCount / 3) * 3 ? score + (index % 3 === 1 ? -16 : 8) : score;
}
