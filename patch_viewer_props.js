const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', 'utf8');

c = c.replace(
    /function Building3DViewer\(\{(.*?)inputs(.*?)mode = 'geometry'(.*?)loadCases(.*?)defaultDir = '\+X'(.*?)\}\) \{/,
    "function Building3DViewer({ inputs, mode = 'geometry', loadCases, defaultDir = '+X', workspaceState }) {"
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', c, 'utf8');