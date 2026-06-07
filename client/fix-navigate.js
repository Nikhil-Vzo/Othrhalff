const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(path.join(__dirname, 'src'), function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    let newContent = content.replace(/navigate\(\-1\)/g, 'navigate.back()');
    
    // Replace navigate('...') or navigate(`...`) with navigate.push(...)
    // Match anything starting with ' or `
    // Also strip out the react-router { state: ... } objects because Next.js push doesn't support them.
    newContent = newContent.replace(/navigate\((['`].*?['`])(?:,\s*\{[\s\S]*?\})?\)/g, 'navigate.push($1)');

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Updated navigate() calls in: ' + filePath);
    }
});

console.log('Migration of navigate() calls complete.');
