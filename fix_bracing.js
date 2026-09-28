const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/workspace_model.js', 'utf8');

c = c.replace(
    /if \(numFrames > 5\) bracedBays\.push\(Math\.floor\(\(numFrames - 1\) \/ 2\)\); \/\/ Middle bay/,
    `// Middle bay bracing removed as per user request`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/workspace_model.js', c, 'utf8');