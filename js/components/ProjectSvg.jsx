// Bản vẽ 2D minh họa hình học công trình cho Mục 1 (Cài đặt dự án)
// Bao gồm: Mặt đứng chính (sườn), Mặt đứng đầu hồi (khung ngang mái dốc 2 phía) và Mặt bằng mái

const ProjectSvg = ({ inputs }) => {
    const L = Number(inputs.L) || 24; // Nhịp khung (m)
    const B = Number(inputs.B) || 6;  // Bước cột (m)
    const length = Number(inputs.length) || 72; // Chiều dài nhà (m)
    const H_col = Number(inputs.H_column) || 8.0;
    const H_rf = Number(inputs.H_roof) || 9.25;
    
    const numBays = Math.max(2, Math.round(length / B));
    const roofRise = Math.max(0.1, H_rf - H_col);
    const slopePercent = ((roofRise / (L / 2)) * 100).toFixed(1);
    const alphaDeg = ((Math.atan(roofRise / (L / 2)) * 180) / Math.PI).toFixed(1);

    return (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-md text-slate-200 my-4">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2 border-b border-slate-700 pb-2">
                <i data-lucide="layout" className="w-5 h-5 text-primary"></i>
                BẢN VẼ HÌNH HỌC 2D CÔNG TRÌNH (MẶT ĐỨNG & MẶT BẰNG MÁI)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Mặt đứng đầu hồi (Khung ngang mái dốc 2 phía) */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-xs font-bold text-amber-300 text-center mb-1">
                        1. MẶT ĐỨNG ĐẦU HỒI (KHUNG NGANG ĐIỂN HÌNH)
                    </div>
                    <svg width="100%" height="200" viewBox="0 0 360 200" className="mx-auto">
                        <defs>
                            <marker id="dim-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                                <path d="M 0 0 L 6 3 L 0 6 z" fill="#94a3b8" />
                            </marker>
                        </defs>

                        {/* Mặt đất */}
                        <line x1="20" y1="160" x2="340" y2="160" stroke="#475569" strokeWidth="2" strokeDasharray="4,2" />
                        <text x="345" y="163" fill="#64748b" fontSize="9">±0.000</text>

                        {/* Cột trái và Cột phải */}
                        <rect x="50" y="80" width="10" height="80" fill="#3b82f6" stroke="#60a5fa" strokeWidth="1" />
                        <rect x="290" y="80" width="10" height="80" fill="#3b82f6" stroke="#60a5fa" strokeWidth="1" />

                        {/* Kèo dầm mái dốc 2 phía */}
                        <path d="M 50,80 L 175,45 L 300,80 L 290,83 L 175,51 L 60,83 Z" fill="#2563eb" stroke="#93c5fd" strokeWidth="1.5" />
                        
                        {/* Đường gióng kích thước nhịp L */}
                        <line x1="55" y1="175" x2="295" y2="175" stroke="#94a3b8" strokeWidth="1" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
                        <text x="175" y="190" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">
                            Nhịp L = {L} m
                        </text>

                        {/* Cao độ đỉnh cột */}
                        <line x1="35" y1="80" x2="35" y2="160" stroke="#94a3b8" strokeWidth="1" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
                        <text x="30" y="125" fill="#f8fafc" fontSize="10" textAnchor="end">H={H_col}m</text>

                        {/* Cao độ đỉnh mái */}
                        <line x1="175" y1="45" x2="175" y2="160" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="175" y="38" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">
                            +{H_rf} m (i = {slopePercent}%, α = {alphaDeg}°)
                        </text>
                    </svg>
                </div>

                {/* 2. Mặt đứng sườn (Chiều dài nhà & các bước cột) */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-xs font-bold text-cyan-300 text-center mb-1">
                        2. MẶT ĐỨNG SƯỜN CÔNG TRÌNH ({numBays} BƯỚC CỘT)
                    </div>
                    <svg width="100%" height="200" viewBox="0 0 360 200" className="mx-auto">
                        {/* Mặt đất */}
                        <line x1="20" y1="160" x2="340" y2="160" stroke="#475569" strokeWidth="2" strokeDasharray="4,2" />
                        <text x="345" y="163" fill="#64748b" fontSize="9">±0.000</text>

                        {/* Vẽ các cột dọc sườn */}
                        {Array.from({ length: Math.min(9, numBays + 1) }).map((_, idx) => {
                            const bayCount = Math.min(8, numBays);
                            const x = 40 + idx * (270 / bayCount);
                            return (
                                <g key={idx}>
                                    <line x1={x} y1="80" x2={x} y2="160" stroke="#3b82f6" strokeWidth="3" />
                                    <circle cx={x} cy="160" r="3" fill="#ef4444" />
                                    <text x={x} y="172" fill="#94a3b8" fontSize="8" textAnchor="middle">{idx + 1}</text>
                                </g>
                            );
                        })}

                        {/* Dầm khóa mái / xà gồ dọc */}
                        <line x1="40" y1="80" x2="310" y2="80" stroke="#60a5fa" strokeWidth="3" />
                        <path d="M 40,80 L 175,55 L 310,80" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2,2" />

                        {/* Kích thước chiều dài L_total */}
                        <line x1="40" y1="185" x2="310" y2="185" stroke="#94a3b8" strokeWidth="1" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
                        <text x="175" y="197" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">
                            Tổng chiều dài = {length} m ({numBays} bước × B={B}m)
                        </text>
                        <text x="75" y="70" fill="#38bdf8" fontSize="9">Bước cột B={B}m</text>
                    </svg>
                </div>

                {/* 3. Mặt bằng mái (Toàn bộ chiều rộng nhịp L x Chiều dài) */}
                <div className="md:col-span-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-xs font-bold text-emerald-300 text-center mb-1">
                        3. MẶT BẰNG MÁI VÀ BỐ TRÍ HỆ GIẰNG, ĐƯỜNG NÓC
                    </div>
                    <svg width="100%" height="150" viewBox="0 0 680 150" className="mx-auto">
                        {/* Đường viền chu vi mái */}
                        <rect x="40" y="25" width="580" height="90" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                        
                        {/* Đường nóc mái ở giữa theo chiều dài */}
                        <line x1="40" y1="70" x2="620" y2="70" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,4" />
                        <text x="625" y="74" fill="#f59e0b" fontSize="10" fontWeight="bold">Đường nóc</text>

                        {/* Các khung ngang theo bước cột */}
                        {Array.from({ length: Math.min(13, numBays + 1) }).map((_, idx) => {
                            const bayCount = Math.min(12, numBays);
                            const x = 40 + idx * (580 / bayCount);
                            return (
                                <g key={idx}>
                                    <line x1={x} y1="25" x2={x} y2="115" stroke="#475569" strokeWidth="1" />
                                    <circle cx={x} cy="25" r="3" fill="#3b82f6" />
                                    <circle cx={x} cy="115" r="3" fill="#3b82f6" />
                                    <text x={x} y="130" fill="#94a3b8" fontSize="9" textAnchor="middle">{idx + 1}</text>
                                </g>
                            );
                        })}

                        {/* Giằng chéo chữ X ở 2 gian đầu hồi */}
                        <line x1="40" y1="25" x2="88" y2="70" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
                        <line x1="40" y1="70" x2="88" y2="25" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
                        <line x1="40" y1="70" x2="88" y2="115" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
                        <line x1="40" y1="115" x2="88" y2="70" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />

                        {/* Kích thước */}
                        <text x="25" y="74" fill="#94a3b8" fontSize="10" textAnchor="end">L={L}m</text>
                        <text x="330" y="15" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
                            MẶT BẰNG MÁI TÔN & LƯỚI KHUNG (B={B}m, DÀI={length}m)
                        </text>
                    </svg>
                </div>
            </div>
        </div>
    );
};

window.ProjectSvg = ProjectSvg;
