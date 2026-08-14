const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'views', 'Chat.tsx');

try {
  let content = fs.readFileSync(filePath, 'utf8');
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
        newLines.push(line); // Keep HEAD
      }
    } else {
      newLines.push(line);
    }
  }

  fs.writeFileSync(filePath, newLines.join('\n'));
  
  console.log(`Successfully resolved ${resolvedCount} merge conflicts in Chat.tsx!`);
  console.log('Please run `npm run dev` or refresh your browser to check if it works.');

} catch (error) {
  console.error('Error fixing Chat.tsx:', error.message);
}
