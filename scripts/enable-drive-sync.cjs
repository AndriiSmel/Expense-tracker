const { spawnSync } = require('node:child_process');
const { copyFileSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dependencies = [
  '@react-native-google-signin/google-signin@16.0.0',
  '@noble/ciphers@1.3.0',
  'expo-crypto@~58.0.7',
  'expo-secure-store@~58.0.2',
];
const install = spawnSync('npm', ['install', ...dependencies], {
  cwd: root, stdio: 'inherit', shell: process.platform === 'win32',
});
if (install.error) throw install.error;
if (install.status !== 0) process.exit(install.status ?? 1);
copyFileSync(
  path.join(__dirname, 'driveNativeBinding.template'),
  path.join(root, 'src', 'core', 'driveNativeBinding.ts'),
);
console.log('Drive dependencies installed. Configure Google OAuth and rebuild the native app.');
