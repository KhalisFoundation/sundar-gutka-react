<div align="center" style=" padding: 60px 20px; border-radius: 10px;">
  <img src="ios/SundarGutka/Images.xcassets/AppIcon.appiconset/Icon-marketing-1024x1024.png" alt="Sundar Gutka Logo" width="150" style="border-radius: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
</div>

# Sundar Gutka

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
[![Slack](https://img.shields.io/badge/Slack-Join%20Community-4A154B?logo=slack&logoColor=white)](https://khalis.slack.com)
![React Native](https://img.shields.io/badge/React%20Native-0.78+-61dafb)
![Yarn](https://img.shields.io/badge/package%20manager-yarn-2188b6)

Sundar Gutka is a feature-rich mobile application that provides access to Gurbani with extensive customization options for reading preferences, audio playback, translations, and more. The app supports both iOS and Android platforms and offers a seamless experience for daily Paath.

## ✨ Features

#### Reading Features

- **Multiple Font Options**: Choose from various Gurbani fonts including GurbaniAkharTrue, GurbaniAkharThickTrue, BalooPaaji, AnmolLipi, and more
- **Adjustable Font Size**: Five size options from Extra Small to Extra Large
- **Larivaar Mode**: Read Gurbani in continuous text format with optional assist mode
- **Paragraph Mode**: Toggle between traditional and paragraph formatting
- **Vishraam Options**: Color-coded or gradient punctuation marks for better reading flow
- **Auto Scroll**: Automatic scrolling synchronized with audio playback
- **Bookmarks**: Save and quickly navigate to your favorite Shabads
- **Position Saving**: Automatically saves your reading position for each Bani

#### Translation & Transliteration

- **Multiple Languages**: Support for English, Hindi, Punjabi, Spanish, French, Italian, and more
- **Transliteration**: Romanized text options (English, Hindi, Shahmukhi, IPA)
- **Translations**: English, Punjabi, and Spanish translations available
- **Multi-language UI**: Interface available in multiple languages

#### Audio Features

- **Audio Player**: Built-in audio playback with React Native Track Player
- **Audio Sync**: Synchronized scrolling with audio playback
- **Background Playback**: Continue listening when app is in background
- **Auto Play**: Automatic audio playback option
- **Default Audio Selection**: Choose preferred audio source

#### Customization Options

- **Theme Support**: Light and Dark themes
- **Bani Order**: Customize the order of Banis in your Gutka
- **Bani Length**: Select from different lengths (SGPC, Taksal, Medium, Long, Extra Long) for major Banis
- **Keep Screen Awake**: Prevent screen from sleeping during reading
- **Status Bar Control**: Show or hide status bar

#### Additional Features

- **Folders**: Organize Banis into folders
- **Reminders**: Set up notification reminders for daily Paath
- **Database Updates**: In-app database update functionality
- **Statistics**: Optional usage statistics collection
- **Donation Support**: Support the Khalis Foundation

## Kids Mode

A guided path through Japji Sahib for children, off until a parent turns it on in Settings. The code is under `src/KidsMode/`: `design/` holds the screens, `host/` what they need from this app (audio, recording, icons, art), and `scoring/` the client for the pronunciation service.

The service does not transcribe. It aligns the recording to the known text and scores each word against the reciter the child heard, in the recited form (terminal sihari and aunkar are written but not spoken). A word comes back as `like`, `check` or `unclear`, and a recording that cannot be aligned returns `unclear` with no score.

Two constants in `src/common/constant.js` point the app at a service: `KIDS_SCORING_URL` (empty keeps the online check off) and `KIDS_SCORING_API_KEY` (set at release, never commit it). Nothing is uploaded unless the parent also turns on "Check pronunciation online". Service code and method: https://github.com/Gurjaapk1/Ucharaan-2026.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: >= 18
- **Package Manager**: Yarn (recommended)
- **React Native CLI**: Follow the [React Native environment setup guide](https://reactnative.dev/docs/environment-setup)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/KhalisFoundation/sundar-gutka-react.git
   cd sundar-gutka-react
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

## 📱 Platform Setup

### Android Development

1. **Environment Setup**: Follow the [React Native Android setup guide](https://reactnative.dev/docs/environment-setup)

2. **Run the application**:

   ```bash
   yarn android
   ```

3. **Start Metro Bundler** (if not started automatically):

   ```bash
   yarn start
   ```

### iOS Development

1. **Environment Setup**: Follow the [React Native iOS setup guide](https://reactnative.dev/docs/environment-setup)

2. **Install CocoaPods dependencies**:

   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Run the application**:

   ```bash
   yarn ios
   ```

4. **Start Metro Bundler** (if not started automatically):

   ```bash
   yarn start
   ```

## 🏗️ Project Structure

For detailed project structure information, see [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

## 🛠️ Key Technologies

- **[React Native](https://github.com/facebook/react-native)**: ^0.78.0
- **[React](https://github.com/facebook/react)**: 19.0.0
- **[Redux Toolkit](https://github.com/reduxjs/redux-toolkit)**: State management
- **[React Navigation](https://github.com/react-navigation/react-navigation)**: Navigation library
- **[React Native Track Player](https://github.com/doublesymmetry/react-native-track-player)**: Audio playback
- **[React Native SQLite Storage](https://github.com/andpor/react-native-sqlite-storage)**: Local database
- **[Firebase](https://github.com/firebase/firebase-js-sdk)**: Analytics, Crashlytics, Messaging, Performance
- **[Anvaad JS](https://github.com/KhalisFoundation/anvaad-js)**: Gurbani transliteration library
- **[React Native WebView](https://github.com/react-native-webview/react-native-webview)**: HTML rendering for Gurbani text

## 📝 Available Scripts

- `start`: Start Metro bundler with ESLint
- `android`: Run Android app with ESLint
- `ios`: Run iOS app with ESLint
- `lint`: Run ESLint
- `test`: Run tests

## ⚙️ Configuration

### Firebase Setup

The app uses Firebase for:

- Analytics
- Crashlytics
- Push Notifications (Messaging)
- Performance Monitoring

Ensure `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are properly configured.

### Database

The app uses SQLite for local storage. Database files are located in:

- iOS: `ios/www/gutka_v01.db`
- Android: Bundled with the app

## 🎨 Customization

### Themes

The app supports light and dark themes. Theme configuration is located in `src/theme/`.

### Fonts

Custom fonts are located in `assets/fonts/`. Supported fonts include:

- GurbaniAkharTrue
- GurbaniAkharThickTrue
- GurbaniAkharHeavyTrue
- BalooPaaji2-Regular
- BalooPaaji2-SemiBold
- AnmolLipiSG

### Localization

Localization strings are managed in `src/common/localization.js`. The app supports multiple languages for the UI.

## 🧪 Testing

Run tests with:

```bash
yarn test
```

## 🎵 Audio Assets (M4A)

All audio files used in this app are in **M4A format** (AAC 128kbps inside an MP4 container). M4A is required over MP3 because ExoPlayer on Android can seek accurately within M4A files using the container's built-in index — this is what makes sync scroll work correctly on Android. MP3 seeking is estimate-based and causes progressive drift.

### Creating M4A Files

To convert a source audio file to the correct M4A format:

```bash
ffmpeg -y -i input.mp3 -codec:a aac -b:a 128k -map_metadata 0 -movflags +faststart output.m4a
```

- `-codec:a aac` — encodes audio as AAC inside an MP4 container
- `-b:a 128k` — 128kbps constant bitrate
- `-movflags +faststart` — moves the MP4 index (`moov` atom) to the front of the file so ExoPlayer can begin streaming instantly with a single HTTP request. **This flag is mandatory** — without it, streaming triggers multiple network round-trips before playback can start
- `-map_metadata 0` — preserves original metadata tags

### Important Notes

- **Never use MP3** — ExoPlayer's inaccurate seeking on MP3 breaks sync scroll on Android
- **Always include `-movflags +faststart`** — skipping it will cause buffering on stream seek
- **File naming**: Use PascalCase (e.g. `JapjiSahib.m4a`, not `japji-sahib.m4a`)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

For detailed contribution guidelines, please see [CONTRIBUTING.md](CONTRIBUTING.md).

**Before raising a pull request, please go through CONTRIBUTING.md.** We use `dev` branch as the development branch, while `master` is the production branch. You should branch out from `dev` branch and raise a PR against `dev` branch.

1. Fork the repository
2. Create your feature branch from `dev` (`git checkout -b feature/AmazingFeature dev`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request against the `dev` branch

## 📄 License

This project is maintained by the [Khalis Foundation](https://khalisfoundation.org).

## 🙏 Acknowledgments

- **BaniDB**: Sundar Gutka utilizes the open source Gurbani database and API used in many Gurbani applications, such as SikhiToTheMax
- **Khalis Foundation**: For maintaining and supporting this project

## 📞 Support

For information, suggestions, or help, visit:

- [Khalis Foundation](https://khalisfoundation.org)
- [BaniDB](https://www.banidb.com/)
- [Slack Channel](https://khalis.slack.com) - Join our community for discussions and support

## ⚠️ Important Notes

- Please respectfully cover your head and remove your shoes when using this app
- The app respects different sampardhas (traditions) and provides options for various Bani lengths while maintaining SGPC/Akaal Takht standards
- Bhul Chuk Maaf! (Please forgive any mistakes)

---

<div align="center" style="background-color: white; padding: 20px; border-radius: 10px;">
  <a href="https://khalisfoundation.org">
    <img src="images/khalislogo150.png" alt="Khalis Foundation" width="150" style="border-radius: 10px; margin: 10px;" />
  </a>
  <a href="https://www.banidb.com/">
    <img src="images/banidb-logo-full.png" alt="BaniDB" width="200" style="border-radius: 10px; margin: 10px;" />
  </a>
</div>