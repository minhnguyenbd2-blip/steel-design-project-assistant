// js/components/ModelWorkspace.jsx
const ModelWorkspace = ({ workspaceState }) => {
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <Workspace3DViewer workspaceState={workspaceState} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg mb-4">Bảng dữ liệu Cấu kiện (Member Data Table)</h3>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                            <tr>
                                <th className="p-2 border-b dark:border-slate-700 font-bold">ID</th>
                                <th className="p-2 border-b dark:border-slate-700 font-bold">Loại (Type)</th>
                                <th className="p-2 border-b dark:border-slate-700 font-bold">Vai trò (Role)</th>
                                <th className="p-2 border-b dark:border-slate-700 font-bold">Tiết diện</th>
                                <th className="p-2 border-b dark:border-slate-700 font-bold">Chiều dài (m)</th>
                                <th className="p-2 border-b dark:border-slate-700 font-bold">Trạng thái (Status)</th>
                                <th className="p-2 border-b dark:border-slate-700 font-bold">Max Utilization</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(workspaceState?.members || []).map(m => {
                                const dr = workspaceState.designResults ? workspaceState.designResults[m.id] : null;
                                return (
                                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b dark:border-slate-700/50">
                                        <td className="p-2 font-mono">{m.id}</td>
                                        <td className="p-2 capitalize">{m.type}</td>
                                        <td className="p-2 font-bold text-xs">{m.role || 'N/A'}</td>
                                        <td className="p-2 font-mono text-blue-600 dark:text-blue-400">{m.sectionId || '--'}</td>
                                        <td className="p-2 font-mono">{m.length ? m.length.toFixed(3) : '--'}</td>
                                        <td className="p-2">
                                            {dr && dr.analysisStatus === 'ANALYZED' ? (
                                                <span className={"px-2 py-0.5 rounded text-xs font-bold " + (dr.designStatus === 'PASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                                                    {dr.designStatus}
                                                </span>
                                            ) : <span className="text-slate-400 text-xs">NOT ANALYZED</span>}
                                        </td>
                                        <td className="p-2 font-mono font-bold">
                                            {dr && dr.utilization ? (
                                                <span className={dr.utilization > 1 ? 'text-red-500' : 'text-emerald-500'}>
                                                    {dr.utilization.toFixed(3)}
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