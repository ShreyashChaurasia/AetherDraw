import fs from 'fs';
import path from 'path';

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 1. Replace Documentation link
  if (/https?:\/\/docs\.excalidraw\.com[^\s"']*/.test(content)) {
    content = content.replace(
      /https?:\/\/docs\.excalidraw\.com[^\s"']*/g,
      'https://github.com/ShreyashChaurasia/AetherDraw#readme'
    );
    modified = true;
  }

  // 2. Replace Blog link with AetherDraw GitHub Repository
  if (/https?:\/\/(?:plus\.)?blog\.excalidraw\.com[^\s"']*/.test(content) || /https?:\/\/plus\.excalidraw\.com\/blog[^\s"']*/.test(content)) {
    content = content.replace(
      /https?:\/\/(?:plus\.)?blog\.excalidraw\.com[^\s"']*/g,
      'https://github.com/ShreyashChaurasia/AetherDraw'
    );
    content = content.replace(
      /https?:\/\/plus\.excalidraw\.com\/blog[^\s"']*/g,
      'https://github.com/ShreyashChaurasia/AetherDraw'
    );
    modified = true;
  }

  // 3. Replace Button Text "Read our blog" -> "GitHub Repository"
  if (/blog:\s*["']Read our blog["']/.test(content)) {
    content = content.replace(
      /blog:\s*["']Read our blog["']/g,
      'blog:"GitHub Repository"'
    );
    modified = true;
  }

  // 4. Replace Issues link
  if (/https?:\/\/github\.com\/excalidraw\/excalidraw\/issues(?:\/new)?/.test(content)) {
    content = content.replace(
      /https?:\/\/github\.com\/excalidraw\/excalidraw\/issues(?:\/new)?/g,
      'https://github.com/ShreyashChaurasia/AetherDraw/issues'
    );
    modified = true;
  }

  // 5. Replace YouTube channel link with demo link
  if (/https?:\/\/youtube\.com\/@excalidraw/.test(content)) {
    content = content.replace(
      /https?:\/\/youtube\.com\/@excalidraw/g,
      'https://youtu.be/Eb6vBb6xG7I'
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Patched: ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '.git') {
        walkDir(fullPath);
      }
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs') || entry.name.endsWith('.ts')) {
      patchFile(fullPath);
    }
  }
}

// Patch all files in node_modules/@excalidraw/excalidraw
walkDir(path.resolve('node_modules/@excalidraw/excalidraw'));

// Clear Vite dependency cache
const viteCacheDir = path.resolve('node_modules/.vite');
if (fs.existsSync(viteCacheDir)) {
  fs.rmSync(viteCacheDir, { recursive: true, force: true });
  console.log('Cleared Vite dependency cache (node_modules/.vite)');
}

console.log('Excalidraw help links & labels successfully patched across all bundles!');
