const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/index.html', 'utf8');
c = c.replace(/\?v=\d+/g, '?v=' + Date.now());
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/index.html', c, 'utf8');