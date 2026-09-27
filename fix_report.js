const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/ReportViewer.jsx', 'utf8');

c = c.replace(/const windSteps = projectState\.windResult \? projectState\.windResult\.steps : \[\];/g, 'const windSteps = projectState.results?.traces?.wind || [];');
c = c.replace(/const slabSteps = projectState\.slabResult \? projectState\.slabResult\.steps : \[\];/g, 'const slabSteps = projectState.results?.slabResult?.steps || [];');
c = c.replace(/const beamSteps = projectState\.beamResult \? projectState\.beamResult\.steps : \[\];/g, 'const beamSteps = projectState.results?.beamResult?.steps || [];');

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/ReportViewer.jsx', c, 'utf8');