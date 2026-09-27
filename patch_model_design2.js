const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/workspace_model.js', 'utf8');

c = c.replace(
    /\/\/ 5\. RUN DESIGN CALCULATIONS \(Phase 3 Integration\)[\s\S]*?\/\/ Run initial validation/,
    `// 5. RUN DESIGN CALCULATIONS (Phase 3 Integration)
        if (window.EngineAdapter) {
            p.designResults = window.EngineAdapter.runAllCalculations(p);
        }
        
        // Run initial validation`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/workspace_model.js', c, 'utf8');