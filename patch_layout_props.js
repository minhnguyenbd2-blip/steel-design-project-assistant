const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

c = c.replace(
    /<WorkspaceLayout \s*activeModule=\{activeModule\}/,
    `<WorkspaceLayout 
            workspaceState={workspaceState}
            activeModule={activeModule}`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');