const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

c = c.replace(/Display > Show Tables/g, "Display &gt; Show Tables");
c = c.replace(/Analysis Results > Element Output > Frame Output > Element Forces - Frames/g, "Analysis Results &gt; Element Output &gt; Frame Output &gt; Element Forces - Frames");

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');