/* eslint-env jest */
import { parseHtmlBlocks, blockText } from "./parseHtmlBlocks";

describe("parseHtmlBlocks", () => {
  it("returns [] for empty/null/undefined input", () => {
    expect(parseHtmlBlocks("")).toEqual([]);
    expect(parseHtmlBlocks(null)).toEqual([]);
    expect(parseHtmlBlocks(undefined)).toEqual([]);
    expect(parseHtmlBlocks("   ")).toEqual([]);
  });

  it("parses a plain heading with no links", () => {
    expect(parseHtmlBlocks("<h1>ਸੁੰਦਰ ਗੁਟਕਾ</h1>")).toEqual([
      { tag: "h1", className: "", segments: [{ text: "ਸੁੰਦਰ ਗੁਟਕਾ", link: false }] },
    ]);
  });

  it("parses a paragraph with one embedded link, preserving surrounding text", () => {
    const blocks = parseHtmlBlocks(
      '<p>Built by <a href="https://khalisfoundation.org/">Khalis Foundation</a>.</p>'
    );
    expect(blocks[0].segments).toEqual([
      { text: "Built by ", link: false },
      { text: "Khalis Foundation", link: true, url: "https://khalisfoundation.org/" },
      { text: ".", link: false },
    ]);
  });

  it("parses a paragraph with two embedded links", () => {
    const blocks = parseHtmlBlocks(
      '<p>Visit <a href="https://a.com/">A</a> and <a href="https://b.com/">B</a> today.</p>'
    );
    expect(blocks[0].segments).toEqual([
      { text: "Visit ", link: false },
      { text: "A", link: true, url: "https://a.com/" },
      { text: " and ", link: false },
      { text: "B", link: true, url: "https://b.com/" },
      { text: " today.", link: false },
    ]);
  });

  it("captures the class attribute so the footer can be styled distinctly", () => {
    const blocks = parseHtmlBlocks('<p class="seva-footer">Know coding?</p>');
    expect(blocks[0].className).toBe("seva-footer");
  });

  it("parses multiple top-level blocks in document order", () => {
    const blocks = parseHtmlBlocks("<h1>Title</h1><p>First.</p><p>Second.</p>");
    expect(blocks.map((b) => b.tag)).toEqual(["h1", "p", "p"]);
    expect(blocks[1].segments).toEqual([{ text: "First.", link: false }]);
    expect(blocks[2].segments).toEqual([{ text: "Second.", link: false }]);
  });

  it("strips <style> blocks — styling is owned by the app's themed StyleSheet", () => {
    const blocks = parseHtmlBlocks("<style>h1 { color: red; }</style><h1>Title</h1><p>Body.</p>");
    expect(blocks.map((b) => b.tag)).toEqual(["h1", "p"]);
    expect(JSON.stringify(blocks)).not.toContain("color: red");
  });

  it("decodes basic HTML entities", () => {
    const blocks = parseHtmlBlocks("<p>Q&amp;A&nbsp;terms &lt;apply&gt; &quot;now&quot;</p>");
    expect(blocks[0].segments[0].text).toBe('Q&A terms <apply> "now"');
  });

  it("ignores unsupported tags entirely (only h1/h2/h3/p are recognized)", () => {
    expect(parseHtmlBlocks("<div>Not recognized</div><p>Recognized.</p>")).toEqual([
      { tag: "p", className: "", segments: [{ text: "Recognized.", link: false }] },
    ]);
  });
});

describe("blockText", () => {
  it("flattens a block's segments back to plain text", () => {
    const [block] = parseHtmlBlocks('<p>Hi <a href="https://a.com/">there</a>!</p>');
    expect(blockText(block)).toBe("Hi there!");
  });

  it("decodes entities in a link's href", () => {
    const [block] = parseHtmlBlocks('<p><a href="https://x.org/?a=1&amp;b=2">Go</a></p>');
    expect(block.segments[0].url).toBe("https://x.org/?a=1&b=2");
  });

  it("drops inline tags to their text and keeps <br> as a line break", () => {
    const [block] = parseHtmlBlocks("<p>Support <strong>Khalis</strong><br/>today</p>");
    expect(blockText(block)).toBe("Support Khalis\ntoday");
  });

  it("keeps a literal < in copy, and the space between two links", () => {
    expect(blockText(parseHtmlBlocks("<p>Give <5 min a day></p>")[0])).toBe("Give <5 min a day>");
    expect(blockText(parseHtmlBlocks("<p>Ages 5<a then 10 > 3</p>")[0])).toBe(
      "Ages 5<a then 10 > 3"
    );
    const [block] = parseHtmlBlocks('<p><a href="a">A</a> <a href="b">B</a></p>');
    expect(blockText(block)).toBe("A B");
  });

  it("decodes numeric and typographic entities", () => {
    const [block] = parseHtmlBlocks(
      "<p>d&#8217;autres &#x27;x&#x27; l&rsquo;app&hellip; &unknown;</p>"
    );
    expect(blockText(block)).toBe("d\u2019autres 'x' l\u2019app\u2026 &unknown;");
  });

  it("keeps a leading <br> before a link as its line break", () => {
    const [block] = parseHtmlBlocks('<p>Note<br><a href="x">Go</a></p>');
    expect(blockText(block)).toBe("Note\nGo");
    expect(parseHtmlBlocks('<p><br><a href="x">Go</a></p>')[0].segments[0].text).toBe("\n");
  });

  it("leaves no empty segments around a wrapped link, and no empty blocks", () => {
    const [block] = parseHtmlBlocks('<p><strong><a href="x">Go</a></strong></p>');
    expect(block.segments).toEqual([{ text: "Go", link: true, url: "x" }]);
    expect(parseHtmlBlocks("<p><span></span></p>")).toEqual([]);
  });

  it("is safe on null/empty blocks", () => {
    expect(blockText(null)).toBe("");
    expect(blockText({ segments: [] })).toBe("");
  });
});
