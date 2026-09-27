const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

c = c.replace(/const mat = TCVN5575_2024\.getMaterialProperties/g, 'const mat = StandardData.TCVN5575_2024.getMaterialProperties');
c = c.replace(/StandardData\.TCVN5575_2024\.getMaterialProperties/g, 'null /* fallback to 23.5 */');

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');