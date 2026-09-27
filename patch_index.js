const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/index.html', 'utf8');

const insertPos = c.indexOf('<script src="js/core/models.js?v=');
const injection = `
    <!-- New Workspace Architecture -->
    <script src="js/core/workspace_model.js?v=20260928"></script>
    <script type="text/babel" src="js/components/WorkspaceLayout.jsx?v=20260928"></script>
    <script type="text/babel" src="js/components/Dashboard.jsx?v=20260928"></script>
`;
if (insertPos !== -1 && !c.includes('workspace_model.js')) {
    c = c.substring(0, insertPos) + injection + c.substring(insertPos);
    fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/index.html', c, 'utf8');
}