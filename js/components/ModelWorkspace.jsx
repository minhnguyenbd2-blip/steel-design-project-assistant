// js/components/ModelWorkspace.jsx
// Quản lý không gian mô hình kết cấu và bảng dữ liệu cấu kiện (Model Workspace & Member Data Table)
// Ngôn ngữ ưu tiên: Tiếng Việt, thuật ngữ Tiếng Anh nếu có đi kèm nằm trong dấu () kế bên.

const ModelWorkspace = ({ workspaceState }) => {
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <Workspace3DViewer workspaceState={workspaceState} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <i data-lucide="table" className="w-5 h-5 text-primary"></i>
                    Bảng Dữ liệu Cấu kiện Kết cấu (Member Data Table)
                </h3>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 text-xs">
                            <tr>
                                <th className="p-2.5 border-b dark:border-slate-700 font-bold">Mã số (ID)</th>
                                <th className="p-2.5 border-b dark:border-slate-700 font-bold">Loại cấu kiện (Type)</th>
                                <th className="p-2.5 border-b dark:border-slate-700 font-bold">Vai trò kết cấu (Role)</th>
                                <th className="p-2.5 border-b dark:border-slate-700 font-bold">Tiết diện (Section)</th>
                                <th className="p-2.5 border-b dark:border-slate-700 font-bold text-right">Chiều dài (m)</th>
                                <th className="p-2.5 border-b dark:border-slate-700 font-bold text-center">Trạng thái (Status)</th>
                                <th className="p-2.5 border-b dark:border-slate-700 font-bold text-right">Hệ số SD (Max Util)</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs">
                            {(workspaceState?.members || []).map(m => {
                                const dr = workspaceState.designResults ? workspaceState.designResults[m.id] : null;
                                const isAnalyzed = dr && dr.analysisStatus === 'ANALYZED';
                                const isPass = dr && dr.designStatus === 'PASS';

                                // Chuyển đổi tên loại cấu kiện sang Tiếng Việt
                                const typeMap = {
                                    'column': 'Cột (Column)',
                                    'rafter': 'Kèo (Rafter)',
                                    'beam': 'Dầm (Beam)',
                                    'purlin': 'Xà gồ mái (Purlin)',
                                    'girt': 'Xà gồ tường (Girt)',
                                    'brace': 'Giằng (Brace)'
                                };
                                const typeName = typeMap[m.type] || m.type;

                                // Chuyển đổi vai trò sang Tiếng Việt
                                const roleMap = {
                                    'PRIMARY': 'Kết cấu chính (Primary)',
                                    'SECONDARY': 'Kết cấu phụ (Secondary)',
                                    'BRACING': 'Hệ giằng (Bracing)',
                                    'NON_STRUCTURAL': 'Phi kết cấu (Non-structural)'
                                };
                                const roleName = roleMap[m.role] || m.role || 'Chính (Primary)';

                                return (
                                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b dark:border-slate-700/50">
                                        <td className="p-2.5 font-mono font-medium">{m.id}</td>
                                        <td className="p-2.5">{typeName}</td>
                                        <td className="p-2.5 font-semibold text-slate-600 dark:text-slate-400">{roleName}</td>
                                        <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">{m.sectionId || '--'}</td>
                                        <td className="p-2.5 font-mono text-right">{m.length ? m.length.toFixed(3) : '--'}</td>
                                        <td className="p-2.5 text-center">
                                            {isAnalyzed ? (
                                                <span className={"px-2.5 py-1 rounded-full text-xs font-bold " + (isPass ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300')}>
                                                    {isPass ? 'ĐẠT (PASS)' : 'KHÔNG ĐẠT (FAIL)'}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">Chưa phân tích (Not Analyzed)</span>
                                            )}
                                        </td>
                                        <td className="p-2.5 font-mono font-bold text-right">
                                            {dr && dr.utilization !== null && dr.utilization !== undefined ? (
                                                <span className={dr.utilization > 1 ? 'text-red-500' : 'text-emerald-600'}>
                                                    {(dr.utilization * 100).toFixed(1)}%
                                                </span>
                                            ) : '--'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

window.ModelWorkspace = ModelWorkspace;