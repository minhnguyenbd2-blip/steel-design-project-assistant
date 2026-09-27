const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

c = c.replace(/\{projectState\.slabResult && projectState\.slabResult\.steps && \(/g, '{rResults.slabResult && rResults.slabResult.steps && (');
c = c.replace(/\{projectState\.slabResult\.steps\.map/g, '{rResults.slabResult.steps.map');

c = c.replace(/\{projectState\.beamResult && projectState\.beamResult\.steps && \(/g, '{rResults.beamResult && rResults.beamResult.steps && (');
c = c.replace(/\{projectState\.beamResult\.steps\.map/g, '{rResults.beamResult.steps.map');

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');