/**
 * Fail CI/EAS early if image assets are mislabeled (e.g. JPEG saved as .png).
 * Android AAPT rejects those during mergeReleaseResources.
 */
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIG = Buffer.from([0xff, 0xd8, 0xff]);

function checkFile(file) {
  const full = path.join(ASSETS, file);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing asset: ${file}`);
  }
  const head = fs.readFileSync(full).subarray(0, 8);
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png' && !head.equals(PNG_SIG)) {
    const isJpeg = head.subarray(0, 3).equals(JPEG_SIG);
    throw new Error(
      `${file} is not a real PNG` + (isJpeg ? ' (it is a JPEG with .png extension)' : ''),
    );
  }
  if ((ext === '.jpg' || ext === '.jpeg') && !head.subarray(0, 3).equals(JPEG_SIG)) {
    throw new Error(`${file} is not a real JPEG`);
  }
  console.log(`OK ${file}`);
}

['ucic-logo.png', 'ucic-icon.png', 'logo-light.png', 'login-logo.png', 'loginPageBackground.jpg'].forEach(
  checkFile,
);
console.log('Asset format check passed.');
