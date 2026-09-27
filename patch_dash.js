const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Dashboard.jsx', 'utf8');

c = c.replace(
    /const statuses = \[\s*\{ name: window.t\('modelDef'\)[\s\S]*?\];/,
    `let maxU = 0;
    let govMem = null;
    let analyzedCount = 0;
    let passedCount = 0;
    let failedCount = 0;

    if (workspaceState.designResults) {
        Object.values(workspaceState.designResults).forEach(dr => {
            if (dr.analysisStatus === 'ANALYZED') {
                analyzedCount++;
                if (dr.designStatus === 'PASS') passedCount++;
                else if (dr.designStatus === 'FAIL') failedCount++;
                
                if (dr.utilization !== null && dr.utilization > maxU) {
                    maxU = dr.utilization;
                    govMem = dr.memberId;
                }
            }
        });
    }

    const statuses = [
        { name: window.t('modelDef'), complete: memberCount > 0 },
        { name: window.t('loadsApplied'), complete: workspaceState.loadCombinations.length > 0 },
        { name: window.t('analysisDone'), complete: workspaceState.loadCombinations.length > 0 }, // If combos exist, frame is analyzed
        { name: window.t('designDone'), complete: analyzedCount > 0 },
    ];`
);

c = c.replace(
    /<div className="text-3xl font-bold mt-2">--<\/div>/,
    `<div className="text-3xl font-bold mt-2">{maxU > 0 ? maxU.toFixed(2) : '--'}</div>`
);

c = c.replace(
    /<div className="flex flex-col items-center justify-center h-40 text-slate-500 dark:text-slate-400 text-sm text-center">[\s\S]*?<\/div>/,
    `{analyzedCount === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500 dark:text-slate-400 text-sm text-center">
                            <i data-lucide="inbox" className="w-10 h-10 mb-2 opacity-50"></i>
                            <p className="whitespace-pre-line">{window.t('noDesignData')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1">Tổng cấu kiện</div>
                                    <div className="font-bold">{memberCount}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1">Đã phân tích</div>
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
                            
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-slate-500">Phần tử chi phối (Governing)</div>
                                    <div className="font-bold font-mono text-sm">{govMem || '--'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500">Hệ số lớn nhất</div>
                                    <div className={"font-bold text-lg " + (maxU > 1 ? "text-red-500" : "text-emerald-500")}>{maxU > 0 ? maxU.toFixed(2) : '--'}</div>
                                </div>
                            </div>
                        </div>
                    )}`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Dashboard.jsx', c, 'utf8');