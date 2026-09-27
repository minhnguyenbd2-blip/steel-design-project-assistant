// js/components/LoadCombinationManager.jsx
const LoadCombinationManager = ({ workspaceState }) => {
    
    if (!workspaceState || !workspaceState.loadCombinations) return null;

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6 border-b dark:border-slate-700 pb-3">
                    <h2 className="font-bold text-lg text-primary flex items-center gap-2">
                        <i data-lucide="layers" className="w-5 h-5"></i> 
                        Tổ hợp tải trọng (Load Combinations)
                    </h2>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700">
                        <i data-lucide="plus" className="w-4 h-4"></i> Thêm Tổ hợp
                    </button>
                </div>
                
                {workspaceState.loadCombinations.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <i data-lucide="inbox" className="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                        <p>Chưa có tổ hợp tải trọng nào (No Load Combinations)</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-3 border-b dark:border-slate-700">ID</th>
                                    <th className="p-3 border-b dark:border-slate-700">Tên (Name)</th>
                                    <th className="p-3 border-b dark:border-slate-700">Loại (Type)</th>
                                    <th className="p-3 border-b dark:border-slate-700">Công thức (Formula)</th>
                                    <th className="p-3 border-b dark:border-slate-700 text-center">Trạng thái</th>
                                    <th className="p-3 border-b dark:border-slate-700 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workspaceState.loadCombinations.map((combo, idx) => (
                                    <tr key={combo.id} className="border-b dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-3 font-mono text-slate-500 text-xs">
                                            {combo.id}
                                            {combo.legacyForce && <span className="block mt-1 text-[10px] text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/30 px-1 rounded inline-block">LEGACY MAP</span>}
                                        </td>
                                        <td className="p-3 font-bold">{combo.name}</td>
                                        <td className="p-3">
                                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-bold">
                                                {combo.category || 'ULS'}
                                            </span>
                                        </td>
                                        <td className="p-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                                            {window.TCVN2737_2023 && !combo.legacyForce ? window.TCVN2737_2023.formatCombinationFormula(combo, workspaceState.loadCases) : (combo.legacyForce ? combo.legacyForce.name : '--')}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded text-xs font-bold">
                                                Active
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button className="p-1 text-slate-400 hover:text-primary"><i data-lucide="edit-2" className="w-4 h-4"></i></button>
                                            <button className="p-1 text-slate-400 hover:text-red-500"><i data-lucide="trash-2" className="w-4 h-4"></i></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300">
                <p className="font-bold mb-1 flex items-center gap-1"><i data-lucide="info" className="w-4 h-4"></i> Ghi chú (Note)</p>
                <p>Trình tạo tổ hợp (Auto-Generator) theo TCVN 2737:2023 đã được kích hoạt. Các tổ hợp "auto-X" được sinh ra tự động từ các Load Cases. Các tổ hợp "comb-X" (LEGACY MAP) được ánh xạ từ hệ thống cũ để tương thích ngược.</p>
            </div>
        </div>
    );
};

window.LoadCombinationManager = LoadCombinationManager;