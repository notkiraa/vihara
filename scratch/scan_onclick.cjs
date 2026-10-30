const fs = require('fs');

['js/app.js', 'js/admin.js', 'js/superadmin.js', 'js/qr.js'].forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('onclick=') && l.includes('${')) {
      console.log(`${f}:${i+1} -> ${l.trim()}`);
    }
  });
});
