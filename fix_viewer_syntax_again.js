const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', 'utf8');

c = c.replace(
    /<div className="flex border border-slate-200" style=\{\{ height: 'calc\(100vh - 10rem\)', minHeight: '600px' \}\} dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 relative shadow-sm">/,
    `<div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 relative shadow-sm" style={{ height: 'calc(100vh - 10rem)', minHeight: '600px' }}>`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', c, 'utf8');