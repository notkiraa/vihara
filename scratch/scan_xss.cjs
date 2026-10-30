const fs = require('fs');

const files = [
  'js/app.js',
  'js/admin.js',
  'js/superadmin.js',
  'js/qr.js',
  'js/data.js',
  'js/auth.js',
  'js/supabase-client.js'
];

console.log('=== XSS / INJECTION SCANNER ===');
files.forEach(f => {
  if (!fs.existsSync(f)) return;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('.innerHTML') || line.includes('document.write')) {
      // Find template string bounds
      let template = '';
      let endIdx = i;
      for (let j = i; j < Math.min(lines.length, i + 35); j++) {
        template += lines[j] + '\n';
        if (lines[j].includes(';') && (j > i || lines[j].indexOf(';') > lines[j].indexOf('.innerHTML'))) {
          endIdx = j;
          break;
        }
      }
      
      const interpolations = template.match(/\$\{([^}]+)\}/g);
      if (interpolations) {
        interpolations.forEach(m => {
          const raw = m.slice(2, -1).trim();
          // Filter known safe expressions
          const isSafe = raw.includes('escapeHTML') ||
                         raw.includes('getInitials') ||
                         raw.includes('formatDate') ||
                         raw.includes('SVG') ||
                         raw.includes('Svg') ||
                         raw.includes('Icon') ||
                         raw.includes('icon') ||
                         raw.includes('Badge') ||
                         raw.includes('badge') ||
                         raw.includes('===') ||
                         raw.includes('length') ||
                         raw.includes('Count') ||
                         raw.includes('Index') ||
                         raw.includes('index') ||
                         raw.startsWith('original') ||
                         raw.startsWith('orig') ||
                         raw.includes('JSON.stringify') ||
                         raw.includes('total') ||
                         raw.includes('pad');
          if (!isSafe) {
            console.log(`[POTENTIAL XSS] ${f}:${i + 1} -> ${m}`);
          }
        });
      }
    }
  }
});

