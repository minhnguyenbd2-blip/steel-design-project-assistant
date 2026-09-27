const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

c = c.replace(
    /workspaceState \? <Workspace3DViewer workspaceState=\{workspaceState\} \/> : <div>Loading 3D Viewer\.\.\.<\/div>/,
    `workspaceState ? <ModelWorkspace workspaceState={workspaceState} /> : <div>Loading 3D Model...</div>`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');