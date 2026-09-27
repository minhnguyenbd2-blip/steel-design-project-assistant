// Component Bản vẽ 2D Kỹ thuật Hình học Công trình (Project Architectural & Structural Elevations)
// Thiết kế chuẩn CAD/BIM 2D với lưới trục, tiết diện thép cột kèo, xà gồ, hệ giằng và đường gióng kích thước chuẩn mực

const ProjectSvg = ({ inputs }) => {
    const L = Number(inputs.L) || 25; // Nhịp khung ngang (m)
    const B = Number(inputs.B) || 9;  // Bước cột (m)
    const length = Number(inputs.length) || 72; // Chiều dài nhà (m)
    const H_col = Number(inputs.H_column) || 8.0; // Chiều cao cột (m)
    const H_rf = Number(inputs.H_roof) || 9.25;  // Chiều cao đỉnh mái (m)
    const purlinA = Number(inputs.purlinSpacing) || 1.2; // Bước xà gồ (m)
    
    const numBays = Math.max(2, Math.round(length / B));
    const roofRise = Math.max(0.1, H_rf - H_col);
    const slopePercent = ((roofRise / (L / 2)) * 100).toFixed(1);
    const alphaDeg = ((Math.atan(roofRise / (L / 2)) * 180) / Math.PI).toFixed(2);
    const halfSpan = (L / 2).toFixed(1);

    return (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-xl text-slate-200 my-4">
            <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-700 mb-4 gap-2">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <i data-lucide="compass" className="w-5 h-5 text-primary"></i>
                        BẢN VẼ HÌNH HỌC 2D KẾT CẤU CÔNG TRÌNH (CHUẨN ĐỒ ÁN THÉP)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Mô hình khung ngang điển hình nhịp <strong className="text-primary font-mono">{L}m</strong>, 
                        bước cột <strong className="text-primary font-mono">{B}m</strong>, 
                        chiều dài <strong className="text-primary font-mono">{length}m</strong> ({numBays} bước).
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded bg-blue-900/60 border border-blue-700 text-blue-300 font-mono">
                        i = {slopePercent}%
                    </span>
                    <span className="px-2.5 py-1 rounded bg-indigo-900/60 border border-indigo-700 text-indigo-300 font-mono">
                        α = {alphaDeg}°
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* 1. Mặt đứng đầu hồi (Khung ngang mái dốc 2 phía) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col">
                    <div className="flex justify-between items-center text-xs font-bold text-amber-300 mb-2 pb-1 border-b border-slate-800">
                        <span>1. MẶT CẮT NGANG ĐIỂN HÌNH (KHUNG TIỆP 2 PHÍA)</span>
                        <span className="text-[11px] text-slate-400 font-mono">TL: 1/150</span>
                    </div>

                    <div className="overflow-x-auto flex justify-center py-2">
                        <svg width="440" height="250" viewBox="0 0 440 250" className="max-w-full">
                            <defs>
                                <marker id="cad-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                    <polygon points="0 0, 6 3, 0 6" fill="#94a3b8" />
                                </marker>
                                <marker id="cad-arrow-start" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
                                    <polygon points="6 0, 0 3, 6 6" fill="#94a3b8" />
                                </marker>
                                <pattern id="hatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                                    <line x1="0" y1="0" x2="0" y2="6" stroke="#475569" strokeWidth="1" />
                                </pattern>
                            </defs>

                            {/* Cao độ tự nhiên & Mặt đất */}
                            <line x1="20" y1="200" x2="420" y2="200" stroke="#334155" strokeWidth="1.5" strokeDasharray="6,3" />
                            <text x="422" y="203" fill="#64748b" fontSize="8" fontMono="true">±0.000</text>

                            {/* Móng và Cổ móng (Pedestal) */}
                            <rect x="52" y="196" width="36" height="14" fill="url(#hatch)" stroke="#475569" strokeWidth="1" />
                            <rect x="352" y="196" width="36" height="14" fill="url(#hatch)" stroke="#475569" strokeWidth="1" />

                            {/* Bản đế chân cột */}
                            <rect x="62" y="192" width="16" height="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                            <rect x="362" y="192" width="16" height="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />

                            {/* Trục định vị A và B (Tâm cột) */}
                            <line x1="70" y1="50" x2="70" y2="235" stroke="#ef4444" strokeWidth="1" strokeDasharray="8,3,2,3" />
                            <line x1="370" y1="50" x2="370" y2="235" stroke="#ef4444" strokeWidth="1" strokeDasharray="8,3,2,3" />

                            {/* Trục đỉnh nóc ở giữa */}
                            <line x1="220" y1="40" x2="220" y2="210" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,3" />

                            {/* Bong bóng trục A và B */}
                            <circle cx="70" cy="235" r="9" fill="#0f172a" stroke="#ef4444" strokeWidth="1.5" />
                            <text x="70" y="239" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">A</text>
                            
                            <circle cx="370" cy="235" r="9" fill="#0f172a" stroke="#ef4444" strokeWidth="1.5" />
                            <text x="370" y="239" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">B</text>

                            {/* Cột thép chữ I trái (Trục A) */}
                            <rect x="65" y="100" width="10" height="92" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5" />
                            {/* Cột thép chữ I phải (Trục B) */}
                            <rect x="365" y="100" width="10" height="92" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5" />

                            {/* Kèo thép dầm mái I dốc 2 phía có nách khung và đỉnh nóc */}
                            {/* Kèo trái */}
                            <polygon points="65,100 75,100 220,58 220,50 65,92" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />
                            {/* Kèo phải */}
                            <polygon points="365,100 375,100 375,92 220,50 220,58" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />

                            {/* Nách củng cố tại đầu cột */}
                            <polygon points="75,100 75,115 105,92" fill="#2563eb" stroke="#93c5fd" strokeWidth="1" />
                            <polygon points="365,100 365,115 335,92" fill="#2563eb" stroke="#93c5fd" strokeWidth="1" />

                            {/* Các điểm xà gồ Z trên mái */}
                            {[0.2, 0.4, 0.6, 0.8].map((t, idx) => {
                                const xL = 70 + t * (220 - 70);
                                const yL = 92 - t * (92 - 50);
                                const xR = 370 - t * (370 - 220);
                                const yR = yL;
                                return (
                                    <g key={idx}>
                                        <rect x={xL - 2} y={yL - 6} width="4" height="6" fill="#f59e0b" />
                                        <rect x={xR - 2} y={yR - 6} width="4" height="6" fill="#f59e0b" />
                                    </g>
                                );
                            })}

                            {/* Tam giác chỉ độ dốc mái */}
                            <g transform="translate(130, 60)">
                                <polygon points="0,0 35,0 35,-10" fill="none" stroke="#38bdf8" strokeWidth="1" />
                                <text x="18" y="9" fill="#38bdf8" fontSize="8" textAnchor="middle">100%</text>
                                <text x="42" y="-3" fill="#38bdf8" fontSize="8">i={slopePercent}%</text>
                            </g>

                            {/* ĐƯỜNG GIÓNG KÍCH THƯỚC */}
                            {/* Kích thước Nhịp L (Dưới đáy) */}
                            <line x1="70" y1="215" x2="370" y2="215" stroke="#94a3b8" strokeWidth="1" markerStart="url(#cad-arrow-start)" markerEnd="url(#cad-arrow)" />
                            <text x="220" y="212" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                                Nhịp khung L = {L} m (2 × {halfSpan}m)
                            </text>

                            {/* Chiều cao đỉnh cột H_col (Bên trái) */}
                            <line x1="42" y1="100" x2="42" y2="192" stroke="#94a3b8" strokeWidth="1" markerStart="url(#cad-arrow-start)" markerEnd="url(#cad-arrow)" />
                            <text x="36" y="150" fill="#f8fafc" fontSize="9" fontWeight="bold" textAnchor="end">
                                H={H_col}m
                            </text>

                            {/* Chiều cao đỉnh mái H_rf (Chính giữa) */}
                            <line x1="220" y1="50" x2="220" y2="192" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" />
                            <text x="220" y="42" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">
                                +{H_rf} m (ΔH = {roofRise}m)
                            </text>
                        </svg>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-auto pt-2 border-t border-slate-800 flex justify-between">
                        <span>• Tiết diện: Cột/Kèo thép I tổ hợp</span>
                        <span>• Chân cột ngàm cứng móng</span>
                    </div>
                </div>

                {/* 2. Mặt đứng sườn (Dọc chiều dài nhà & các bước cột) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col">
                    <div className="flex justify-between items-center text-xs font-bold text-cyan-300 mb-2 pb-1 border-b border-slate-800">
                        <span>2. MẶT ĐỨNG SƯỜN ({numBays} BƯỚC CỘT × B = {B}m)</span>
                        <span className="text-[11px] text-slate-400 font-mono">Dài: {length}m</span>
                    </div>

                    <div className="overflow-x-auto flex justify-center py-2">
                        <svg width="440" height="250" viewBox="0 0 440 250" className="max-w-full">
                            {/* Mặt đất */}
                            <line x1="20" y1="200" x2="420" y2="200" stroke="#334155" strokeWidth="1.5" strokeDasharray="6,3" />

                            {/* Cột các bước */}
                            {Array.from({ length: Math.min(9, numBays + 1) }).map((_, idx) => {
                                const totalSteps = Math.min(8, numBays);
                                const x = 40 + idx * (360 / totalSteps);
                                const isEndBay = idx === 0 || idx === totalSteps;
                                return (
                                    <g key={idx}>
                                        {/* Trục cột định vị */}
                                        <line x1={x} y1="90" x2={x} y2="225" stroke="#475569" strokeWidth="1" strokeDasharray="4,2" />
                                        
                                        {/* Cột thép */}
                                        <line x1={x} y1="100" x2={x} y2="195" stroke="#3b82f6" strokeWidth="3" />
                                        <rect x={x - 4} y="195" width="8" height="4" fill="#cbd5e1" />
                                        
                                        {/* Bong bóng trục số 1, 2, 3... */}
                                        <circle cx={x} cy="225" r="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
                                        <text x={x} y="228" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="middle">{idx + 1}</text>
                                    </g>
                                );
                            })}

                            {/* Dầm khóa đầu cột (Eaves strut) */}
                            <line x1="40" y1="100" x2="400" y2="100" stroke="#60a5fa" strokeWidth="2.5" />
                            {/* Xà gồ sườn tường */}
                            <line x1="40" y1="130" x2="400" y2="130" stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />
                            <line x1="40" y1="160" x2="400" y2="160" stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />

                            {/* Hệ giằng cột chữ X ở 2 gian đầu hồi */}
                            {/* Gian 1-2 */}
                            {(() => {
                                const x0 = 40;
                                const x1 = 40 + (360 / Math.min(8, numBays));
                                return (
                                    <g>
                                        <line x1={x0} y1="100" x2={x1} y2="195" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                                        <line x1={x0} y1="195" x2={x1} y2="100" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                                        <text x={(x0 + x1)/2} y="152" fill="#f87171" fontSize="9" fontWeight="bold" textAnchor="middle">Giằng cột</text>
                                    </g>
                                );
                            })()}
                            
                            {/* Gian cuối */}
                            {(() => {
                                const totalSteps = Math.min(8, numBays);
                                const x0 = 40 + (totalSteps - 1) * (360 / totalSteps);
                                const x1 = 400;
                                return (
                                    <g>
                                        <line x1={x0} y1="100" x2={x1} y2="195" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                                        <line x1={x0} y1="195" x2={x1} y2="100" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                                    </g>
                                );
                            })()}

                            {/* Kích thước tổng chiều dài */}
                            <line x1="40" y1="210" x2="400" y2="210" stroke="#94a3b8" strokeWidth="1" markerStart="url(#cad-arrow-start)" markerEnd="url(#cad-arrow)" />
                            <text x="220" y="206" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                                Chiều dài tổng = {length} m ({numBays} bước × B={B}m)
                            </text>
                        </svg>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-auto pt-2 border-t border-slate-800 flex justify-between">
                        <span>• Hệ giằng cột chữ X bố trí 2 gian đầu hồi</span>
                        <span>• Bước cột thiết kế B = {B}m</span>
                    </div>
                </div>

                {/* 3. Mặt bằng mái & Bố trí Xà gồ, Giằng mái */}
                <div className="lg:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-300 mb-2 pb-1 border-b border-slate-800">
                        <span>3. MẶT BẰNG MÁI TÔN, LƯỚI KHUNG VÀ HỆ GIẰNG CHÉO MÁI CHỮ X</span>
                        <span className="text-[11px] text-slate-400 font-mono">Nhịp {L}m × Dài {length}m</span>
                    </div>

                    <div className="overflow-x-auto flex justify-center py-2">
                        <svg width="860" height="180" viewBox="0 0 860 180" className="max-w-full">
                            {/* Khung biên mái */}
                            <rect x="50" y="30" width="760" height="110" fill="#1e293b" stroke="#64748b" strokeWidth="2" />

                            {/* Đường nóc chính giữa */}
                            <line x1="50" y1="85" x2="810" y2="85" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,4" />
                            <text x="815" y="89" fill="#f59e0b" fontSize="10" fontWeight="bold">Đường nóc</text>

                            {/* Các đường xà gồ dọc */}
                            {[48, 66, 104, 122].map((y, idx) => (
                                <line key={idx} x1="50" y1={y} x2="810" y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                            ))}

                            {/* Các khung ngang theo bước cột */}
                            {Array.from({ length: Math.min(13, numBays + 1) }).map((_, idx) => {
                                const totalSteps = Math.min(12, numBays);
                                const x = 50 + idx * (760 / totalSteps);
                                return (
                                    <g key={idx}>
                                        <line x1={x} y1="30" x2={x} y2="140" stroke="#475569" strokeWidth="1.5" />
                                        <circle cx={x} cy="30" r="3" fill="#3b82f6" />
                                        <circle cx={x} cy="140" r="3" fill="#3b82f6" />
                                        {/* Trục số */}
                                        <text x={x} y="155" fill="#94a3b8" fontSize="9" textAnchor="middle">{idx + 1}</text>
                                    </g>
                                );
                            })}

                            {/* Hệ giằng chéo mái chữ X tại 2 gian đầu hồi */}
                            {/* Gian đầu */}
                            {(() => {
                                const bayW = 760 / Math.min(12, numBays);
                                const x0 = 50;
                                const x1 = 50 + bayW;
                                return (
                                    <g>
                                        {/* Mái trái */}
                                        <line x1={x0} y1="30" x2={x1} y2="85" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                                        <line x1={x0} y1="85" x2={x1} y2="30" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                                        {/* Mái phải */}
                                        <line x1={x0} y1="85" x2={x1} y2="140" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                                        <line x1={x0} y1="140" x2={x1} y2="85" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                                    </g>
                                );
                            })()}

                            {/* Gian cuối */}
                            {(() => {
                                const totalSteps = Math.min(12, numBays);
                                const bayW = 760 / totalSteps;
                                const x0 = 50 + (totalSteps - 1) * bayW;
                                const x1 = 810;
                                return (
                                    <g>
                                        <line x1={x0} y1="30" x2={x1} y2="85" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                                        <line x1={x0} y1="85" x2={x1} y2="30" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                                        <line x1={x0} y1="85" x2={x1} y2="140" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                                        <line x1={x0} y1="140" x2={x1} y2="85" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                                    </g>
                                );
                            })()}

                            {/* Nhãn kích thước */}
                            <text x="35" y="88" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="end">L={L}m</text>
                            <text x="430" y="20" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
                                SƠ ĐỒ MẶT BẰNG MÁI (XÀ GỒ BƯỚC a={purlinA}m, GIẰNG GIÓ CHỮ X)
                            </text>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.ProjectSvg = ProjectSvg;
