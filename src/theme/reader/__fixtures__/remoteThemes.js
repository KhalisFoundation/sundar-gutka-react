// The five designed themes, as the BACKEND serves them.
//
// They used to be bundled files under ../themes. They are database rows now,
// and this is the same data in the wire shape `GET /themes` returns — kept
// here so the remote path stays covered by the suite that used to cover them
// as bundled themes: the nav override, the texture, the frame variants, the
// seeded defaults and the screen scoping are all still exercised, just through
// mergeThemeRegistry instead of an import.
//
// Verified at extraction: each of these derives to EXACTLY the theme the app
// used to ship.

const REMOTE_THEMES = {
  blue: {
    id: "blue",
    position: 3,
    enabled: true,
    names: {
      "en-US": "Blue",
      hi: "नीला",
      pa: "ਨੀਲਾ",
      fr: "Bleu",
      it: "Blu",
      es: "Azul",
    },
    record: {
      base: "dark",
      palette: {
        ground: "#0A1A33",
        ink: "#E8F2FF",
        accent: "#7FC4FF",
        muted: "#8FB8E8",
        rule: "#1D3D6B",
      },
      vishraam: {
        main: "#FFA35C",
        yamki: "#5BD9B8",
      },
      typography: {
        lineHeightRatio: 1.65,
      },
      border: {
        width: 1,
      },
      nav: {
        primary: "#113979",
        onPrimary: "#ffffff",
      },
    },
  },
  kesari: {
    id: "kesari",
    position: 4,
    enabled: true,
    names: {
      "en-US": "Kesari",
      hi: "केसरी",
      pa: "ਕੇਸਰੀ",
      fr: "Kesari",
      it: "Kesari",
      es: "Kesari",
    },
    record: {
      base: "light",
      palette: {
        ground: "#FFF6E9",
        ink: "#5C2E00",
        accent: "#9A3412",
        muted: "#8A5A2B",
        rule: "#E8C89A",
      },
      vishraam: {
        main: "#B4530A",
        yamki: "#1F7A5C",
      },
      typography: {
        lineHeightRatio: 1.68,
      },
      border: {
        width: 1,
        radius: 4,
      },
    },
  },
  puratan: {
    id: "puratan",
    position: 5,
    enabled: true,
    names: {
      "en-US": "Puratan",
      hi: "पुरातन",
      pa: "ਪੁਰਾਤਨ",
      fr: "Puratan",
      it: "Puratan",
      es: "Puratan",
    },
    record: {
      base: "light",
      palette: {
        ground: "#F2E5C8",
        ink: "#2E1F0F",
        accent: "#6B2020",
        muted: "#6E5638",
        rule: "#C4A97A",
      },
      background: {
        image:
          "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22140%22%20height%3D%22140%22%3E%0A%20%20%3Cfilter%20id%3D%22g%22%3E%0A%20%20%20%20%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.82%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%0A%20%20%20%20%3CfeColorMatrix%20type%3D%22saturate%22%20values%3D%220%22%2F%3E%0A%20%20%3C%2Ffilter%3E%0A%20%20%3Crect%20width%3D%22140%22%20height%3D%22140%22%20filter%3D%22url(%23g)%22%2F%3E%0A%3C%2Fsvg%3E",
        imageOpacity: 0.16,
        imageRepeat: "repeat",
        imageSize: "140px 140px",
      },
      vishraam: {
        main: "#9C3B1B",
        yamki: "#5A6B1F",
      },
      typography: {
        lineHeightRatio: 1.72,
        preferredFontFace: "AnmolLipiSG",
      },
      border: {
        width: 1,
        radius: 2,
        inset: 12,
        gap: 5,
      },
    },
  },
  sanjh: {
    id: "sanjh",
    position: 7,
    enabled: true,
    names: {
      "en-US": "Sanjh",
      hi: "सांझ",
      pa: "ਸੰਝ",
      fr: "Sanjh",
      it: "Sanjh",
      es: "Sanjh",
    },
    record: {
      base: "dark",
      palette: {
        ground: "#1A1414",
        ink: "#F5E9DC",
        accent: "#E8A87C",
        muted: "#C0A392",
        rule: "#3A2E2A",
      },
      vishraam: {
        main: "#FF9A6B",
        yamki: "#7FD4B8",
      },
    },
  },
  white: {
    id: "white",
    position: 6,
    enabled: true,
    names: {
      "en-US": "White",
      hi: "सफ़ेद",
      pa: "ਚਿੱਟਾ",
      fr: "Blanc",
      it: "Bianco",
      es: "Blanco",
    },
    record: {
      base: "light",
      palette: {
        ground: "#FFFFFF",
        ink: "#000000",
        accent: "#000000",
        muted: "#333333",
      },
      vishraam: {
        main: "#8A2B00",
        yamki: "#00584A",
      },
      typography: {
        lineHeightRatio: 1.8,
        fontScale: 1.08,
      },
    },
  },
};

export const remoteThemeRows = Object.values(REMOTE_THEMES);
export const remoteThemeById = REMOTE_THEMES;
export default REMOTE_THEMES;
