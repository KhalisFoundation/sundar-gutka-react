// const light = {
//   primary: "#2a3381",
//   primaryVariant: "#DEBB0A",
//   primaryAccent: "#5195ea",
// };
// const dark = {
//   primary: "#003436",
//   primaryVariant: "#99852c",
// };

export default {
  // ===== PRIMARY COLORS =====
  primary: "#2a3381", // Main brand color (was TOOLBAR_COLOR)
  primaryVariant: "#DEBB0A", // Secondary brand color (was TOOLBAR_COLOR_ALT)
  primaryDark: "#003436", // Dark variant (was TOOLBAR_COLOR_ALT2)
  primaryAccent: "", // Accent color (was SETTING_SWITCH_COLOR)

  // ===== SURFACE COLORS =====
  surface: "#faf9f6", // Main surface color (was WHITE_COLOR/LABEL_COLORS)
  surfaceVariant: "#e9e9ee", // Secondary surface (was MODAL_BACKGROUND)
  surfaceDark: "#121212", // Dark surface (was NIGHT_BLACK)
  surfaceGrey: "#464646", // Grey surface (was NIGHT_GREY_COLOR)

  // ===== TEXT COLORS =====
  textPrimary: "#222222", // Primary text (was LIGHT_MODE_COLOR)
  textSecondary: "#727272", // Secondary text (was HEADER_COLOR_2_LIGHT)
  textOnPrimary: "#faf9f6", // Text on primary (was TOOLBAR_TINT)
  textOnPrimaryDark: "#121212", // Text on primary dark (was TOOLBAR_TINT_DARK)
  textDisabled: "#a3a3a3", // Disabled text (was DISABLED_TEXT_COLOR)
  textEnabled: "#2581df", // Enabled text (was ENABELED_TEXT_COLOR)

  // ===== COMPONENT COLORS =====
  component: "#232323", // Component color (was COMPONENT_COLOR)
  componentDark: "#fefefe", // Component dark (was COMPONENT_COLOR_NIGHT_MODE)
  componentActive: "#C7C7D7", // Active component (was ACTIVE_VIEW_COLOR)
  componentInactive: "#e9e9ee", // Inactive component (was INACTIVE_VIEW_COLOR)
  componentActiveDark: "#2d2d2d", // Active component dark (was ACTIVE_VIEW_COLOR_NIGHT_MODE)
  componentInactiveDark: "#232323", // Inactive component dark (was INACTIVE_VIEW_COLOR_NIGHT_MODE)

  // ===== MODAL COLORS =====
  modalBackground: "#e9e9ee", // Modal background (was MODAL_BACKGROUND)
  modalBackgroundDark: "#202124", // Modal background dark (was MODAL_BACKGROUND_NIGHT_MODE)
  modalText: "#121212", // Modal text (was MODAL_TEXT)
  modalTextDark: "#faf9f6", // Modal text dark (was MODAL_TEXT_NIGHT_MODE)
  modalAccent: "#2581df", // Modal accent (was MODAL_ACCENT_NIGHT_MODE)
  modalAccentAlt: "#5195ea", // Modal accent alt (was MODAL_ACCENT_NIGHT_MODE_ALT)

  // ===== STATUS BAR COLORS =====
  statusBar: "#363C5D", // Status bar (was READER_STATUS_BAR_COLOR)
  statusBarDark: "#141a3c", // Status bar dark (was READER_STATUS_BAR_COLOR_NIGHT_MODE)
  headerFooter: "#171d47dd", // Header/footer (was READER_HEADER_COLOR/READER_FOOTER_COLOR)

  // ===== INTERACTIVE COLORS =====
  interactive: "#009bff", // Interactive elements (was UNDERLAY_COLOR)
  switchThumb: "#A7CAF8", // Switch thumb (was SETTING_SWITCH_THUMB)
  sliderTrackMax: "#464646", // Slider track max (was SLIDER_TRACK_MAX_TINT)
  sliderTrackMin: "#BFBFBF", // Slider track min (was SLIDER_TRACK_MIN_TINT)

  // ===== SEMANTIC COLORS =====
  success: "#16a085", // Success color (was VISHRAM_SHORT)
  warning: "#d35400", // Warning color (was VISHRAM_LONG)
  error: "#c0392b", // Error color (was VISHRAM_BASIC)
  info: "#5195ea", // Info color (was SETTING_SWITCH_COLOR)

  // ===== VISHRAAM COLORS (SPECIFIC TO GURBANI) =====
  vishraamShort: "#16a085", // Short vishraam (was VISHRAM_SHORT)
  vishraamLong: "#d35400", // Long vishraam (was VISHRAM_LONG)
  vishraamShortGradient: "rgba(22, 160, 133,1.0)", // Short vishraam gradient
  vishraamLongGradient: "rgba(211, 84, 0,1.0)", // Long vishraam gradient

  // ===== UTILITY COLORS =====
  shadow: "#000", // Shadow color (was SHADOW_COLOR)
  divider: "#aaa", // Divider color (was LIGHT_GRAY)
  overlay: "rgba(0,0,0,0.5)", // Overlay color (was MODAL_BACKGROUND_COLOR)
  overlayDark: "rgba(0, 0, 0, 0.5)", // Dark overlay (was NIGHT_OPACITY_BLACK)

  // ===== ANIMATION COLORS =====
  animationStroke: "#e6e6e6", // Animation stroke (was ANIMATION_STROKE_LIGHT)
  animationStrokeActive: "#007AFF", // Active animation stroke (was ANIMATION_STROKE_ACTIVE)

  // ===== BRAND COLORS =====
  banidb: "#eaa040", // BaniDB brand (was BANIDB_LIGHT)

  // ===== LEGACY COLORS (keeping for backward compatibility) =====
  // These can be gradually migrated to the new semantic names above
  TOOLBAR_COLOR: "#2a3381",
  READER_HEADER_COLOR: "#113979",
  READER_HEADER_COLOR_10: "rgba(17, 57, 121, 0.1)",
  READER_FOOTER_COLOR: "#113979",
  READER_STATUS_BAR_COLOR: "#363C5D",
  READER_STATUS_BAR_COLOR_NIGHT_MODE: "#141a3c",
  TOOLBAR_COLOR_ALT: "#DEBB0A",
  TOOLBAR_COLOR_ALT_NIGHT_MODE: "#99852c",
  TOOLBAR_COLOR_ALT2: "#003436",
  TOOLBAR_TINT: "#faf9f6",
  TOOLBAR_TINT_DARK: "#121212",

  SETTING_BACKGROUND_COLOR: "#efeff4",
  ACTIVE_VIEW_COLOR_NIGHT_MODE: "#2d2d2d",
  INACTIVE_VIEW_COLOR_NIGHT_MODE: "#232323",
  ACTIVE_VIEW_COLOR: "#C7C7D7",
  INACTIVE_VIEW_COLOR: "#e9e9ee",
  MODAL_BACKGROUND_NIGHT_MODE: "#202124",
  MODAL_BACKGROUND: "#e9e9ee",
  MODAL_ACCENT_NIGHT_MODE: "#2581df",
  MODAL_ACCENT_NIGHT_MODE_ALT: "#5195ea",
  MODAL_TEXT_NIGHT_MODE: "#faf9f6",
  MODAL_TEXT: "#121212",
  ENABELED_TEXT_COLOR_NIGHT_MODE: "#2581df",
  DISABLED_TEXT_COLOR_NIGHT_MODE: "#a3a3a3",
  ENABELED_TEXT_COLOR: "#2581df",
  DISABLED_TEXT_COLOR: "#a3a3a3",
  COMPONENT_COLOR_NIGHT_MODE: "#fefefe",
  COMPONENT_COLOR: "#232323",
  VISHRAM_SHORT: "#16a085",
  VISHRAM_LONG: "#d35400",
  VISHRAM_SHORT_GRADIENT: "rgba(22, 160, 133,1.0)",
  VISHRAM_LONG_GRADIENT: "rgba(211, 84, 0,1.0)",
  WHITE_COLOR: "#faf9f6",
  NIGHT_BLACK: "#121212",
  UNDERLAY_COLOR: "#009bff",
  BANI_ORDER_BACK_COLOR: "eee",
  IOS_SHADOW_COLOR: "rgba(0,0,0,0.2)",
  LIGHT_MODE_COLOR: "#222222",
  HOME_BACK_COLOR: "#faf9f6",
  SLIDER_TRACK_MAX_TINT: "#464646",
  SLIDER_TRACK_MIN_TINT: "#BFBFBF",
  VIEW_BACK_COLOR: "#464646",
  VISHRAM_BASIC: "#c0392b",
  MODAL_BACKGROUND_COLOR: "rgba(0,0,0,0.5)",
  LABEL_COLORS: "#faf9f6",
  NIGHT_GREY_COLOR: "#464646",
  HEADER_COLOR_1_DARK: "#77baff",
  HEADER_COLOR_1_LIGHT: "#0066ff",
  HEADER_COLOR_2_LIGHT: "#727272",
  BANIDB_LIGHT: "#eaa040",
  SHADOW_COLOR: "#000",
  LIGHT_GRAY: "#aaa",
  WHITE_TEXT: "#fff",
  ANIMATION_STROKE_LIGHT: "#e6e6e6",
  ANIMATION_STROKE_ACTIVE: "#007AFF",
  NIGHT_OPACITY_BLACK: "rgba(0, 0, 0, 0.5)",
  SEMI_TRANSPARENT: "rgba(255, 255, 255, 0.6)",
  SEMI_TRANSPARENT_STRONG: "rgba(255, 255, 255, 0.8)",
  SECONDARY_COLOR: "#e0e8f5",
  TERTIARY_COLOR: "#eeeeee",
  AUDIO_PLAYER_NIGHT_ICON: "#BED2F2",
  ACTION_BUTTON_COLOR: "#D3E1F7",
  ACTION_BUTTON_NIGHT_MODE: "#121F35",
  NIGHT_MODE_BLACK: "#333333",
  AUDIO_PLAYER_SETTING_TEXT: "#666",
};
