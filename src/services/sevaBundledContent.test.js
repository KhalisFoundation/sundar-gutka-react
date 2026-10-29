/* eslint-env jest */
import STRINGS from "../common/localization";
import { buildBundledSevaLayout, buildBundledMeansPage } from "./sevaBundledContent";

// react-native-localization reaches for a native module to read the device
// locale, which does not exist under jest. The real dictionary in
// localization.js is still what gets loaded — only the lookup is stubbed, so
// these tests assert the strings the app actually ships.
jest.mock("react-native-localization", () => {
  function LocalizedStrings(dictionaries) {
    this.dictionaries = dictionaries;
    this.getString = (key, lang) => this.dictionaries[lang]?.[key];
  }
  return LocalizedStrings;
});

describe("sevaBundledContent — offline mirror of the backend layout", () => {
  describe("buildBundledSevaLayout (main Seva page)", () => {
    it("links Khalis Foundation, Sundar Gutka and SikhiToTheMax in the hero description", () => {
      const en = buildBundledSevaLayout("en");
      // Khalis Foundation is its own link to the org site (added 2026-07-24),
      // mirroring the backend's seva-content.ts.
      expect(en).toContain('<a href="https://khalisfoundation.org/">Khalis Foundation</a>');
      expect(en).toContain('<a href="https://khalisfoundation.org/">Sundar Gutka</a>');
      expect(en).toContain('<a href="https://www.sikhitothemax.org/">SikhiToTheMax</a>');
    });

    it("keeps the org name in each language's own script as the link label", () => {
      const pa = buildBundledSevaLayout("pa");
      expect(pa).toContain('<a href="https://khalisfoundation.org/">ਖਾਲਿਸ ਫਾਊਂਡੇਸ਼ਨ</a>');
      const fr = buildBundledSevaLayout("fr");
      // French keeps the article "La " outside the link.
      expect(fr).toContain('La <a href="https://khalisfoundation.org/">Khalis Foundation</a>');
    });

    it("leaves no unreplaced placeholder tokens in any language", () => {
      ["en", "hi", "pa", "fr", "it", "es"].forEach((lang) => {
        const html = buildBundledSevaLayout(lang);
        expect(html).not.toContain("{kf}");
        expect(html).not.toContain("{sg}");
        expect(html).not.toContain("{sttm}");
      });
    });

    it("still emits the hero, donate card slots and the four means rows", () => {
      const en = buildBundledSevaLayout("en");
      expect(en).toContain('class="seva-hero-title"');
      expect(en).toContain("<!--SLOT:donate_widget-->");
      expect(en).toContain("<!--SLOT:tax_note-->");
      // No closing quote: rows that open a form directly carry a trailing
      // `?open=<encoded url>` after the page key.
      ["social", "coding", "qa", "other"].forEach((page) =>
        expect(en).toContain(`href="seva-means:${page}`)
      );
    });
  });

  describe("buildBundledMeansPage (sub-pages)", () => {
    it("returns a titled, footer-terminated fragment for a known page", () => {
      const page = buildBundledMeansPage("seva-by-coding", "en");
      expect(page.title).toBe("Seva for Coders");
      expect(page.content).toContain('class="seva-footer"');
      expect(page.content).toContain('href="https://github.com/KhalisFoundation/sundar-gutka-react"');
    });

    it("describes the Slack link as the request form it opens, in every language", () => {
      // The link goes straight to the access-request form. The subtitle used to
      // send people to the repository README to find that form — a hunt for
      // something they had just tapped.
      ["en", "hi", "pa", "fr", "it", "es"].forEach((lang) => {
        const { content } = buildBundledMeansPage("seva-by-coding", lang);
        const row = content.match(
          /<p class="seva-link">[^<]*<a href="([^"]+)">[^<]*Slack[^<]*<\/a>([^<]*)<\/p>/
        );
        expect(row).not.toBeNull();
        expect(row[1]).toBe("https://forms.gle/zc7JQiLHGxHKXP599");
        expect(row[2]).not.toMatch(/README/);
        expect(row[2].trim().length).toBeGreaterThan(0);
      });
    });

    it("returns null for an unknown page key", () => {
      expect(buildBundledMeansPage("seva-by-nope", "en")).toBeNull();
    });

    it("Other-opportunities page is a plain intro + link, matching the other three pages (regression)", () => {
      // Regression: the page model here previously still pointed at a
      // "hero"/"other_soon" section that had been deleted from the
      // translation dict when the backend restyled this page — leaving raw,
      // untranslated key names ("other_soon") rendered as visible text for a
      // brand-new offline user. No `class="seva-hero-title"` should exist on
      // this page anymore, and no dictionary key should ever leak as text.
      ["en", "hi", "pa", "fr", "it", "es"].forEach((lang) => {
        const page = buildBundledMeansPage("seva-by-other", lang);
        expect(page.content).toContain('class="seva-intro"');
        expect(page.content).not.toContain('class="seva-hero-title"');
        expect(page.content).not.toContain("other_soon");
        expect(page.content).toContain('class="seva-footer"');
      });
    });
  });

  /**
   * The Seva copy lives in three places that MUST agree:
   *   1. the backend generator (seva/seva-content.ts, seva-means/content/*)
   *   2. this offline mirror of it (sevaBundledContent.js)
   *   3. the app's own localised strings (localization.js)
   *
   * SevaMeansScreen renders `data?.title || STRINGS[TITLE_KEYS[page]]`: the app
   * string paints immediately and the server's replaces it once the fetch
   * lands. So when (3) disagrees with (1)/(2) the header visibly changes
   * mid-open. That shipped once — the app said "Seva by spreading the word"
   * while the server said "Seva by Spreading the Word", and every open
   * flickered between the two. These tests pin (2) against (3) so it cannot
   * happen again silently.
   *
   * (1) vs (2) needs the running API and so is not asserted here; the two are
   * deliberate mirrors and must always be edited as a pair.
   */
  describe("parity with the app's own localised strings", () => {
    // Must mirror TITLE_KEYS in SevaMeansScreen.jsx.
    const TITLE_KEYS = {
      "seva-by-social-media": "SEVA_SPREAD_WORD",
      "seva-by-coding": "SEVA_FOR_CODERS",
      "seva-by-qa": "SEVA_BY_TESTING",
      "seva-by-other": "SEVA_OTHER_OPPORTUNITIES",
    };
    const LANGS = ["en", "hi", "pa", "fr", "it", "es"];
    // localization.js keys English as "en-US"; the generator uses "en".
    const localeKey = (lang) => (lang === "en" ? "en-US" : lang);

    it("sub-page titles match the placeholder the screen shows before the fetch", () => {
      LANGS.forEach((lang) => {
        Object.entries(TITLE_KEYS).forEach(([path, key]) => {
          const bundled = buildBundledMeansPage(path, lang).title;
          const appString = STRINGS.getString(key, localeKey(lang));
          // Prefixed so a failure names the page and language that drifted.
          expect(`${path}/${lang}: ${bundled}`).toBe(`${path}/${lang}: ${appString}`);
        });
      });
    });

    it("every page has a non-empty title and body in every language", () => {
      LANGS.forEach((lang) => {
        Object.keys(TITLE_KEYS).forEach((path) => {
          const built = buildBundledMeansPage(path, lang);
          expect(`${path}/${lang} title`).toBe(built.title.trim() ? `${path}/${lang} title` : "");
          expect(built.content.trim()).not.toBe("");
        });
      });
    });

    it("the main layout carries all four means rows and no dead links", () => {
      LANGS.forEach((lang) => {
        const html = buildBundledSevaLayout(lang);
        ["social", "coding", "qa", "other"].forEach((page) => {
          expect(html).toContain(`href="seva-means:${page}`);
        });
        expect(html).not.toContain('href=""');
      });
    });
  });
});
