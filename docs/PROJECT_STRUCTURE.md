# Project Structure

```text
sundar-gutka-react/
├── android/                 # Android native code and configuration
├── ios/                     # iOS native code and configuration
├── src/
│   ├── AboutScreen/         # About screen component
│   ├── Bookmarks/           # Bookmarks functionality
│   ├── common/              # Shared utilities, components, and hooks
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── firebase/        # Firebase integration
│   │   └── ...
│   ├── database/            # SQLite database utilities
│   ├── DatabaseUpdate/      # Database update components
│   ├── EditBaniOrder/      # Bani ordering functionality
│   ├── FolderScreen/        # Folder navigation screen
│   ├── HomeScreen/          # Main home screen
│   ├── navigation/          # Navigation configuration
│   ├── ReaderScreen/        # Main reading interface
│   ├── services/            # Background services (TrackPlayer)
│   ├── Settings/            # Settings screen and components
│   └── theme/               # Theme configuration
├── assets/                  # Fonts and static assets
├── images/                  # Image assets
├── app.js                   # Main app entry point
├── index.js                 # App registration
└── package.json             # Dependencies and scripts
```

## Directory Descriptions

### Root Level

- **`android/`** - Android native code, Gradle configuration, and build files
- **`ios/`** - iOS native code, Xcode project files, and CocoaPods dependencies
- **`src/`** - Main application source code
- **`assets/`** - Static assets including fonts (Gurbani fonts, BalooPaaji, AnmolLipi)
- **`images/`** - Image assets and icons
- **`app.js`** - Main application entry point
- **`index.js`** - React Native app registration

### Source Code (`src/`)

- **`AboutScreen/`** - About screen with app information and credits
- **`Bookmarks/`** - Bookmark management functionality
- **`common/`** - Shared code used across the app
  - **`components/`** - Reusable UI components
  - **`context/`** - React context providers (theme, etc.)
  - **`hooks/`** - Custom React hooks
  - **`firebase/`** - Firebase integration and configuration
  - **`icons/`** - Custom icon components
- **`database/`** - SQLite database connection and utilities
- **`DatabaseUpdate/`** - Database update UI and logic
- **`EditBaniOrder/`** - Bani ordering customization
- **`FolderScreen/`** - Folder navigation and organization
- **`HomeScreen/`** - Main home screen with Bani list
- **`navigation/`** - Navigation configuration
- **`ReaderScreen/`** - Main reading interface with WebView
- **`services/`** - Background services (TrackPlayer for audio)
- **`Settings/`** - Settings screen and all setting components
- **`theme/`** - Theme configuration (light/dark modes)
