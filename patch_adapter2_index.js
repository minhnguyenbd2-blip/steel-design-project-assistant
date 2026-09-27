const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/index.html', 'utf8');

if (!c.includes('engine_adapter.js')) {
    c = c.replace('<script src="js/core/engine/slab_beam.js', '<script src="js/core/engine/slab_beam.js?v=' + Date.now() + '"></script>\n    <script src="js/core/adapters/engine_adapter.js');
    fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/index.html', c, 'utf8');
}