// js/components/WorkspaceReport.jsx
const WorkspaceReport = ({ workspaceState }) => {
    
    if (!workspaceState) return null;

    const members = workspaceState.members || [];
    const designResults = workspaceState.designResults || {};
    
    // Sort members: Columns first, then Beams
    const sortedMembers = [...members].sort((a, b) => {
        if (a.type === 'column' && b.type !== 'column') return -1;
        if (a.type !== 'column' && b.type === 'column') return 1;
        return a.id.localeCompare(b.id);
    });

    return (
        <div className="space-y-6 max-w-5xl mx-auto print:max-w-none">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 print:shadow-none print:border-none print:p-0">
                <div className="text-center mb-8 border-b dark:border-slate-700 pb-6">
                    <h1 className="text-2xl font-bold uppercase mb-2">Báo cáo Thuyết minh Tính toán Kết cấu</h1>
                    <h2 className="text-xl text-slate-600 dark:text-slate-400">{workspaceState.metadata?.name || 'Dự án (Project)'}</h2>
                    <div className="mt-4 flex justify-center gap-6 text-sm text-slate-500">
                        <span>Thiết kế (Designer): {workspaceState.metadata?.author || '--'}</span>
                        <span>Ngày (Date): {new Date().toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>

                <div className="space-y-8">
                    <section>
                        <h3 className="font-bold text-lg border-b-2 border-primary pb-2 mb-4 uppercase text-primary">1. Cơ sở Thiết kế (Design Basis)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-bold">Tiêu chuẩn Tải trọng (Load Code):</span> 
                                <span className="ml-2 font-mono">TCVN 2737:2023</span>
                            </div>
                            <div>
                                <span className="font-bold">Tiêu chuẩn Thép (Steel Code):</span> 
                                <span className="ml-2 font-mono">TCVN 5575:2024</span>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg border-b-2 border-primary pb-2 mb-4 uppercase text-primary">2. Vật liệu (Materials)</h3>
                        <table className="w-full text-sm border-collapse border border-slate-200 dark:border-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="border border-slate-200 dark:border-slate-700 p-2">Tên vật liệu</th>
                                    <th className="border border-slate-200 dark:border-slate-700 p-2">Cường độ chảy (fy)</th>
                                    <th className="border border-slate-200 dark:border-slate-700 p-2">Cường độ đứt (fu)</th>
                                    <th className="border border-slate-200 dark:border-slate-700 p-2">Modul đàn hồi (E)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workspaceState.materials.map(mat => (
                                    <tr key={mat.id}>
                                        <td className="border border-slate-200 dark:border-slate-700 p-2 font-bold">{mat.name}</td>
                                        <td className="border border-slate-200 dark:border-slate-700 p-2 font-mono">{mat.fy} MPa</td>
                                        <td className="border border-slate-200 dark:border-slate-700 p-2 font-mono">{mat.fu} MPa</td>
                                        <td className="border border-slate-200 dark:border-slate-700 p-2 font-mono">{mat.E} MPa</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg border-b-2 border-primary pb-2 mb-4 uppercase text-primary">3. Kết quả Kiểm tra (Design Results)</h3>
                        
                        {sortedMembers.map(member => {
                            const dr = designResults[member.id];
                            if (!dr || dr.analysisStatus !== 'ANALYZED') return null;

                            return (
                                <div key={member.id} className="mb-6 p-4 border border-slate-200 dark:border-slate-700 rounded break-inside-avoid">
                                    <div className="flex justify-between items-center mb-3 border-b dark:border-slate-700 pb-2">
                                        <h4 className="font-bold text-base">Phần tử (Member): {member.label} ({member.id})</h4>
                                        <span className={"px-3 py-1 text-sm font-bold rounded " + (dr.designStatus === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')}>
                                            {dr.designStatus === 'PASS' ? 'ĐẠT (PASS)' : 'KHÔNG ĐẠT (FAIL)'}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                        <div>
                                            <div className="text-slate-500 text-xs">Tiết diện (Section)</div>
                                            <div className="font-bold font-mono">{member.sectionId}</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 text-xs">Hệ số SD Max (Utilization)</div>
                                            <div className={"font-bold font-mono " + (dr.utilization > 1 ? 'text-red-500' : 'text-emerald-600')}>
                                                {dr.utilization.toFixed(3)}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="text-slate-500 text-xs">Điều kiện chi phối (Governing Check)</div>
                                            <div className="font-bold">{dr.governingCheck}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="text-slate-500 text-xs">Tổ hợp chi phối (Governing Combo)</div>
                                            <div className="font-bold font-mono text-amber-600">{dr.governingCombinationId || '--'}</div>
                                        </div>
                                    </div>

                                    {dr.checks && dr.checks.length > 0 && (
                                        <table className="w-full text-sm border-collapse border border-slate-200 dark:border-slate-700 mt-2">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                                <tr>
                                                    <th className="border border-slate-200 dark:border-slate-700 p-1.5 text-left">Điều kiện kiểm tra</th>
                                                    <th className="border border-slate-200 dark:border-slate-700 p-1.5 text-right w-32">Hệ số sử dụng</th>
                                                    <th className="border border-slate-200 dark:border-slate-700 p-1.5 text-center w-24">Kết luận</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dr.checks.map((chk, i) => (
                                                    <tr key={i}>
                                                        <td className="border border-slate-200 dark:border-slate-700 p-1.5">{chk.name}</td>
                                                        <td className="border border-slate-200 dark:border-slate-700 p-1.5 text-right font-mono">{chk.utilization ? chk.utilization.toFixed(3) : '--'}</td>
                                                        <td className="border border-slate-200 dark:border-slate-700 p-1.5 text-center font-bold">
                                                            <span className={chk.status === 'PASS' ? 'text-emerald-600' : 'text-red-500'}>
                                                                {chk.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            );
                        })}

                        {Object.values(designResults).filter(r => r.analysisStatus === 'ANALYZED').length === 0 && (
                            <div className="text-center text-slate-500 p-8 border border-dashed border-slate-300 dark:border-slate-700 rounded">
                                Chưa có dữ liệu phân tích (Analysis Not Run)
                            </div>
                        )}
                    </section>
                </div>
                
                <div className="mt-8 text-center print:block">
                    <button className="px-6 py-2 bg-primary text-white rounded font-bold shadow hover:bg-blue-700 print:hidden" onClick={() => window.print()}>
                        <i data-lucide="printer" className="w-4 h-4 inline mr-2"></i> In Báo Cáo
                    </button>
                </div>
            </div>
        </div>
    );
};

window.WorkspaceReport = WorkspaceReport;