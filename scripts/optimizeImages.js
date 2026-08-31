import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.join(__dirname, '../src/assets');

async function convertImage(fileName, options = { quality: 85 }) {
  const inputPath = path.join(assetsDir, fileName);
  const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
  const outputPath = path.join(assetsDir, `${baseName}.webp`);

  if (!fs.existsSync(inputPath)) {
    console.log(`File not found: ${inputPath}`);
    return;
  }

  const initialSize = fs.statSync(inputPath).size;
  await sharp(inputPath)
    .webp(options)
    .toFile(outputPath);

  const finalSize = fs.statSync(outputPath).size;
  const savings = (((initialSize - finalSize) / initialSize) * 100).toFixed(1);

  console.log(`✓ ${fileName} (${(initialSize / 1024).toFixed(1)} KB) -> ${baseName}.webp (${(finalSize / 1024).toFixed(1)} KB) | ${savings}% savings`);
}

async function main() {
  console.log('Optimizing static assets to WebP...');
  await convertImage('auth-illustration.png', { quality: 82 });
  await convertImage('bodh-chinha.png', { quality: 85 });
  await convertImage('itimitra-logo.png', { quality: 88 });
  await convertImage('dvet-logo.png', { quality: 88 });
  await convertImage('students.jpeg', { quality: 80 });
  await convertImage('logo.jpeg', { quality: 85 });
  console.log('Finished optimizing assets!');
}

main().catch(console.error);
