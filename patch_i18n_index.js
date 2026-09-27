const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/index.html', 'utf8');

if (!c.includes('i18n.js')) {
    c = c.replace('<script src="js/core/workspace_model.js', '<script src="js/core/i18n.js?v=' + Date.now() + '"></script>\n    <script src="js/core/workspace_model.js');
    fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/index.html', c, 'utf8');
}