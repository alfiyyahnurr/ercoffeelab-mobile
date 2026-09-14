const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude Next.js build output directories (.next) from Metro file watcher in monorepo
config.resolver.blockList = [
  /.*\/apps\/admin\/\.next\/.*/,
  /.*\/apps\/api\/\.next\/.*/,
  /.*\.next.*/,
];

module.exports = config;
