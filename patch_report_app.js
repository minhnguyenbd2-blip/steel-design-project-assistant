const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

c = c.replace(
    /\{activeModule === 'dashboard' \? \([\s\S]*?\) : activeModule === 'combinations' \? \([\s\S]*?\) : \(/,
    `{activeModule === 'dashboard' ? (
                workspaceState ? <Dashboard workspaceState={workspaceState} /> : <div>Initializing Workspace...</div>
            ) : activeModule === 'model' ? (
                workspaceState ? <Workspace3DViewer workspaceState={workspaceState} /> : <div>Loading 3D Viewer...</div>
            ) : activeModule === 'combinations' ? (
                workspaceState ? <LoadCombinationManager workspaceState={workspaceState} /> : <div>Loading Combinations...</div>
            ) : activeModule === 'report' ? (
                workspaceState ? <WorkspaceReport workspaceState={workspaceState} /> : <div>Loading Report...</div>
            ) : (`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');