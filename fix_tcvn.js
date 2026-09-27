const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/slab_beam.js', 'utf8');

c = c.replace(
    /const mat = StandardData\.TCVN5575_2024\.getMaterialProperties\(steelGrade\);/g,
    `const mat = null;`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/slab_beam.js', c, 'utf8');