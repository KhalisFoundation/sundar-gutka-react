/* eslint-env jest */
import { parseSevaContent, SEVA_SLOT_TYPES } from "./sevaContentParser";

const mockLogError = jest.fn();
jest.mock("@common", () => ({
  logError: (...args) => mockLogError(...args),
}));

describe("parseSevaContent", () => {
  beforeEach(() => {
    mockLogError.mockClear();
  });

  it("returns an empty array for empty/null/undefined content", () => {
    expect(parseSevaContent("")).toEqual([]);
    expect(parseSevaContent(null)).toEqual([]);
    expect(parseSevaContent(undefined)).toEqual([]);
    expect(parseSevaContent("   ")).toEqual([]);
  });

  it("returns the whole string as one html segment when there is no marker", () => {
    const html = "<h1>ਸੁੰਦਰ ਗੁਟਕਾ</h1><p>Some description.</p>";
    expect(parseSevaContent(html)).toEqual([{ type: "html", value: html }]);
  });

  it("splits a single donate_widget marker into html-before and html-after", () => {
    const result = parseSevaContent("<h1>Headline</h1><!--SLOT:donate_widget--><p>Footer</p>");
    expect(result).toEqual([
      { type: "html", value: "<h1>Headline</h1>" },
      { type: "slot", name: "donate_widget" },
      { type: "html", value: "<p>Footer</p>" },
    ]);
  });

  it("supports both donate_widget and tax_note markers, in the order they appear", () => {
    const result = parseSevaContent(
      "<h1>Headline</h1><!--SLOT:donate_widget--><!--SLOT:tax_note--><p>Footer</p>"
    );
    expect(result).toEqual([
      { type: "html", value: "<h1>Headline</h1>" },
      { type: "slot", name: "donate_widget" },
      { type: "slot", name: "tax_note" },
      { type: "html", value: "<p>Footer</p>" },
    ]);
  });

  it("respects reordering — tax_note before donate_widget", () => {
    const result = parseSevaContent("<!--SLOT:tax_note--><p>Middle</p><!--SLOT:donate_widget-->");
    expect(result).toEqual([
      { type: "slot", name: "tax_note" },
      { type: "html", value: "<p>Middle</p>" },
      { type: "slot", name: "donate_widget" },
    ]);
  });

  it("supports a marker with no surrounding html on one side (leading marker)", () => {
    const result = parseSevaContent("<!--SLOT:donate_widget--><p>Only footer</p>");
    expect(result).toEqual([
      { type: "slot", name: "donate_widget" },
      { type: "html", value: "<p>Only footer</p>" },
    ]);
  });

  it("supports a marker with nothing after it (trailing marker)", () => {
    const result = parseSevaContent("<p>Only header</p><!--SLOT:donate_widget-->");
    expect(result).toEqual([
      { type: "html", value: "<p>Only header</p>" },
      { type: "slot", name: "donate_widget" },
    ]);
  });

  it("drops an unrecognized slot name and logs an error, keeping surrounding html", () => {
    const result = parseSevaContent("<p>Before</p><!--SLOT:mystery_widget--><p>After</p>");
    expect(result).toEqual([
      { type: "html", value: "<p>Before</p>" },
      { type: "html", value: "<p>After</p>" },
    ]);
    expect(mockLogError).toHaveBeenCalledTimes(1);
    expect(mockLogError.mock.calls[0][0].message).toMatch(/mystery_widget/);
  });

  it("SEVA_SLOT_TYPES contains exactly the two known native slots", () => {
    expect(SEVA_SLOT_TYPES).toEqual(["donate_widget", "tax_note"]);
  });

  it("parses CARD open/close markers around slots into card segments", () => {
    const result = parseSevaContent(
      '<h1>Hero</h1><!--CARD:donate--><h2>Title</h2><!--SLOT:donate_widget--><!--/CARD--><h2>Section</h2>'
    );
    expect(result).toEqual([
      { type: "html", value: "<h1>Hero</h1>" },
      { type: "card_open", name: "donate" },
      { type: "html", value: "<h2>Title</h2>" },
      { type: "slot", name: "donate_widget" },
      { type: "card_close" },
      { type: "html", value: "<h2>Section</h2>" },
    ]);
  });
});
