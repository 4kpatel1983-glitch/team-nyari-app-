const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Supabase "Unable to resolve module stream" fix
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
