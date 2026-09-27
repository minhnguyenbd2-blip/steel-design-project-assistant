const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/adapters/engine_adapter.js', 'utf8');

c = c.replace(
    /const check = window\.checkSectionCapacity\(section, f\.N, f\.Mx, f\.Vx, matProps, L0x, L0y\);/,
    `const check = window.TCVN5575_2024 ? window.TCVN5575_2024.checkSectionCapacity(section, f.N, f.Mx, f.Vx, matProps, L0x, L0y) : window.checkSectionCapacity(section, f.N, f.Mx, f.Vx, matProps, L0x, L0y);`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/adapters/engine_adapter.js', c, 'utf8');