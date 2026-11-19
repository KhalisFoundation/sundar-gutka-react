/* eslint-env jest */

import { banisWithAudio } from "./useBanisWithAudio";

// The real constant module, so the length-variant list and length keys match production.
jest.mock("@common", () => ({
  constant: jest.requireActual("@common/constant").default,
}));

const constant = jest.requireActual("@common/constant").default;

const artist = (trackId) => ({
  artistId: 1,
  name: "Reciter",
  trackId,
  link: `https://cdn.example.net/audios/Reciter/${trackId}.m4a`,
});
const group = (...trackIds) => ({ artists: trackIds.map(artist) });

describe("banisWithAudio", () => {
  it("is empty before the catalog has synced", () => {
    expect(banisWithAudio(undefined, constant.MEDIUM).size).toBe(0);
    expect(banisWithAudio({}, constant.MEDIUM).size).toBe(0);
  });

  it("marks a bani whose cached manifest has a playable track, as a number", () => {
    const catalog = { 2: { groups: { long: group(10) } } };
    const ids = banisWithAudio(catalog, constant.MEDIUM);
    expect(ids.has(2)).toBe(true);
    expect(ids.has("2")).toBe(false);
  });

  it("leaves out a bani whose entry has no playable track", () => {
    const catalog = {
      4: { groups: { long: { artists: [{ trackId: 11 }] } } }, // no link
      6: { groups: {} },
      10: {},
    };
    expect(banisWithAudio(catalog, constant.MEDIUM).size).toBe(0);
  });

  it("follows the selected length for a length-variant bani", () => {
    const [variantId] = constant.BANI_IDS_WITH_LENGTH_VARIANTS;
    const catalog = { [variantId]: { groups: { short: group(20) } } };
    expect(banisWithAudio(catalog, constant.SHORT).has(variantId)).toBe(true);
    expect(banisWithAudio(catalog, constant.LONG).has(variantId)).toBe(false);
    // No recording exists at the extra-long length.
    expect(banisWithAudio(catalog, constant.EXTRA_LONG).has(variantId)).toBe(false);
  });
});
