const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/purlin_cladding.js', 'utf8');

c = c.replace(
    /const My1 = Math\.abs\(Px1\) \* Math\.pow\(B \/ 2, 2\) \/ 8;/g,
    `const numSagRods = B >= 8 ? 2 : 1;
        const L_giang = B / (numSagRods + 1);
        const My1 = Math.abs(Px1) * Math.pow(L_giang, 2) / 8;`
);

c = c.replace(
    /const B_half_cm = \(B \/ 2\) \* 100;/g,
    `const B_half_cm = L_giang * 100;`
);

c = c.replace(
    /const My2 = Math\.abs\(Px2\) \* Math\.pow\(B \/ 2, 2\) \/ 8;/g,
    `const My2 = Math.abs(Px2) * Math.pow(L_giang, 2) / 8;`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/purlin_cladding.js', c, 'utf8');