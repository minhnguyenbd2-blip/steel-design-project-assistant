const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Dashboard.jsx', 'utf8');

c = c.replace(
    /let memberCount = workspaceState\.members ? workspaceState\.members\.length : 0;/,
    `let memberCount = workspaceState.members ? workspaceState.members.length : 0;
    let primaryCount = workspaceState.members ? workspaceState.members.filter(m => m.role === 'PRIMARY').length : 0;
    let secondaryCount = workspaceState.members ? workspaceState.members.filter(m => m.role === 'SECONDARY').length : 0;
    let bracingCount = workspaceState.members ? workspaceState.members.filter(m => m.role === 'BRACING').length : 0;`
);

c = c.replace(
    /<div className="grid grid-cols-2 gap-4">[\s\S]*?<\/div>\s*<\/div>\s*<div className="bg-slate-50/,
    `<div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1">Kết cấu chính (Primary)</div>
                                    <div className="font-bold">{primaryCount}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1">Kết cấu phụ (Secondary)</div>
                                    <div className="font-bold">{secondaryCount}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1">Hệ giằng (Bracing)</div>
                                    <div className="font-bold">{bracingCount}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1">Đã phân tích (Analyzed)</div>
                                    <div className="font-bold text-blue-600 dark:text-blue-400">{analyzedCount}</div>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Đạt (PASS)</div>
                                    <div className="font-bold text-emerald-700 dark:text-emerald-300">{passedCount}</div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                                    <div className="text-xs text-red-600 dark:text-red-400 mb-1">Không đạt (FAIL)</div>
                                    <div className="font-bold text-red-700 dark:text-red-300">{failedCount}</div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Dashboard.jsx', c, 'utf8');