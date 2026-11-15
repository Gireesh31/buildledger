// Lets the app import the website's shared logic from ../src/lib (see "@/lib/*" in tsconfig.json).
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, "../src/lib")];
// Packages come from the app's own node_modules (the shared files import none of their own).
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];

module.exports = config;
