const fs = require('fs');

const content = `// js/components/WorkspaceReport.jsx
const WorkspaceReport = ({ workspaceState }) => {
    
    if (!workspaceState) return null;

    const members = workspaceState.members || [];
    const designResults = workspaceState.designResults || {};
    const loads = workspaceState.loads || [];
    const combos = workspaceState.loadCombinations || [];
    
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

                <div className="space-y-8 text-slate-800 dark:text-slate-200 leading-relaxed">
                    
                    <section>
                        <h3 className="font-bold text-lg border-b-2 border-primary pb-2 mb-4 uppercase text-primary">1. Cơ sở Thiết kế & Tiêu chuẩn Áp dụng</h3>
                        <div className="text-sm space-y-3 text-justify">
                            <p>Công trình được tính toán và thiết kế theo phương pháp Trạng thái Giới hạn (Limit State Design), đảm bảo đủ khả năng chịu lực (Độ bền, Ổn định) và điều kiện sử dụng bình thường (Độ võng, Chuyển vị).</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li><span className="font-bold">TCVN 2737:2023</span> - Tải trọng và tác động. Tiêu chuẩn thiết kế.</li>
                                <li><span className="font-bold">TCVN 5575:2024</span> - Kết cấu thép. Tiêu chuẩn thiết kế.</li>
                            </ul>
                        </div>
                    </section>
                    
                    <section>
                        <h3 className="font-bold text-lg border-b-2 border-primary pb-2 mb-4 uppercase text-primary">2. Tải trọng & Tổ hợp Tải trọng</h3>
                        <div className="text-sm space-y-4">
                            <p className="text-justify">
                                Tải trọng tác dụng lên công trình được xác định dựa trên công năng sử dụng và vị trí địa lý của công trình theo TCVN 2737:2023. Các loại tải trọng bao gồm:
                            </p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li><span className="font-bold">Tĩnh tải (Dead Load - TT):</span> Trọng lượng bản thân kết cấu thép, tôn lợp, xà gồ và các hệ thống kỹ thuật treo trần.</li>
                                <li><span className="font-bold">Hoạt tải (Live Load - HT):</span> Hoạt tải sửa chữa trên mái, tải trọng sử dụng trên sàn.</li>
                                <li><span className="font-bold">Tải trọng Gió (Wind Load - GX/GY):</span> Tính toán theo phân vùng áp lực gió, có xét đến hệ số khí động (c) tương ứng với từng mặt đón gió, khuất gió của công trình.</li>
                            </ul>
                            
                            {combos.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-bold mb-2">Bảng Tổ hợp Tải trọng (Load Combinations):</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs border-collapse border border-slate-200 dark:border-slate-700">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                                <tr>
                                                    <th className="border border-slate-200 dark:border-slate-700 p-2 text-left">Tên Tổ hợp</th>
                                                    <th className="border border-slate-200 dark:border-slate-700 p-2 text-left">Công thức Tổ hợp (Hệ số tin cậy)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {combos.map(c => (
                                                    <tr key={c.id}>
                                                        <td className="border border-slate-200 dark:border-slate-700 p-2 font-bold">{c.name}</td>
                                                        <td className="border border-slate-200 dark:border-slate-700 p-2">
                                                            {c.factors && Object.entries(c.factors).map(([loadId, factor]) => {
                                                                const ld = loads.find(l => l.id === loadId);
                                                                return ld ? \`\${factor} × \${ld.name}\` : '';
                                                            }).filter(Boolean).join(' + ')}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg border-b-2 border-primary pb-2 mb-4 uppercase text-primary">3. Vật liệu Kết cấu Thép</h3>
                        <div className="text-sm space-y-3">
                            <p className="text-justify">
                                Các đặc trưng cơ lý của vật liệu thép được lấy theo TCVN 5575:2024, phụ thuộc vào loại thép và bề dày bản thép. Hệ số điều kiện làm việc (γc) được lựa chọn phù hợp với tính chất chịu lực của từng cấu kiện.
                            </p>
                            <table className="w-full text-sm border-collapse border border-slate-200 dark:border-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="border border-slate-200 dark:border-slate-700 p-2">Mác thép</th>
                                        <th className="border border-slate-200 dark:border-slate-700 p-2">Cường độ chảy (fy)</th>
                                        <th className="border border-slate-200 dark:border-slate-700 p-2">Cường độ kéo đứt (fu)</th>
                                        <th className="border border-slate-200 dark:border-slate-700 p-2">Mô đun đàn hồi (E)</th>
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
                        </div>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg border-b-2 border-primary pb-2 mb-4 uppercase text-primary">4. Thuyết minh Kiểm tra Cấu kiện (Member Design)</h3>
                        
                        <div className="text-sm space-y-3 mb-6 text-justify">
                            <p>
                                Theo TCVN 5575:2024, các cấu kiện chịu uốn, nén uốn và kéo uốn được kiểm tra theo các điều kiện:
                            </p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li><span className="font-bold">Độ bền (Strength):</span> Đảm bảo ứng suất lớn nhất trong tiết diện không vượt quá cường độ tính toán nhân với hệ số điều kiện làm việc (f × γc).</li>
                                <li><span className="font-bold">Ổn định tổng thể (Global Stability):</span> Đảm bảo cấu kiện không bị mất ổn định trong mặt phẳng uốn và ngoài mặt phẳng uốn (Lateral Torsional Buckling). Hệ số uốn dọc (φ, φb, φe) được nội suy dựa trên độ mảnh (λ).</li>
                                <li><span className="font-bold">Độ võng & Độ mảnh (Deflection & Slenderness):</span> Kiểm tra độ mảnh giới hạn [λ] theo Bảng 25, 26 và độ võng lớn nhất so với độ võng cho phép [Δ] theo Phụ lục M.</li>
                            </ul>
                            <p className="italic text-slate-500">
                                Dưới đây là kết quả kiểm tra chi tiết cho các cấu kiện điển hình, với các bước tính toán được truy xuất trực tiếp từ Calculation Engine theo đúng công thức của TCVN 5575:2024.
                            </p>
                        </div>

                        {sortedMembers.map(member => {
                            const dr = designResults[member.id];
                            if (!dr || dr.analysisStatus !== 'ANALYZED') return null;

                            return (
                                <div key={member.id} className="mb-10 p-6 border border-slate-200 dark:border-slate-700 rounded-lg break-inside-avoid shadow-sm bg-slate-50/30 dark:bg-slate-900/20">
                                    <div className="flex justify-between items-center mb-4 border-b dark:border-slate-700 pb-3">
                                        <h4 className="font-bold text-lg text-primary">
                                            Cấu kiện: {member.label} (ID: {member.id})
                                        </h4>
                                        <span className={"px-4 py-1.5 text-sm font-bold rounded-full shadow-sm " + (dr.designStatus === 'PASS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200')}>
                                            {dr.designStatus === 'PASS' ? 'ĐẠT YÊU CẦU' : 'KHÔNG ĐẠT'}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm bg-white dark:bg-slate-800 p-4 rounded border border-slate-100 dark:border-slate-700">
                                        <div>
                                            <div className="text-slate-500 text-xs mb-1">Tiết diện (Section)</div>
                                            <div className="font-bold font-mono text-blue-600 dark:text-blue-400">{member.sectionId}</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 text-xs mb-1">Hệ số SD Max (Max Util)</div>
                                            <div className={"font-bold font-mono text-lg " + (dr.utilization > 1 ? 'text-red-500' : 'text-emerald-600')}>
                                                {dr.utilization.toFixed(3)}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="text-slate-500 text-xs mb-1">Tổ hợp & Nội lực chi phối (Governing)</div>
                                            <div className="font-bold text-amber-600 dark:text-amber-500">
                                                {dr.governingCombinationId || '--'} 
                                                {dr.internalForces && \` (N=\${dr.internalForces.N?.toFixed(1) || 0}kN, M=\${dr.internalForces.M?.toFixed(1) || 0}kNm, V=\${dr.internalForces.V?.toFixed(1) || 0}kN)\`}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">Điều kiện quyết định: {dr.governingCheck}</div>
                                        </div>
                                    </div>

                                    {/* Render the Calculation Steps via CalculationBlock */}
                                    {dr.calculationSteps && dr.calculationSteps.length > 0 && (
                                        <div className="mt-6 space-y-4">
                                            <h5 className="font-bold text-sm uppercase text-slate-500 dark:text-slate-400 mb-4 border-b border-dashed border-slate-200 dark:border-slate-700 pb-2">
                                                Chi tiết các bước tính toán (Calculation Trace)
                                            </h5>
                                            {dr.calculationSteps.map((step, idx) => (
                                                <div key={idx} className="print:break-inside-avoid">
                                                    {window.CalculationBlock ? (
                                                        <window.CalculationBlock step={step} />
                                                    ) : (
                                                        <div className="p-3 bg-red-50 text-red-500 text-xs">Error: CalculationBlock component not found.</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Summary Table if there are multiple checks (for Beam/Purlin compatibility) */}
                                    {(!dr.calculationSteps || dr.calculationSteps.length === 0) && dr.checks && dr.checks.length > 0 && (
                                        <table className="w-full text-sm border-collapse border border-slate-200 dark:border-slate-700 mt-4">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                                <tr>
                                                    <th className="border border-slate-200 dark:border-slate-700 p-2 text-left">Điều kiện kiểm tra</th>
                                                    <th className="border border-slate-200 dark:border-slate-700 p-2 text-right w-32">Hệ số sử dụng</th>
                                                    <th className="border border-slate-200 dark:border-slate-700 p-2 text-center w-24">Kết luận</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dr.checks.map((chk, i) => (
                                                    <tr key={i}>
                                                        <td className="border border-slate-200 dark:border-slate-700 p-2">{chk.name}</td>
                                                        <td className="border border-slate-200 dark:border-slate-700 p-2 text-right font-mono">{chk.utilization ? chk.utilization.toFixed(3) : '--'}</td>
                                                        <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-bold">
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
                            <div className="text-center text-slate-500 p-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <i data-lucide="calculator" className="w-12 h-12 mx-auto mb-3 opacity-20"></i>
                                <div className="text-lg font-bold mb-1">Chưa có dữ liệu phân tích</div>
                                <div className="text-sm">Vui lòng chạy Phân tích (Analysis) để tạo Thuyết minh.</div>
                            </div>
                        )}
                    </section>
                </div>
                
                <div className="mt-12 mb-8 text-center print:block">
                    <button className="px-8 py-3 bg-primary text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all print:hidden flex items-center justify-center mx-auto" onClick={() => window.print()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        In Thuyết minh Tính toán (Print Report)
                    </button>
                </div>
            </div>
        </div>
    );
};

window.WorkspaceReport = WorkspaceReport;
`

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/WorkspaceReport.jsx', content, 'utf8');