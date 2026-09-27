const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/WorkspaceLayout.jsx', 'utf8');

// Increase sidebar width from w-64 (256px) to w-72 (288px) or w-80 (320px) to fit the bilingual text
c = c.replace(/className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/g, 'className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700');

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/WorkspaceLayout.jsx', c, 'utf8');