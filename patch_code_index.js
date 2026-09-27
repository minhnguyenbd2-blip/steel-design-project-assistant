const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/index.html', 'utf8');

if (!c.includes('tcvn_2737_2023.js')) {
    c = c.replace('<script src="js/core/workspace_model.js', '<script src="js/core/codes/tcvn_2737_2023.js?v=' + Date.now() + '"></script>\n    <script src="js/core/workspace_model.js');
    fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/index.html', c, 'utf8');
}