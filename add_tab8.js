const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

const tab8Btn = `
                    <button className={\`px-4 py-3 font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 \${activeTab === 'report' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}\`} onClick={() => setActiveTab('report')}>
                        <i data-lucide="printer" className="w-4 h-4 text-emerald-600"></i> 8. Xuất Thuyết Minh
                    </button>
`;

c = c.replace(
    /<i data-lucide="book-open" className="w-4 h-4"><\/i> 7\. B[^<]+<\/button>/,
    `$&${tab8Btn}`
);

const tab8Content = `
                {/* ===================== TAB 8: REPORT VIEWER ===================== */}
                <div style={{ display: activeTab === 'report' ? 'block' : 'none' }}>
                    <ReportViewer projectState={projectState} />
                </div>
`;

c = c.replace(
    /\{\/\* ===================== TAB 7:/,
    `${tab8Content}\n                $&`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');