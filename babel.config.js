module.exports = function (api) {
  api.cache(true);
  // SDK 54: babel-preset-expo react-native-worklets plugin automatically add kare chhe.
  // Pachi manually add karvani jarur nathi (double plugin = crash risk).
  return {
    presets: ['babel-preset-expo'],
  };
};
