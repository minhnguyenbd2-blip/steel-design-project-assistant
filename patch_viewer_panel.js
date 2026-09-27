const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', 'utf8');

// 1. Add Utilization Heatmap colors to the 3D meshes
c = c.replace(
    /const material = new THREE\.MeshStandardMaterial\(\{[\s\S]*?roughness: 0\.4\s*\}\);/,
    `let colorHex = m.type === 'column' ? 0x64748b : 0x94a3b8;
                    const dr = workspaceState.designResults ? workspaceState.designResults[m.id] : null;
                    if (dr && dr.analysisStatus === 'ANALYZED') {
                        if (dr.utilization <= 0.5) colorHex = 0x10b981; // Green
                        else if (dr.utilization <= 0.8) colorHex = 0xf59e0b; // Yellow
                        else if (dr.utilization <= 1.0) colorHex = 0xf97316; // Orange
                        else colorHex = 0xef4444; // Red
                    }

                    const material = new THREE.MeshStandardMaterial({ 
                        color: colorHex,
                        roughness: 0.4
                    });`
);

// 2. Fix the Raycaster reset to use the same logic
c = c.replace(
    /mesh\.material\.color\.setHex\(mesh\.userData\.member\.type === 'column' \? 0x64748b : 0x94a3b8\);/,
    `let cHex = mesh.userData.member.type === 'column' ? 0x64748b : 0x94a3b8;
                const dr = workspaceState.designResults ? workspaceState.designResults[mesh.userData.member.id] : null;
                if (dr && dr.analysisStatus === 'ANALYZED') {
                    if (dr.utilization <= 0.5) cHex = 0x10b981;
                    else if (dr.utilization <= 0.8) cHex = 0xf59e0b;
                    else if (dr.utilization <= 1.0) cHex = 0xf97316;
                    else cHex = 0xef4444;
                }
                mesh.material.color.setHex(cHex);`
);

// 3. Update the Right Panel to display the actual results instead of "N/A"
c = c.replace(
    /const dr = null; \/\/ Placeholder for replace logic/,
    ''
);

const panelReplacement = `
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
`;

c = c.replace(
    /<div className="mt-6 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">[\s\S]*?<\/div>\s*<\/div>/,
    panelReplacement + '\n                        </div>'
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', c, 'utf8');