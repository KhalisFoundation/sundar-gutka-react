# Configurable reader colors

## Scope and issue history

This change implements reader color preferences requested in [#18](https://github.com/KhalisFoundation/sundar-gutka-react/issues/18) and configurable dark-mode vishraam colors in [#70](https://github.com/KhalisFoundation/sundar-gutka-react/issues/70). Both requests were open when checked on 2026-09-07; no linked implementation was found. No duplicate issue is needed.

The editor covers the reading background, Gurmukhi text, two heading levels, transliteration, translations, short/long vishraams, and larivaar assist. Bani-list, bookmark, and Settings palettes discussed in the broader #18 are outside this PR. The PR should reference #18 without closing that entire request.

## Design

The existing Redux and ThemeProvider architecture is sufficient. A focused separation of reader color tokens from application chrome avoids a general theme-system refactor.

1. `src/theme/readerColors.js` owns default palettes, supported keys, validation, resolution, CSS variables, and contrast calculations.
2. The `readerColors` Redux slice stores only explicit overrides under `light` and `dark`. Existing root `redux-persist` storage persists the slice. Older installations with no slice use defaults without a database migration.
3. `ThemeProvider` resolves the palette for the effective light/dark mode, including system appearance, and exposes it as `theme.readerColors`. The Settings interface retains the application's standard palette so users can always reach Cancel or Reset.
4. The database formatter emits semantic CSS references for vishraams and larivaar assist instead of embedding fixed colors. The shared reader HTML template declares the resolved variables. A palette change therefore does not require a database query or new annotations.
5. `Settings/components/ReaderColors` owns an isolated draft. Save dispatches one action; Cancel and Android Back discard it. Reset clears only the edited mode's overrides and takes effect when saved. The mode is captured when the editor opens so a system appearance change during editing cannot save into the wrong mode.

The preference shape is intentionally small:

```js
readerColors: {
  light: { background: "#f5e6c8" },
  dark: { vishraamShort: "#e5a9ff" }
}
```

Only recognized keys and six-digit hex colors are accepted at the reducer and rendering boundaries. Invalid persisted values fall back to defaults and cannot introduce arbitrary CSS or markup. Future default changes remain available for keys the user has not overridden.

## Preview and contrast

The native editor offers labeled color fields, preset swatches, hex input, and a live WebView sample. The preview stays at the top when scrolling, uses the selected Gurbani font, and shows short and long pause markers with a legend. Translation and transliteration fields include a second sample line with additional space. Heading and larivaar selections preview their respective treatments.

The sample is the first line of Japji Sahib's first pauri. Its legacy text, Unicode text, English translation, and `sttm` pause positions come from the bundled `gutka_v01.db` (`mv_Banis_Shabad`, Bani 2). Preview formatting and fonts use the same helpers as the reader. The preview contains no application script or links, disables JavaScript, and limits navigation origins to blank pages and local files. Switching between colored words and gradients previews either style without changing the user's saved vishraam display setting.

Defaults provide at least 4.5:1 foreground/background contrast for each text token in both modes. Short and long pauses use teal and orange hues with separate light/dark values. Gradients derive a translucent highlight (77/255 alpha) from the chosen hue; the contrast indicator compares text against the composited highlight endpoint for a selected vishraam gradient. This indicator is guidance for the selected token, not a certification of every possible palette or overlap. Users may save low-contrast colors after seeing the warning.

Larivaar assist retains its existing alternating opacity until a custom assist color is selected. An explicit assist color uses full opacity. Existing vishraam markers take priority over assist text color on words with a pause. Pause source, positions, joining, paragraph formatting, and reading behavior use the existing implementation.

No new runtime dependency, native module, database schema change, or lockfile change is required. New labels live in the existing localization module and use its English fallback; additional locale translations need community review.

## Automated validation

Run the focused regression suites:

```sh
yarn test --runInBand src/theme/readerColors.test.js src/common/readerColorsReducer.test.js src/database/utils/index.test.js src/Settings/components/ReaderColors/ColorEditor.test.jsx
```

The suites exercise invalid persisted colors, upgrade defaults, mode isolation, reset, Unicode/legacy formatting, disabled vishraams, gradient CSS, larivaar priority, live preview, Save/Cancel, and system appearance changes. Component tests use a real Redux store and ThemeProvider; only the native WebView is mocked. Jest transforms `react-redux` so these tests can load its module entry point.

Before merging, also run `yarn lint` and `yarn test --runInBand`. Windows checkouts created with CRLF can trigger repository-wide Prettier line-ending errors. For this checkout, lint was run with `endOfLine: "auto"` and the ignored local `build/` tool cache excluded; this yielded no errors and one existing `index.js` console warning. No repository-wide formatting or Git configuration change is part of this PR.

The full suite reported 319 passing tests across 18 suites. Its process subsequently encountered the same pre-existing after-teardown timer error in `AudioTrackDialog` seen on the baseline (305 tests across 14 suites). The four new suites (14 tests) exit successfully on their own. The unrelated timer cleanup should be addressed separately.

## Device review and Mac continuation

Android debug native build succeeded with Node 20, Yarn 1.22, JDK 17, Android SDK 35, and the checked-in Gradle wrapper. A Pixel 5 API 35 x86_64 emulator was used to review light/dark previews, legacy font rendering, translation layout, custom vishraam colors, gradients, and persistence after restarting the app. The iOS production JavaScript bundle also compiled successfully. Platform-specific review remains important because Jest does not render native WebViews.

Repeat this matrix on Android and iOS before marking device review complete:

- Open Settings > Reader colors in Light, Dark, and system theme. Verify the intended mode is shown.
- Change background, text, headings, translation/transliteration, and both pause colors. Verify the live preview, contrast guidance, and reader agree.
- Check both colored words and gradients. Previewing a style must not toggle the saved vishraam setting.
- Test Save, Cancel, invalid hex, per-mode Reset, switching modes, and a full application restart.
- Test Gurbani Akhar and Baloo Paaji, larivaar assist, paragraph mode, enabled/disabled vishraams, and reading position after returning from Settings.
- Check narrow portrait, landscape, large system text, keyboard visibility, and VoiceOver/TalkBack. Confirm all controls remain reachable and the preview is legible.

For a Mac handoff, clone the fork and check out `codex/configurable-reader-colors`. Install the locked JavaScript dependencies with `yarn install --frozen-lockfile`. Use the repository Gemfile for Ruby dependencies (`bundle install`, then `cd ios && bundle exec pod install`). Run `yarn ios` or open `ios/SundarGutka.xcworkspace` in Xcode and choose an installed iOS simulator. Run Metro separately with `yarn start` if needed. Follow the repository's existing Firebase setup when required by a fresh environment.

Native iOS build, WKWebView rendering, and VoiceOver must be validated on a Mac; a successful iOS JavaScript bundle alone does not verify those. Git preserves code and this design note across machines. Local SDKs, dependencies, emulator images, build outputs, and uncommitted work must be set up or transferred separately.
