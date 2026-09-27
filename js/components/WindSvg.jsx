// Component Bản vẽ 2D Gió theo TCVN 2737:2023 (Hình F.5a, Hình F.6 & Hình F.14)
// Hiển thị trực quan: Phân vùng tường A-E, Phân vùng mái F-J, Kích thước e/4, e/10, Áp lực trong ci và Tổng hợp

const WindSvg = ({ geom, loadCases }) => {
    const [selectedDir, setSelectedDir] = React.useState('+X');
    const [viewMode, setViewMode] = React.useState('net'); // 'net' = Tổng hợp, 'ce' = Mặt ngoài, 'ci' = Áp lực trong
    const [selectedZone, setSelectedZone] = React.useState(null);

    if (!geom || !loadCases) {
        return (
            <div className="p-6 bg-slate-900 text-slate-300 rounded-lg border border-slate-700 text-center italic">
                Chưa có dữ liệu tính toán gió. Nhấn "Phân tích & Tính toán Tải trọng" để hiển thị bản vẽ 2D.
            </div>
        );
    }

    const currentCase = loadCases[selectedDir] || loadCases['+X'];
    if (!currentCase) return null;

    const isTheta0 = currentCase.isTheta0; // θ = 0° (X) hay θ = 90° (Y)
    const dim = isTheta0 ? geom.theta0 : geom.theta90;
    const b = dim.b;
    const d = dim.d;
    const e = dim.e;
    const H_col = geom.H_col;
    const H_rf = geom.H_rf;

    // Helper màu áp lực: Đẩy (+) màu Đỏ cam, Hút (-) màu Xanh dương
    const getZoneStyle = (val) => {
        if (val > 0) {
            return {
                fill: 'rgba(239, 68, 68, 0.25)',
                stroke: '#ef4444',
                textColor: '#fca5a5'
            };
        } else {
            return {
                fill: 'rgba(59, 130, 246, 0.25)',
                stroke: '#3b82f6',
                textColor: '#93c5fd'
            };
        }
    };

    const handleZoneClick = (zone) => {
        setSelectedZone(zone === selectedZone ? null : zone);
    };

    // Tìm zone theo surface và nhãn
    const findSurface = (surface, zoneName) => {
        return currentCase.surfaces.find(s => s.surface === surface && s.zone === zoneName);
    };

    return (
        <div className="wind-svg-card bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-xl text-slate-200">
            {/* Header điều khiển */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4 pb-3 border-b border-slate-700">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <i data-lucide="compass" className="w-5 h-5 text-primary"></i>
                        BẢN VẼ PHÂN VÙNG GIÓ 2D (TCVN 2737:2023 - HÌNH F.5a & HÌNH F.6)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Kích thước tương đương: <span className="font-mono text-amber-300 font-bold">e = min(b; 2h) = {e} m</span> | 
                        Độ dốc mái: <span className="font-mono text-cyan-300 font-bold">i = {geom.slopePercent}% (α = {geom.alphaDeg}°)</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Chọn hướng gió */}
                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <button 
                            onClick={() => { setSelectedDir('+X'); setSelectedZone(null); }}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${selectedDir === '+X' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Gió ngang +X (θ=0°)
                        </button>
                        <button 
                            onClick={() => { setSelectedDir('-X'); setSelectedZone(null); }}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${selectedDir === '-X' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Gió ngang -X (θ=0°)
                        </button>
                        <button 
                            onClick={() => { setSelectedDir('+Y'); setSelectedZone(null); }}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${selectedDir === '+Y' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Gió dọc +Y (θ=90°)
                        </button>
                        <button 
                            onClick={() => { setSelectedDir('-Y'); setSelectedZone(null); }}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${selectedDir === '-Y' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Gió dọc -Y (θ=90°)
                        </button>
                    </div>

                    {/* Chọn chế độ hiển thị hệ số */}
                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <button 
                            onClick={() => setViewMode('net')}
                            className={`px-2.5 py-1 rounded text-xs font-medium ${viewMode === 'net' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'}`}
                            title="Hệ số tổng hợp c = ce - ci"
                        >
                            c_net (Tổng hợp)
                        </button>
                        <button 
                            onClick={() => setViewMode('ce')}
                            className={`px-2.5 py-1 rounded text-xs font-medium ${viewMode === 'ce' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
                            title="Hệ số khí động mặt ngoài"
                        >
                            c_e (Mặt ngoài)
                        </button>
                        <button 
                            onClick={() => setViewMode('ci')}
                            className={`px-2.5 py-1 rounded text-xs font-medium ${viewMode === 'ci' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400'}`}
                            title="Hệ số áp lực trong"
                        >
                            c_i (Áp lực trong)
                        </button>
                    </div>
                </div>
            </div>

            {/* Nội dung bản vẽ SVG & Thông số chi tiết */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Khu vực vẽ SVG (2 cột) */}
                <div className="lg:col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto flex flex-col items-center justify-center">
                    <svg width="680" height="420" viewBox="0 0 680 420" className="max-w-full">
                        <defs>
                            <marker id="wind-arrow-head" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
                            </marker>
                            <marker id="press-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
                            </marker>
                            <marker id="suct-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                <polygon points="0 3, 6 0, 6 6" fill="#3b82f6" />
                            </marker>
                        </defs>

                        {/* ================= PHẦN 1: MẶT BẰNG PHÂN VÙNG MÁI (HÌNH F.6) ================= */}
                        <g transform="translate(40, 30)">
                            <text x="140" y="-10" fill="#cbd5e1" fontSize="13" fontWeight="bold" textAnchor="middle">
                                MẶT BẰNG PHÂN VÙNG MÁI {isTheta0 ? '(HÌNH F.6b: θ = 0°)' : '(HÌNH F.6c: θ = 90°)'}
                            </text>
                            
                            {/* Khung mặt bằng mái */}
                            <rect x="0" y="0" width="280" height="150" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                            
                            {/* Đường nóc mái ở giữa */}
                            <line x1="0" y1="75" x2="280" y2="75" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,3" />
                            <text x="285" y="79" fill="#f59e0b" fontSize="10" fontWeight="bold">Đường nóc</text>

                            {isTheta0 ? (
                                // Gió θ = 0°: Mái đón gió (y: 75 -> 150) có F, G, H; Mái khuất gió (y: 0 -> 75) có J, I
                                <g>
                                    {/* Mũi tên gió thổi từ dưới lên */}
                                    <line x1="140" y1="180" x2="140" y2="155" stroke="#10b981" strokeWidth="3" markerEnd="url(#wind-arrow-head)" />
                                    <text x="140" y="195" fill="#10b981" fontSize="12" fontWeight="bold" textAnchor="middle">HƯỚNG GIÓ {selectedDir} (θ = 0°)</text>

                                    {/* Vùng F (hai góc mép đón gió: rộng e/4 = ~50px, sâu e/10 = 20px) */}
                                    {(() => {
                                        const zF = findSurface('Mái', 'F');
                                        const stF = getZoneStyle(zF ? (viewMode === 'ci' ? zF.ci : (viewMode === 'ce' ? zF.ce : zF.c_net)) : -1.2);
                                        const valStr = zF ? (viewMode === 'ci' ? zF.ci : (viewMode === 'ce' ? zF.ce : zF.c_net)) : '-';
                                        return (
                                            <>
                                                <rect x="0" y="130" width="55" height="20" fill={stF.fill} stroke={stF.stroke} strokeWidth="1.5" className="cursor-pointer" onClick={() => handleZoneClick(zF)} />
                                                <text x="27" y="144" fill={stF.textColor} fontSize="10" fontWeight="bold" textAnchor="middle">F ({valStr})</text>

                                                <rect x="225" y="130" width="55" height="20" fill={stF.fill} stroke={stF.stroke} strokeWidth="1.5" className="cursor-pointer" onClick={() => handleZoneClick(zF)} />
                                                <text x="252" y="144" fill={stF.textColor} fontSize="10" fontWeight="bold" textAnchor="middle">F ({valStr})</text>
                                            </>
                                        );
                                    })()}

                                    {/* Vùng G (dải giữa đón gió) */}
                                    {(() => {
                                        const zG = findSurface('Mái', 'G');
                                        const stG = getZoneStyle(zG ? (viewMode === 'ci' ? zG.ci : (viewMode === 'ce' ? zG.ce : zG.c_net)) : -0.8);
                                        const valStr = zG ? (viewMode === 'ci' ? zG.ci : (viewMode === 'ce' ? zG.ce : zG.c_net)) : '-';
                                        return (
                                            <g className="cursor-pointer" onClick={() => handleZoneClick(zG)}>
                                                <rect x="55" y="130" width="170" height="20" fill={stG.fill} stroke={stG.stroke} strokeWidth="1.5" />
                                                <text x="140" y="144" fill={stG.textColor} fontSize="10" fontWeight="bold" textAnchor="middle">VÙNG G ({valStr})</text>
                                            </g>
                                        );
                                    })()}

                                    {/* Vùng H (phần còn lại của sườn đón gió) */}
                                    {(() => {
                                        const zH = findSurface('Mái', 'H');
                                        const stH = getZoneStyle(zH ? (viewMode === 'ci' ? zH.ci : (viewMode === 'ce' ? zH.ce : zH.c_net)) : -0.5);
                                        const valStr = zH ? (viewMode === 'ci' ? zH.ci : (viewMode === 'ce' ? zH.ce : zH.c_net)) : '-';
                                        return (
                                            <g className="cursor-pointer" onClick={() => handleZoneClick(zH)}>
                                                <rect x="0" y="75" width="280" height="55" fill={stH.fill} stroke={stH.stroke} strokeWidth="1.5" />
                                                <text x="140" y="105" fill={stH.textColor} fontSize="11" fontWeight="bold" textAnchor="middle">VÙNG H ({valStr})</text>
                                            </g>
                                        );
                                    })()}

                                    {/* Vùng J (dải nóc phía khuất gió) */}
                                    {(() => {
                                        const zJ = findSurface('Mái', 'J');
                                        const stJ = getZoneStyle(zJ ? (viewMode === 'ci' ? zJ.ci : (viewMode === 'ce' ? zJ.ce : zJ.c_net)) : -0.6);
                                        const valStr = zJ ? (viewMode === 'ci' ? zJ.ci : (viewMode === 'ce' ? zJ.ce : zJ.c_net)) : '-';
                                        return (
                                            <g className="cursor-pointer" onClick={() => handleZoneClick(zJ)}>
                                                <rect x="0" y="55" width="280" height="20" fill={stJ.fill} stroke={stJ.stroke} strokeWidth="1.5" />
                                                <text x="140" y="69" fill={stJ.textColor} fontSize="10" fontWeight="bold" textAnchor="middle">VÙNG J ({valStr})</text>
                                            </g>
                                        );
                                    })()}

                                    {/* Vùng I (phần còn lại của sườn khuất gió) */}
                                    {(() => {
                                        const zI = findSurface('Mái', 'I');
                                        const stI = getZoneStyle(zI ? (viewMode === 'ci' ? zI.ci : (viewMode === 'ce' ? zI.ce : zI.c_net)) : -0.5);
                                        const valStr = zI ? (viewMode === 'ci' ? zI.ci : (viewMode === 'ce' ? zI.ce : zI.c_net)) : '-';
                                        return (
                                            <g className="cursor-pointer" onClick={() => handleZoneClick(zI)}>
                                                <rect x="0" y="0" width="280" height="55" fill={stI.fill} stroke={stI.stroke} strokeWidth="1.5" />
                                                <text x="140" y="32" fill={stI.textColor} fontSize="11" fontWeight="bold" textAnchor="middle">VÙNG I ({valStr})</text>
                                            </g>
                                        );
                                    })()}

                                    {/* Kích thước e/4 và e/10 ghi chú */}
                                    <text x="27" y="165" fill="#94a3b8" fontSize="9" textAnchor="middle">e/4</text>
                                    <text x="252" y="165" fill="#94a3b8" fontSize="9" textAnchor="middle">e/4</text>
                                    <text x="-15" y="142" fill="#94a3b8" fontSize="9" textAnchor="middle">e/10</text>
                                </g>
                            ) : (
                                // Gió θ = 90°: Gió thổi từ trái sang phải dọc theo nóc
                                <g>
                                    {/* Mũi tên gió */}
                                    <line x1="-35" y1="75" x2="-10" y2="75" stroke="#10b981" strokeWidth="3" markerEnd="url(#wind-arrow-head)" />
                                    <text x="-40" y="70" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="end">GIÓ θ = 90°</text>

                                    {/* Vùng F (mép đón gió hai góc) */}
                                    {(() => {
                                        const zF = findSurface('Mái', 'F');
                                        const stF = getZoneStyle(zF ? (viewMode === 'ci' ? zF.ci : (viewMode === 'ce' ? zF.ce : zF.c_net)) : -1.6);
                                        const valStr = zF ? (viewMode === 'ci' ? zF.ci : (viewMode === 'ce' ? zF.ce : zF.c_net)) : '-';
                                        return (
                                            <>
                                                <rect x="0" y="0" width="30" height="35" fill={stF.fill} stroke={stF.stroke} strokeWidth="1.5" className="cursor-pointer" onClick={() => handleZoneClick(zF)} />
                                                <text x="15" y="20" fill={stF.textColor} fontSize="9" fontWeight="bold" textAnchor="middle">F ({valStr})</text>
                                                <rect x="0" y="115" width="30" height="35" fill={stF.fill} stroke={stF.stroke} strokeWidth="1.5" className="cursor-pointer" onClick={() => handleZoneClick(zF)} />
                                                <text x="15" y="135" fill={stF.textColor} fontSize="9" fontWeight="bold" textAnchor="middle">F ({valStr})</text>
                                            </>
                                        );
                                    })()}

                                    {/* Vùng G (dải đón gió ở giữa) */}
                                    {(() => {
                                        const zG = findSurface('Mái', 'G');
                                        const stG = getZoneStyle(zG ? (viewMode === 'ci' ? zG.ci : (viewMode === 'ce' ? zG.ce : zG.c_net)) : -1.3);
                                        const valStr = zG ? (viewMode === 'ci' ? zG.ci : (viewMode === 'ce' ? zG.ce : zG.c_net)) : '-';
                                        return (
                                            <g className="cursor-pointer" onClick={() => handleZoneClick(zG)}>
                                                <rect x="0" y="35" width="30" height="80" fill={stG.fill} stroke={stG.stroke} strokeWidth="1.5" />
                                                <text x="15" y="78" fill={stG.textColor} fontSize="9" fontWeight="bold" textAnchor="middle">G ({valStr})</text>
                                            </g>
                                        );
                                    })()}

                                    {/* Vùng H (từ e/10 đến e/2) */}
                                    {(() => {
                                        const zH = findSurface('Mái', 'H');
                                        const stH = getZoneStyle(zH ? (viewMode === 'ci' ? zH.ci : (viewMode === 'ce' ? zH.ce : zH.c_net)) : -0.7);
                                        const valStr = zH ? (viewMode === 'ci' ? zH.ci : (viewMode === 'ce' ? zH.ce : zH.c_net)) : '-';
                                        return (
                                            <g className="cursor-pointer" onClick={() => handleZoneClick(zH)}>
                                                <rect x="30" y="0" width="90" height="150" fill={stH.fill} stroke={stH.stroke} strokeWidth="1.5" />
                                                <text x="75" y="78" fill={stH.textColor} fontSize="11" fontWeight="bold" textAnchor="middle">VÙNG H ({valStr})</text>
                                            </g>
                                        );
                                    })()}

                                    {/* Vùng I (từ e/2 đến hết) */}
                                    {(() => {
                                        const zI = findSurface('Mái', 'I');
                                        const stI = getZoneStyle(zI ? (viewMode === 'ci' ? zI.ci : (viewMode === 'ce' ? zI.ce : zI.c_net)) : -0.6);
                                        const valStr = zI ? (viewMode === 'ci' ? zI.ci : (viewMode === 'ce' ? zI.ce : zI.c_net)) : '-';
                                        return (
                                            <g className="cursor-pointer" onClick={() => handleZoneClick(zI)}>
                                                <rect x="120" y="0" width="160" height="150" fill={stI.fill} stroke={stI.stroke} strokeWidth="1.5" />
                                                <text x="200" y="78" fill={stI.textColor} fontSize="11" fontWeight="bold" textAnchor="middle">VÙNG I ({valStr})</text>
                                            </g>
                                        );
                                    })()}
                                </g>
                            )}
                        </g>

                        {/* ================= PHẦN 2: MẶT ĐỨNG KHUNG PHÂN VÙNG TƯỜNG (HÌNH F.5a) ================= */}
                        <g transform="translate(370, 40)">
                            <text x="130" y="-20" fill="#cbd5e1" fontSize="13" fontWeight="bold" textAnchor="middle">
                                MẶT ĐỨNG KHUNG & VÙNG TƯỜNG (HÌNH F.5a)
                            </text>

                            {/* Cột và Dầm mái dốc 2 phía */}
                            <path d="M 30,140 L 30,60 L 130,25 L 230,60 L 230,140 Z" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
                            {/* Mặt đất */}
                            <line x1="10" y1="140" x2="250" y2="140" stroke="#475569" strokeWidth="3" />

                            {/* Tường đón gió D (bên trái) */}
                            {(() => {
                                const zD = findSurface('Tường', 'D');
                                const stD = getZoneStyle(zD ? (viewMode === 'ci' ? zD.ci : (viewMode === 'ce' ? zD.ce : zD.c_net)) : 0.8);
                                const valStr = zD ? (viewMode === 'ci' ? zD.ci : (viewMode === 'ce' ? zD.ce : zD.c_net)) : '+0,8';
                                return (
                                    <g className="cursor-pointer" onClick={() => handleZoneClick(zD)}>
                                        <rect x="10" y="60" width="20" height="80" fill={stD.fill} stroke={stD.stroke} strokeWidth="1.5" />
                                        <text x="20" y="105" fill={stD.textColor} fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(-90 20 105)">D ({valStr})</text>
                                        {/* Mũi tên áp lực đẩy */}
                                        <line x1="-15" y1="100" x2="5" y2="100" stroke="#ef4444" strokeWidth="2" markerEnd="url(#press-arrow)" />
                                    </g>
                                );
                            })()}

                            {/* Tường khuất gió E (bên phải) */}
                            {(() => {
                                const zE = findSurface('Tường', 'E');
                                const stE = getZoneStyle(zE ? (viewMode === 'ci' ? zE.ci : (viewMode === 'ce' ? zE.ce : zE.c_net)) : -0.5);
                                const valStr = zE ? (viewMode === 'ci' ? zE.ci : (viewMode === 'ce' ? zE.ce : zE.c_net)) : '-0,5';
                                return (
                                    <g className="cursor-pointer" onClick={() => handleZoneClick(zE)}>
                                        <rect x="230" y="60" width="20" height="80" fill={stE.fill} stroke={stE.stroke} strokeWidth="1.5" />
                                        <text x="240" y="105" fill={stE.textColor} fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(90 240 105)">E ({valStr})</text>
                                        {/* Mũi tên áp lực hút */}
                                        <line x1="255" y1="100" x2="275" y2="100" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#suct-arrow)" />
                                    </g>
                                );
                            })()}

                            {/* Ký hiệu cao độ */}
                            <text x="130" y="18" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">Đỉnh mái H={H_rf}m</text>
                            <text x="28" y="52" fill="#94a3b8" fontSize="9" textAnchor="end">H_cột={H_col}m</text>
                            <text x="130" y="155" fill="#94a3b8" fontSize="10" textAnchor="middle">Nhịp L = {geom.L} m</text>
                        </g>

                        {/* ================= PHẦN 3: SƠ ĐỒ ÁP LỰC TRONG (HÌNH F.14) ================= */}
                        <g transform="translate(60, 245)">
                            <text x="260" y="0" fill="#cbd5e1" fontSize="12" fontWeight="bold" textAnchor="middle">
                                SƠ ĐỒ ÁP LỰC KHÍ ĐỘNG CÓ XÉT ÁP LỰC TRONG (HÌNH F.14 - TCVN 2737:2023)
                            </text>
                            
                            {/* Mô hình nhà có vỏ bao che và áp lực trong c_i */}
                            <path d="M 60,110 L 60,45 L 260,15 L 460,45 L 460,110" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="3,3" />
                            
                            {/* Khối bên trong hiển thị c_i */}
                            <rect x="210" y="45" width="100" height="40" rx="6" fill="#581c87" stroke="#a855f7" strokeWidth="1.5" />
                            <text x="260" y="62" fill="#e9d5ff" fontSize="11" fontWeight="bold" textAnchor="middle">ÁP LỰC TRONG</text>
                            <text x="260" y="78" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
                                c_i = {currentCase.ci > 0 ? `+${currentCase.ci}` : currentCase.ci}
                            </text>

                            {/* Chú giải công thức tổng hợp */}
                            <text x="260" y="115" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle">
                                ÁP LỰC TỔNG HỢP: c_net = c_e - c_i | w_k = W_3s,10 × k(z_e) × c_net × G_f | w_d = 2,1 × w_k
                            </text>
                        </g>
                    </svg>

                    {/* Chú giải màu sắc */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-2 pt-2 border-t border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-3 rounded bg-red-500/30 border border-red-500 inline-block"></span>
                            <span className="text-red-300 font-medium">Áp lực dương (+) Đẩy vào mặt</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-3 rounded bg-blue-500/30 border border-blue-500 inline-block"></span>
                            <span className="text-blue-300 font-medium">Áp lực âm (-) Hút ra ngoài</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-3 rounded bg-purple-700/50 border border-purple-500 inline-block"></span>
                            <span className="text-purple-300 font-medium">Áp lực trong c_i (Mục F.12)</span>
                        </div>
                        <span className="text-slate-400 italic">💡 Click vào từng vùng (F, G, H, J, I, D, E...) để xem công thức chi tiết</span>
                    </div>
                </div>

                {/* Panel thông số kỹ thuật chi tiết của Vùng được chọn */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-700 mb-3">
                            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                                <i data-lucide="info" className="w-4 h-4 text-primary"></i>
                                THÔNG SỐ VÙNG KHÍ ĐỘNG
                            </h4>
                            {selectedZone && (
                                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded font-bold">
                                    {selectedZone.zone} ({selectedZone.surface})
                                </span>
                            )}
                        </div>

                        {selectedZone ? (
                            <div className="space-y-2.5 text-xs">
                                <div className="p-2 bg-slate-900/80 rounded border border-slate-700/80">
                                    <div className="text-slate-400">Vùng: <strong className="text-white">{selectedZone.name || selectedZone.zone}</strong></div>
                                    <div className="text-slate-400">Bề mặt: <strong className="text-amber-300">{selectedZone.surface}</strong></div>
                                    <div className="text-slate-400">Độ cao z_e: <strong className="text-cyan-300">{selectedZone.ze} m</strong></div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                        <span className="text-slate-400">k(z_e):</span>
                                        <div className="text-base font-bold text-white font-mono">{selectedZone.kz}</div>
                                        <span className="text-[10px] text-slate-500">Bảng 9</span>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                        <span className="text-slate-400">Hệ số giật G_f:</span>
                                        <div className="text-base font-bold text-white font-mono">{selectedZone.Gf}</div>
                                        <span className="text-[10px] text-slate-500">Phụ lục E</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                        <span className="text-slate-400">c_e (ngoài):</span>
                                        <div className={`text-sm font-bold font-mono ${selectedZone.ce > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                            {selectedZone.ce > 0 ? `+${selectedZone.ce}` : selectedZone.ce}
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                        <span className="text-slate-400">c_i (trong):</span>
                                        <div className="text-sm font-bold text-purple-300 font-mono">
                                            {selectedZone.ci > 0 ? `+${selectedZone.ci}` : selectedZone.ci}
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                        <span className="text-slate-400">c_net:</span>
                                        <div className={`text-sm font-bold font-mono ${selectedZone.c_net > 0 ? 'text-red-300' : 'text-cyan-300'}`}>
                                            {selectedZone.c_net > 0 ? `+${selectedZone.c_net}` : selectedZone.c_net}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Áp lực tiêu chuẩn w_k:</span>
                                        <span className="font-bold text-white font-mono">{selectedZone.pressure_k} kN/m²</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Áp lực tính toán w_d (γ_f=2,1):</span>
                                        <span className="font-bold text-amber-300 font-mono">{selectedZone.pressure_d} kN/m²</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                                        <span className="text-emerald-400 font-semibold">Tải khung ngang q_d:</span>
                                        <span className="text-sm font-bold text-emerald-300 font-mono">{selectedZone.frameLineLoad_d} kN/m</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 italic text-right">
                                        (Truyền tải bước cột B = {selectedZone.tributaryWidth} m)
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-400 text-xs italic space-y-2 py-4 text-center">
                                <p>👉 Nhấp vào một ô trên bản vẽ mặt bằng mái hoặc mặt đứng khung để xem kết quả tính toán chi tiết của vùng đó.</p>
                                <div className="p-3 bg-slate-900/60 rounded border border-slate-700/60 text-left text-[11px] not-italic text-slate-300 space-y-1">
                                    <div className="font-bold text-amber-300">Công thức cơ bản TCVN 2737:2023:</div>
                                    <div>• W₃ₛ,₁₀ = 0,852 × W₀ = {currentCase.W3s_10} kN/m²</div>
                                    <div>• G_f = 0,85 + h/1010 = {currentCase.Gf}</div>
                                    <div>• Áp lực trong c_i = ±0,2 (Độ hở μ ≤ 5%)</div>
                                    <div>• Hệ số độ tin cậy gió chính: γ_f = 2,1</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700 text-[11px] text-slate-400">
                        Nguồn: <strong>TCVN 2737:2023</strong> Mục 10.2 & Phụ lục F
                    </div>
                </div>
            </div>
        </div>
    );
};

window.WindSvg = WindSvg;
