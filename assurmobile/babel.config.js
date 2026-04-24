module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // SDK 50+ includes Expo Router Babel setup in preset.
    // Keeping this empty avoids deprecation warnings during bundling.
    plugins: [],
  };
};

