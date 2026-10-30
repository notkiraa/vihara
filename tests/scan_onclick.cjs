const fs = require('fs');

['public/js/app.js', 'public/js/admin.js', 'public/js/superadmin.js', 'public/js/qr.js'].forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('onclick=') && l.includes('${')) {
      console.log(`${f}:${i+1} -> ${l.trim()}`);
    }
  });
});

