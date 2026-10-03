// js/components/Dashboard.jsx
// Bảng điều khiển tổng quan dự án (Project Dashboard)
// Ngôn ngữ ưu tiên: Tiếng Việt, thuật ngữ Tiếng Anh nếu có đi kèm nằm trong dấu () kế bên.

const Dashboard = ({ workspaceState }) => {
    // Chỉ số dẫn xuất
    const memberCount = workspaceState.members ? workspaceState.members.length : 0;
    const primaryCount = workspaceState.members ? workspaceState.members.filter(m => m.role === 'PRIMARY').length : 0;
    const secondaryCount = workspaceState.members ? workspaceState.members.filter(m => m.role === 'SECONDARY').length : 0;
    const bracingCount = workspaceState.members ? workspaceState.members.filter(m => m.role === 'BRACING').length : 0;
    const materialCount = workspaceState.materials ? workspaceState.materials.length : 0;
    
    // Thống kê kết quả phân tích
    let maxU = 0;
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
        { name: '1. Khai báo Hình học (Geometry)', complete: workspaceState.nodes.length > 0 && workspaceState.members.length > 0 },
        { name: '2. Vật liệu & Tiết diện (Materials & Sections)', complete: workspaceState.materials.length > 0 && workspaceState.sections.length > 0 },
        { name: '3. Tải trọng & Tổ hợp (Loads & Combinations)', complete: workspaceState.loadCombinations.length > 0 },
        { name: '4. Phân tích Nội lực (Structural Analysis)', complete: analyzedCount > 0 },
        { name: '5. Thiết kế & Kiểm tra Cấu kiện (Design Check)', complete: analyzedCount > 0 && failedCount === 0 }
    ];

    const errorCount = workspaceState.validationResults?.issues?.filter(i => i.severity === 'ERROR' || i.severity === 'CRITICAL').length || 0;
    const warningCount = workspaceState.validationResults?.issues?.filter(i => i.severity === 'WARNING').length || 0;

    return (
        <div className="space-y-6">
            {/* Thẻ thống kê chính (Top Metric Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-between">
                        <span>Tổng số Cấu kiện (Members)</span>
                        <i data-lucide="layers" className="w-4 h-4 text-primary"></i>
                    </div>
                    <div className="text-3xl font-bold mt-2 text-slate-800 dark:text-slate-100">{memberCount}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-between">
                        <span>Tổ hợp Tải trọng (Load Combos)</span>
                        <i data-lucide="wind" className="w-4 h-4 text-emerald-500"></i>
                    </div>
                    <div className="text-3xl font-bold mt-2 text-slate-800 dark:text-slate-100">{workspaceState.loadCombinations.length}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-between">
                        <span>Hệ số SD lớn nhất (Max Utilization)</span>
                        <i data-lucide="activity" className="w-4 h-4 text-amber-500"></i>
                    </div>
                    <div className={"text-3xl font-bold mt-2 " + (maxU > 1 ? "text-red-500" : "text-emerald-600")}>
                        {maxU > 0 ? (maxU * 100).toFixed(1) + '%' : '--'}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-between">
                        <span>Cảnh báo & Lỗi (Issues)</span>
                        <i data-lucide="alert-triangle" className="w-4 h-4 text-red-500"></i>
                    </div>
                    <div className="text-3xl font-bold mt-2 text-red-500">{errorCount > 0 ? `${errorCount} Lỗi` : `${warningCount} Cảnh báo`}</div>
                </div>
            </div>

            {/* Chi tiết tiến độ và thống kê cấu kiện */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                    <h3 className="font-bold text-lg border-b dark:border-slate-700 pb-3 mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <i data-lucide="check-square" className="w-5 h-5 text-primary"></i>
                        Tiến trình Thiết kế Kỹ thuật (Workflow Status)
                    </h3>
                    <div className="space-y-4">
                        {statuses.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">{s.name}</span>
                                {s.complete ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                        <i data-lucide="check-circle" className="w-3.5 h-3.5"></i> Hoàn thành (Complete)
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                                        <i data-lucide="circle" className="w-3.5 h-3.5"></i> Đang chờ (Pending)
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                    <h3 className="font-bold text-lg border-b dark:border-slate-700 pb-3 mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <i data-lucide="pie-chart" className="w-5 h-5 text-primary"></i>
                        Tổng hợp Thiết kế Cấu kiện (Design Summary)
                    </h3>
                    {analyzedCount === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400 text-sm text-center">
                            <i data-lucide="inbox" className="w-10 h-10 mb-2 opacity-40"></i>
                            <p className="whitespace-pre-line">Chưa có kết quả thiết kế. Vui lòng chuyển sang tab Phân tích (Analysis) để tính toán nội lực và kiểm tra cấu kiện.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1">Kết cấu chính (Primary)</div>
                                    <div className="font-bold text-base text-slate-800 dark:text-slate-100">{primaryCount}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1">Kết cấu phụ (Secondary)</div>
                                    <div className="font-bold text-base text-slate-800 dark:text-slate-100">{secondaryCount}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1">Hệ giằng (Bracing)</div>
                                    <div className="font-bold text-base text-slate-800 dark:text-slate-100">{bracingCount}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1">Đã phân tích (Analyzed)</div>
                                    <div className="font-bold text-base text-blue-600 dark:text-blue-400">{analyzedCount}</div>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Đạt yêu cầu (PASS)</div>
                                    <div className="font-bold text-base text-emerald-700 dark:text-emerald-300">{passedCount}</div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                                    <div className="text-xs text-red-600 dark:text-red-400 mb-1">Không đạt (FAIL)</div>
                                    <div className="font-bold text-base text-red-700 dark:text-red-300">{failedCount}</div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                                <div>
                                    <div className="text-slate-500 mb-0.5">Cấu kiện chi phối nguy hiểm nhất (Governing Member):</div>
                                    <div className="font-bold font-mono text-sm text-amber-600 dark:text-amber-400">{govMem || '--'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-500 mb-0.5">Hệ số tận dụng lớn nhất (Max Ratio):</div>
                                    <div className={"font-bold text-base font-mono " + (maxU > 1 ? "text-red-500" : "text-emerald-600")}>
                                        {maxU > 0 ? (maxU * 100).toFixed(1) + '%' : '--'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

window.Dashboard = Dashboard;