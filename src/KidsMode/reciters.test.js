import { DEFAULT_RECITER, reciterForUrl, reciterOf } from "./reciters";

describe("reciters", () => {
  it("falls back to the default reciter for an unset or unknown code", () => {
    expect(reciterOf(null).key).toBe(DEFAULT_RECITER);
    expect(reciterOf("nobody").key).toBe(DEFAULT_RECITER);
    expect(reciterOf("imk").folder).toBe("IndermohanKaurUK");
  });

  it("reads the reciter from a track URL's CDN folder", () => {
    expect(reciterForUrl("https://cdn.example/audios/GianiGurdevSingh/JapjiSahib.m4a").key).toBe(
      "ggs"
    );
    expect(reciterForUrl("https://cdn.example/audios/Someone/JapjiSahib.m4a")).toBeUndefined();
  });
});
