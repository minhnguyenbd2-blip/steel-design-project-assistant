const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/CalculationBlock.jsx', 'utf8');

c = c.replace(
    /<div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-5 transition-all hover:shadow-md"/g,
    '<div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-500 shadow-md overflow-hidden mb-8 transition-all hover:shadow-lg"'
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/CalculationBlock.jsx', c, 'utf8');