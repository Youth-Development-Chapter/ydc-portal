const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..', '..');

function search(dir) {
  if (dir.includes('node_modules') || dir.includes('.next') || dir.includes('.git') || dir.includes('composer-cache')) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      search(fullPath);
    } else {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes("from('profiles')")) {
          console.log(`Found in: ${fullPath}`);
          // Print the line containing it
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes("from('profiles')")) {
              console.log(`  Line ${idx + 1}: ${line.trim()}`);
            }
          });
        }
      } catch (e) {
        // Skip binary/unreadable files
      }
    }
  }
}

search(rootDir);
