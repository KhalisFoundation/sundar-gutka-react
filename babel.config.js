module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    [
      "module-resolver",
      {
        extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
        alias: {
          "@common": "./src/common",
          "@database": "./src/database/db",
          "@service": "./src/services",
          "@config": "./src/config",
        },
      },
    ],
    "react-native-reanimated/plugin",
  ],
};
