const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/purlin_cladding.js', 'utf8');

const endOfRoofCladding = c.indexOf('designPurlin: function');
let topPart = c.substring(0, endOfRoofCladding);
let bottomPart = c.substring(endOfRoofCladding);

topPart = topPart.replace(/purlin\.name/g, 'profile.name');
topPart = topPart.replace(/purlin\.Wx/g, 'profile.Wx');
topPart = topPart.replace(/purlin\.Wy/g, 'profile.Wy');
topPart = topPart.replace(/purlin\.Ix/g, 'profile.Ix');
topPart = topPart.replace(/purlin\.Iy/g, 'profile.Iy');

c = topPart + bottomPart;
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/purlin_cladding.js', c, 'utf8');