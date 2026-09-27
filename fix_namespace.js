const fs = require('fs');

let c1 = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/codes/tcvn_2737_2023.js', 'utf8');
c1 = c1.replace(/window\.TCVN2737_2023 = \{/, 'window.CodeManager_TCVN2737 = {');
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/codes/tcvn_2737_2023.js', c1, 'utf8');

let c2 = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/codes/tcvn_5575_2024.js', 'utf8');
c2 = c2.replace(/window\.TCVN5575_2024 = \{/, 'window.CodeManager_TCVN5575 = {');
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/codes/tcvn_5575_2024.js', c2, 'utf8');

let m1 = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/workspace_model.js', 'utf8');
m1 = m1.replace(/window\.TCVN2737_2023/g, 'window.CodeManager_TCVN2737');
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/workspace_model.js', m1, 'utf8');

let a1 = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/adapters/engine_adapter.js', 'utf8');
a1 = a1.replace(/window\.TCVN5575_2024 \?/g, 'window.CodeManager_TCVN5575 ?');
a1 = a1.replace(/window\.TCVN5575_2024\.checkSectionCapacity/g, 'window.CodeManager_TCVN5575.checkSectionCapacity');
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/adapters/engine_adapter.js', a1, 'utf8');

let l1 = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/LoadCombinationManager.jsx', 'utf8');
l1 = l1.replace(/window\.TCVN2737_2023/g, 'window.CodeManager_TCVN2737');
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/LoadCombinationManager.jsx', l1, 'utf8');