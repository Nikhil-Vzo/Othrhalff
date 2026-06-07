const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? 
            walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(path.join(__dirname, 'src'), function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    if (content.includes('react-router-dom')) {
        let lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.includes('react-router-dom')) {
                changed = true;
                let newLines = [];
                if (line.includes('Link')) {
                    newLines.push("import Link from 'next/link';");
                }
                
                let hooks = [];
                if (line.includes('useNavigate')) hooks.push('useRouter');
                if (line.includes('useLocation')) hooks.push('usePathname');
                if (line.includes('useParams')) hooks.push('useParams');
                if (line.includes('useSearchParams')) hooks.push('useSearchParams');
                if (line.includes('Outlet')) hooks.push('/* Outlet removed */'); // Not used in nextjs pages generally, handled by layout
                
                if (hooks.length > 0) {
                    newLines.push(`import { ${hooks.join(', ')} } from 'next/navigation';`);
                }

                if (line.includes('Navigate')) {
                    newLines.push("import { redirect as Navigate } from 'next/navigation';");
                }

                lines[i] = newLines.join('\n');
            } else if (line.includes('useNavigate(')) {
                lines[i] = line.replace(/useNavigate\(/g, 'useRouter(');
                changed = true;
            } else if (line.includes('navigate(')) {
                lines[i] = line.replace(/navigate\(/g, 'router.push(');
                changed = true;
            } else if (line.includes('<Link to=')) {
                lines[i] = line.replace(/<Link to=/g, '<Link href=');
                changed = true;
            }
        }
        
        if (changed) {
            fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
            console.log('Updated: ' + filePath);
        }
    }
});

console.log('Migration of react-router-dom imports complete.');
