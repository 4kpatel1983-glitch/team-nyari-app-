module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ⚡ react-native-reanimated માટે જરૂરી પ્લગિન (તે list માં સૌથી છેલ્લે હોવો જોઈએ)
      'react-native-worklets/plugin',
    ],
  };
};
