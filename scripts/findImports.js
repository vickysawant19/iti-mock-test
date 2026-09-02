import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getImports(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getImports(fullPath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFiles = getImports(path.join(__dirname, '../src'));
const packageImports = new Map();

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.matchAll(/from\s+['"]([^.'"][^'"]*)['"]/g);
  for (const m of matches) {
    const raw = m[1];
    const pkg = raw.startsWith('@') ? raw.split('/').slice(0, 2).join('/') : raw.split('/')[0];
    if (!pkg.startsWith('@/') && !pkg.startsWith('./') && !pkg.startsWith('../')) {
      if (!packageImports.has(pkg)) {
        packageImports.set(pkg, []);
      }
      packageImports.get(pkg).push(path.relative(path.join(__dirname, '..'), file));
    }
  }
}

for (const [pkg, files] of Array.from(packageImports.entries()).sort()) {
  console.log(`- **${pkg}** (used in ${files.length} files)`);
}
