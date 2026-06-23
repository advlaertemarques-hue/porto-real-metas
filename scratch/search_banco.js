const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\.gemini\\antigravity\\scratch\\porto-real-metas\\src\\app\\(dashboard)\\gestao-geral\\page.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('banco') || line.includes('Banco')) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
}
