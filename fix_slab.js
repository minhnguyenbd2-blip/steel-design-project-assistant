const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/slab_beam.js', 'utf8');

c = c.replace(/M\.toFixed\(2\)/g, 'M_span_kNm.toFixed(2)');
c = c.replace(/h0\.toFixed\(3\)/g, '(h0_cm / 100).toFixed(3)');
c = c.replace(/As_calc\.toFixed\(2\)/g, 'As_calc_cm2.toFixed(2)');
c = c.replace(/As_selected\.toFixed\(2\)/g, 'As_provided_cm2.toFixed(2)');
c = c.replace(/h0\*100/g, 'h0_cm');

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/slab_beam.js', c, 'utf8');