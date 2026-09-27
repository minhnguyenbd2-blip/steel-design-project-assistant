const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

// 1. Hide the nav if not in 'design' module
c = c.replace(
    /<nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 print:hidden shadow-sm">/,
    '<nav className={`bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 print:hidden shadow-sm ${activeModule === \'design\' ? \'\' : \'hidden\'}`}>'
);

// 2. Hide specific buttons
// Button 1 (input)
c = c.replace(
    /onClick=\{\(\) => setActiveTab\('input'\)\}>/g,
    'onClick={() => setActiveTab(\'input\')} style={{ display: \'none\' }}>'
);
// Button 2 (loads)
c = c.replace(
    /onClick=\{\(\) => setActiveTab\('loads'\)\}>/g,
    'onClick={() => setActiveTab(\'loads\')} style={{ display: \'none\' }}>'
);
// Button 3 (forces)
c = c.replace(
    /onClick=\{\(\) => setActiveTab\('forces'\)\}>/g,
    'onClick={() => setActiveTab(\'forces\')} style={{ display: \'none\' }}>'
);
// Button 8 (report)
c = c.replace(
    /onClick=\{\(\) => setActiveTab\('report'\)\}>/g,
    'onClick={() => setActiveTab(\'report\')} style={{ display: \'none\' }}>'
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');