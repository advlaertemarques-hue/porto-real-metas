const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\.gemini\\antigravity\\scratch\\porto-real-metas\\src\\app\\(dashboard)\\gestao-geral\\page.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('activeView ===') || line.includes('activeView ====')) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
}
