const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/adapters/engine_adapter.js', 'utf8');

c = c.replace(/dr\.calculationTrace = govCheck\.steps\.map\(s => s\.html\)\.join\(''\);/g, 'dr.calculationSteps = govCheck.steps;');

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/adapters/engine_adapter.js', c, 'utf8');