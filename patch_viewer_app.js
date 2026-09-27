const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

c = c.replace(/<Building3DViewer inputs=\{rInputs\} mode="geometry" \/>/, '<Building3DViewer inputs={rInputs} mode="geometry" workspaceState={workspaceState} />');
c = c.replace(/<Building3DViewer\s+inputs=\{rInputs\}\s+mode="wind"/, '<Building3DViewer workspaceState={workspaceState} inputs={rInputs} mode="wind"');

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');