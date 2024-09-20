// In babel.config.js or the appropriate file
module.exports = {
  presets: ["module:metro-react-native-babel-preset"],
  plugins: [
    [
      "module-resolver",
      {
        extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
        alias: {
          "@common": "./src/common",
          "@database": "./src/database/db",
        },
      },
    ],
    "react-native-reanimated/plugin",
  ],
};
