const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/slab_beam.js', 'utf8');

c = c.replace(/\(hs\*1000\)/g, '(hs_m * 1000)');

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/slab_beam.js', c, 'utf8');