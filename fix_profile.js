const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/purlin_cladding.js', 'utf8');

c = c.replace(/profile\.name/g, 'purlin.name');
c = c.replace(/profile\.Wx/g, 'purlin.Wx');
c = c.replace(/profile\.Wy/g, 'purlin.Wy');
c = c.replace(/profile\.Ix/g, 'purlin.Ix');
c = c.replace(/profile\.Iy/g, 'purlin.Iy');

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/purlin_cladding.js', c, 'utf8');