const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/workspace_model.js', 'utf8');

c = c.replace(
    /\/\/ 4\. LOAD CASES & COMBINATIONS[\s\S]*?\/\/ Infer from legacy forces/,
    `// 4. LOAD CASES & COMBINATIONS
        p.loadCases.push({ id: 'lc-g', name: 'Tĩnh tải (Dead Load)', category: 'DEAD', factor: 1.1 });
        p.loadCases.push({ id: 'lc-q', name: 'Hoạt tải mái (Live Load)', category: 'LIVE', factor: 1.2 });
        p.loadCases.push({ id: 'lc-wX', name: 'Gió X (Wind X)', category: 'WIND', factor: 1.2 });
        p.loadCases.push({ id: 'lc-wY', name: 'Gió Y (Wind Y)', category: 'WIND', factor: 1.2 });

        // Auto-generate TCVN 2737 Combinations (Phase 4)
        if (window.TCVN2737_2023) {
            const autoCombos = window.TCVN2737_2023.generateCombinations(p.loadCases);
            p.loadCombinations.push(...autoCombos);
        }

        // Infer from legacy forces (Legacy Fallback)`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/workspace_model.js', c, 'utf8');