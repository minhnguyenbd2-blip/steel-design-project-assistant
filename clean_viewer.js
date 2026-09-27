const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', 'utf8');

c = c.replace(
    /className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 relative shadow-sm"/,
    `className="flex rounded-t-xl overflow-hidden bg-white dark:bg-slate-900 relative"`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', c, 'utf8');