const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/CalculationBlock.jsx', 'utf8');

c = c.replace(
    /function CalculationBlock\(\{ stepId, title, source, formulaLaTeX, substitutionLaTeX, result, unit, check = null, notes = "" \}\) \{/,
    `function CalculationBlock({ step }) {
    if (!step) return null;
    const { stepId, title, source, formulaLaTeX, substitutionLaTeX, result, unit, check = null, notes = "" } = step;`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/CalculationBlock.jsx', c, 'utf8');