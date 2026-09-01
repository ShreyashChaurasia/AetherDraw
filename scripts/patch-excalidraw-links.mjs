import fs from 'fs';
import path from 'path';

const filesToPatch = [
  'node_modules/@excalidraw/excalidraw/dist/prod/index.js',
  'node_modules/@excalidraw/excalidraw/dist/dev/index.js',
];

for (const relPath of filesToPatch) {
  const filePath = path.resolve(relPath);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace Documentation link
  content = content.replace(
    'href:"https://docs.excalidraw.com"',
    'href:"https://github.com/ShreyashChaurasia/AetherDraw#readme"'
  );

  // Replace Blog link with Repo link or remove
  content = content.replace(
    'href:"https://plus.excalidraw.com/blog"',
    'href:"https://github.com/ShreyashChaurasia/AetherDraw"'
  );
  content = content.replace(
    'href:"https://blog.excalidraw.com"',
    'href:"https://github.com/ShreyashChaurasia/AetherDraw"'
  );

  // Replace Issues link
  content = content.replace(
    'href:"https://github.com/excalidraw/excalidraw/issues"',
    'href:"https://github.com/ShreyashChaurasia/AetherDraw/issues"'
  );

  // Replace YouTube link with general YouTube / demo placeholder
  content = content.replace(
    'href:"https://youtube.com/@excalidraw"',
    'href:"https://youtube.com"'
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Successfully patched help dialog links in ${relPath}`);
}
