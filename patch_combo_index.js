const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/index.html', 'utf8');

if (!c.includes('LoadCombinationManager.jsx')) {
    c = c.replace('<script type="text/babel" src="js/components/WorkspaceLayout.jsx', '<script type="text/babel" src="js/components/LoadCombinationManager.jsx?v=' + Date.now() + '"></script>\n    <script type="text/babel" src="js/components/WorkspaceLayout.jsx');
    fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/index.html', c, 'utf8');
}