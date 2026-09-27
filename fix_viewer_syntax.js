const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', 'utf8');

c = c.replace(
    /\{selectedMember \? \([\s\S]*?\) : \(/,
    `{selectedMember ? (
                    <div>
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-primary">PHẦN TỬ (MEMBER)</h3>
                            <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">{selectedMember.id}</span>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="text-xs text-slate-500 block">Tên (Label)</label>
                                <div className="font-medium">{selectedMember.label || 'Không tên'}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block">Loại (Type)</label>
                                <div className="font-medium capitalize">{selectedMember.type}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block">Chiều dài (Length)</label>
                                <div className="font-medium font-mono">{selectedMember.length ? selectedMember.length.toFixed(3) : '--'} m</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block">Tiết diện (Section)</label>
                                <div className="font-medium font-mono text-blue-600 dark:text-blue-400">{selectedMember.sectionId || '--'}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block">Vật liệu (Material)</label>
                                <div className="font-medium">{selectedMember.materialId || '--'}</div>
                            </div>
                            
                            {(() => {
                                const dr = workspaceState?.designResults ? workspaceState.designResults[selectedMember.id] : null;
                                if (!dr || dr.analysisStatus !== 'ANALYZED') {
                                    return (
                                        <div className="mt-6 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Kết quả (Status)</h4>
                                            <div className="flex justify-between items-center mb-1">
                                                <span>Hệ số SD (Utilization)</span>
                                                <span className="font-mono font-bold text-slate-400">N/A</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span>Đánh giá</span>
                                                <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded font-bold">CHƯA PHÂN TÍCH</span>
                                            </div>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <div className="mt-6 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Kết quả (Status)</h4>
                                        <div className="flex justify-between items-center mb-2">
                                            <span>Hệ số SD (Utilization)</span>
                                            <span className={"font-mono font-bold " + (dr.utilization > 1 ? "text-red-500" : (dr.utilization > 0.8 ? "text-orange-500" : "text-emerald-500"))}>
                                                {dr.utilization.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mb-3 pb-3 border-b dark:border-slate-700">
                                            <span>Đánh giá</span>
                                            <span className={"text-xs px-2 py-0.5 rounded font-bold " + (dr.designStatus === 'PASS' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" : "bg-red-100 text-red-700 dark:bg-red-900/30")}>
                                                {dr.designStatus === 'PASS' ? 'ĐẠT (PASS)' : 'KHÔNG ĐẠT (FAIL)'}
                                            </span>
                                        </div>
                                        
                                        {dr.governingCheck && (
                                            <div className="mb-2">
                                                <div className="text-xs text-slate-500">Điều kiện chi phối (Governing)</div>
                                                <div className="text-sm font-bold truncate" title={dr.governingCheck}>{dr.governingCheck}</div>
                                            </div>
                                        )}
                                        
                                        {dr.governingCombinationId && (
                                            <div>
                                                <div className="text-xs text-slate-500">Tổ hợp chi phối (Combo)</div>
                                                <div className="text-sm font-mono">{dr.governingCombinationId}</div>
                                            </div>
                                        )}
                                        
                                        {dr.calculationTrace && (
                                            <button 
                                                onClick={() => {
                                                    const win = window.open('', '_blank');
                                                    win.document.write('<html><head><title>Calculation Trace</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"></head><body style="font-family:sans-serif;padding:20px;line-height:1.6;max-width:800px;margin:0 auto;"><h2>Chi tiết tính toán - ' + selectedMember.id + '</h2>' + dr.calculationTrace + '</body></html>');
                                                }}
                                                className="mt-4 w-full py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                                            >
                                                <i data-lucide="file-search" className="w-3 h-3 inline mr-1"></i> Xem chi tiết (Trace)
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ) : (`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', c, 'utf8');