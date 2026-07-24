/**
 * Expo SDK 50 + modern Node on Windows: builtinModules includes "node:sea"
 * which cannot be used as a folder name. Strip the "node:" prefix once.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  '@expo',
  'cli',
  'build',
  'src',
  'start',
  'server',
  'metro',
  'externals.js',
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

let source = fs.readFileSync(target, 'utf8');
const needle = '...(_module.builtinModules || // @ts-expect-error\n    (process.binding ? Object.keys(process.binding("natives")) : []) || []).filter((x)=>!/^_|^(internal|v8|node-inspect)\\/|\\//.test(x)';
const replacement = '...(_module.builtinModules || // @ts-expect-error\n    (process.binding ? Object.keys(process.binding("natives")) : []) || []).map((x)=>x.replace(/^node:/, "")).filter((x)=>!!x && !/^_|^(internal|v8|node-inspect)\\/|\\//.test(x)';

if (source.includes('.map((x)=>x.replace(/^node:/, ""))')) {
  process.exit(0);
}

if (!source.includes(needle)) {
  // Already patched or different Expo version — skip quietly
  process.exit(0);
}

source = source.replace(needle, replacement);
fs.writeFileSync(target, source);
console.log('[fix-expo-windows] Patched @expo/cli metro externals for Windows');
