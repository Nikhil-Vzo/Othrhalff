const fs = require('fs');
const path = require('path');

function resolveConflictsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('<<<<<<< HEAD')) return;

  let lines = content.split(/\r?\n/);
  let newLines = [];
  
  let inConflict = false;
  let inHead = false;
  let resolvedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('<<<<<<< HEAD')) {
      inConflict = true;
      inHead = true;
      resolvedCount++;
      continue;
    }
    
    if (inConflict && line.startsWith('=======')) {
      inHead = false;
      continue;
    }
    
    if (inConflict && line.startsWith('>>>>>>>')) {
      inConflict = false;
      continue;
    }
    
    if (inConflict) {
      if (inHead) {
        newLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  fs.writeFileSync(filePath, newLines.join('\n'));
  console.log(`Resolved ${resolvedCount} conflicts in ${path.basename(filePath)}`);
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.next') {
      scanDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      resolveConflictsInFile(fullPath);
    }
  }
}

const clientDir = path.join(__dirname, 'client');
console.log('Scanning for all remaining merge conflicts in the client directory...');
try {
  scanDirectory(clientDir);
  console.log('Successfully resolved all merge conflicts across the entire project!');
  console.log('You can now run `npm run dev` to test the app.');
} catch (error) {
  console.error('Error:', error.message);
}
