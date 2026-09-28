const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Dashboard.jsx', 'utf8');

c = c.replace(
    /const memberCount = workspaceState\.members\.length;/,
    `const memberCount = workspaceState.members ? workspaceState.members.length : 0;
    const primaryCount = workspaceState.members ? workspaceState.members.filter(m => m.role === 'PRIMARY').length : 0;
    const secondaryCount = workspaceState.members ? workspaceState.members.filter(m => m.role === 'SECONDARY').length : 0;
    const bracingCount = workspaceState.members ? workspaceState.members.filter(m => m.role === 'BRACING').length : 0;`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Dashboard.jsx', c, 'utf8');