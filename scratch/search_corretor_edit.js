const fs = require('fs');

const filePath = 'c:\\Users\\Usuario\\.gemini\\antigravity\\scratch\\porto-real-metas\\src\\app\\(dashboard)\\gestao-geral\\page.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('corretor_id') && (line.includes('select') || line.includes('input') || line.includes('onChange') || line.includes('update'))) {
    console.log(`Line ${i+1}: ${line.trim()}`);
    // Print 10 lines around
    for (let k = Math.max(0, i - 5); k < Math.min(lines.length, i + 15); k++) {
      console.log(`${k+1}: ${lines[k]}`);
    }
  }
}
