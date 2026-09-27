const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Dashboard.jsx', 'utf8');

const startStr = `<div className="grid grid-cols-2 gap-4">`;
const endStr = `<div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">`;

const startIdx = c.indexOf(startStr);
const endIdx = c.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `<div className="grid grid-cols-2 gap-4">
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
                            
                            `;
    
    c = c.substring(0, startIdx) + replacement + c.substring(endIdx);
    fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Dashboard.jsx', c, 'utf8');
}