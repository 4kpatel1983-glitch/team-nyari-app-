module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ⚡ આ પ્લગિન સૌથી છેલ્લે જ હોવો જોઈએ
      'react-native-worklets/plugin',
    ],
  };
};
