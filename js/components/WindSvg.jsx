// Component Bản vẽ 2D Phân vùng Tải trọng Gió theo TCVN 2737:2023 (Hình F.5a, Hình F.6 & Hình F.14)
// Thiết kế đồ họa kỹ thuật cao cấp, vector gió trực quan, thể hiện áp lực mặt ngoài (ce), áp lực trong (ci), và tổng hợp (c_net)

const WindSvg = ({ geom, loadCases }) => {
    const [selectedDir, setSelectedDir] = React.useState('+X');
    const [viewMode, setViewMode] = React.useState('net'); // 'net' = Tổng hợp, 'ce' = Mặt ngoài, 'ci' = Áp lực trong
    const [selectedZone, setSelectedZone] = React.useState(null);

    if (!geom || !loadCases) {
        return (
            <div className="p-8 bg-slate-900 text-slate-300 rounded-xl border border-slate-700 text-center italic shadow-inner">
                <i data-lucide="wind" className="w-8 h-8 text-primary mx-auto mb-2 animate-bounce"></i>
                <p className="font-semibold">Chưa có kết quả phân tích khí động học.</p>
                <p className="text-xs text-slate-400 mt-1">Vui lòng nhấn nút "Cập nhật tính toán ngay" hoặc "Phân tích & Tính toán Tải trọng" để tạo sơ đồ 2D.</p>
            </div>
        );
    }

    const currentCase = loadCases[selectedDir] || loadCases['+X'];
    if (!currentCase) return null;

    const isTheta0 = currentCase.isTheta0; // θ = 0° (Gió ngang X) hay θ = 90° (Gió dọc Y)
    const dim = isTheta0 ? geom.theta0 : geom.theta90;
    const b = dim.b;
    const d = dim.d;
    const e = dim.e;
    const H_col = geom.H_col;
    const H_rf = geom.H_rf;

    // Helper màu áp lực: Đẩy (+) Đỏ/Cam, Hút (-) Xanh lam/Dương
    const getZoneStyle = (val, isSelected = false) => {
        const isPos = val > 0;
        return {
            fill: isPos ? 'rgba(239, 68, 68, 0.28)' : 'rgba(59, 130, 246, 0.28)',
            stroke: isSelected ? '#f59e0b' : (isPos ? '#ef4444' : '#3b82f6'),
            strokeWidth: isSelected ? 3 : 1.5,
            textColor: isPos ? '#fca5a5' : '#93c5fd'
        };
    };

    const handleZoneClick = (zone) => {
        if (!zone) return;
        setSelectedZone(selectedZone && selectedZone.zone === zone.zone && selectedZone.surface === zone.surface ? null : zone);
    };

    // Tìm zone theo surface và nhãn
    const findSurface = (surface, zoneName) => {
        return currentCase.surfaces.find(s => s.surface === surface && s.zone === zoneName);
    };

    return (
        <div className="wind-svg-card bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-2xl text-slate-200">
            {/* Header điều khiển bản vẽ gió */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4 pb-3 border-b border-slate-700">
                <div>
                    <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                        <i data-lucide="wind" className="w-5 h-5 text-primary"></i>
                        SƠ ĐỒ 2D PHÂN VÙNG GIÓ TCVN 2737:2023 (HÌNH F.5a & HÌNH F.6)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                        <span>Bề rộng đón gió: <strong className="font-mono text-white">b = {b}m</strong></span>
                        <span>•</span>
                        <span>Chiều sâu nhà: <strong className="font-mono text-white">d = {d}m</strong></span>
                        <span>•</span>
                        <span>Kích thước tương đương: <strong className="font-mono text-amber-300">e = min(b, 2h) = {e}m</strong></span>
                        <span>•</span>
                        <span>Góc dốc mái: <strong className="font-mono text-cyan-300">α = {geom.alphaDeg}°</strong></span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Chọn hướng gió */}
                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 shadow-inner">
                        <button 
                            onClick={() => { setSelectedDir('+X'); setSelectedZone(null); }}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${selectedDir === '+X' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            +X (Gió ngang sườn 1)
                        </button>
                        <button 
                            onClick={() => { setSelectedDir('-X'); setSelectedZone(null); }}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${selectedDir === '-X' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            -X (Gió ngang sườn 2)
                        </button>
                        <button 
                            onClick={() => { setSelectedDir('+Y'); setSelectedZone(null); }}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${selectedDir === '+Y' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            +Y (Gió dọc đầu hồi 1)
                        </button>
                        <button 
                            onClick={() => { setSelectedDir('-Y'); setSelectedZone(null); }}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${selectedDir === '-Y' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            -Y (Gió dọc đầu hồi 2)
                        </button>
                    </div>

                    {/* Chọn chế độ hiển thị hệ số khí động */}
                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 shadow-inner">
                        <button 
                            onClick={() => setViewMode('net')}
                            className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'net' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                            title="Hệ số khí động tổng hợp c_net = c_e - c_i"
                        >
                            c_net (Tổng hợp)
                        </button>
                        <button 
                            onClick={() => setViewMode('ce')}
                            className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'ce' ? 'bg-blue-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                            title="Hệ số khí động mặt ngoài theo Phụ lục F"
                        >
                            c_e (Mặt ngoài)
                        </button>
                        <button 
                            onClick={() => setViewMode('ci')}
                            className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${viewMode === 'ci' ? 'bg-purple-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                            title="Hệ số khí động áp lực trong theo Mục F.12"
                        >
                            c_i (Áp lực trong)
                        </button>
                    </div>
                </div>
            </div>

            {/* Nội dung 2 khu vực: Bản vẽ SVG trực quan và Chi tiết thông số vùng */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* ================= KHU VỰC VẼ SVG (8 cột) ================= */}
                <div className="lg:col-span-8 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto flex flex-col items-center justify-center">
                    <svg width="680" height="420" viewBox="0 0 680 420" className="max-w-full">
                        <defs>
                            <marker id="wind-main-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
                            </marker>
                            <marker id="arrow-press" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
                            </marker>
                            <marker id="arrow-suct" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
                                <polygon points="6 0, 0 3, 6 6" fill="#3b82f6" />
                            </marker>
                        </defs>

                        {/* ================= 1. MẶT BẰNG PHÂN VÙNG MÁI (HÌNH F.6) ================= */}
                        <g transform="translate(30, 35)">
                            <text x="140" y="-12" fill="#e2e8f0" fontSize="12" fontWeight="bold" textAnchor="middle">
                                1. MẶT BẰNG PHÂN VÙNG MÁI {isTheta0 ? '(HÌNH F.6b: θ = 0°)' : '(HÌNH F.6c: θ = 90°)'}
                            </text>
                            
                            {/* Khung mặt bằng mái */}
                            <rect x="0" y="0" width="280" height="150" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                            
                            {/* Đường nóc mái ở giữa */}
                            <line x1="0" y1="75" x2="280" y2="75" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,3" />
                            <text x="284" y="79" fill="#f59e0b" fontSize="9" fontWeight="bold">Đường nóc</text>

                            {isTheta0 ? (
                                // Gió θ = 0° (Gió ngang thổi từ mép dưới lên)
                                <g>
                                    {/* Mũi tên hướng gió chính */}
                                    <line x1="140" y1="185" x2="140" y2="158" stroke="#10b981" strokeWidth="3.5" markerEnd="url(#wind-main-arrow)" />
                                    <text x="140" y="200" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">
                                        HƯỚNG GIÓ {selectedDir} (θ = 0°)
                                    </text>

                                    {/* Vùng F (2 góc mép đón gió: rộng e/4 = 55px, sâu e/10 = 20px) */}
                                    {(() => {
                                        const zF = findSurface('Mái', 'F');
                                        const val = zF ? (viewMode === 'ci' ? zF.ci : (viewMode === 'ce' ? zF.ce : zF.c_net)) : -1.2;
                                        const isSel = selectedZone && selectedZone.zone === 'F' && selectedZone.surface === 'Mái';
                                        const stF = getZoneStyle(val, isSel);
                                        return (
                                            <>
                                                <rect x="0" y="130" width="55" height="20" fill={stF.fill} stroke={stF.stroke} strokeWidth={stF.strokeWidth} className="cursor-pointer" onClick={() => handleZoneClick(zF)} />
                                                <text x="27" y="144" fill={stF.textColor} fontSize="9" fontWeight="bold" textAnchor="middle">F ({val})</text>

                                                <rect x="225" y="130" width="55" height="20" fill={stF.fill} stroke={stF.stroke} strokeWidth={stF.strokeWidth} className="cursor-pointer" onClick={() => handleZoneClick(zF)} />
                                                <text x="252" y="144" fill={stF.textColor} fontSize="9" fontWeight="bold" textAnchor="middle">F ({val})</text>
                                            </>
                                        );
                                    })()}

                                    {/* Vùng G (dải giữa đón gió: x: 55 -> 225) */}
                                    {(() => {
                                        const zG = findSurface('Mái', 'G');
                                        const val = zG ? (viewMode === 'ci' ? zG.ci : (viewMode === 'ce' ? zG.ce : zG.c_net)) : -0.8;
                                        const isSel = selectedZone && selectedZone.zone === 'G' && selectedZone.surface === 'Mái';
                                        const stG = getZoneStyle(val, isSel);
                                        return (
                                            <g className="cursor-pointer" onClick={() => handleZoneClick(zG)}>
                                                <rect x="55" y="130" width="170" height="20" fill={stG.fill} stroke={stG.stroke} strokeWidth={stG.strokeWidth} />
                                                <text x="140" y="144" fill={stG.textColor} fontSize="9.5" fontWeight="bold" textAnchor="middle">VÙNG G ({val})</text>
                                            </g>
                                        );
                                    })()}

                                    {/* Vùng H (toàn bộ diện tích còn lại sườn đón gió) */}
                                    {(() => {
                                        const zH = findSurface('Mái', 'H');
                                        const val = zH ? (viewMode === 'ci' ? zH.ci : (viewMode === 'ce' ? zH.ce : zH.c_net)) : -0.5;
                                        const isSel = selectedZone && selectedZone.zone === 'H' && selectedZone.surface === 'Mái';
                                        const stH = getZoneStyle(val, isSel);
                                        return (
                                            <g className="cursor-pointer" onClick={() => handleZoneClick(zH)}>
                                                <rect x="0" y="75" width="280" height="55" fill={stH.fill} stroke={stH.stroke} strokeWidth={stH.strokeWidth} />
                                                <text x="140" y="105" fill={stH.textColor} fontSize="11" fontWeight="bold" textAnchor="middle">VÙNG H ({val})</text>
                                            </g>
                                        );
                                    })()}

                                    {/* Vùng J (dải nóc khuất gió, sâu e/10 = 20px) */}
                                    {(() => {
                                        const zJ = findSurface('Mái', 'J');
                                        const val = zJ ? (viewMode === 'ci' ? zJ.ci : (viewMode === 'ce' ? zJ.ce : zJ.c_net)) : -0.6;
                                        const isSel = selectedZone && selectedZone.zone === 'J' && selectedZone.surface === 'Mái';
                                        const stJ = getZoneStyle(val, isSel);
                                        return (
                                            <g className="cursor-pointer" onClick={() => handleZoneClick(zJ)}>
                                                <rect x="0" y="55" width="280" height="20" fill={stJ.fill} stroke={stJ.stroke} strokeWidth={stJ.strokeWidth} />
                                                <text x="140" y="69" fill={stJ.textColor} fontSize="9.5" fontWeight="bold" textAnchor="middle">VÙNG J ({val})</text>
                                            </g>
                                        );
                                    })()}

                                    {/* Vùng I (phần còn lại sườn khuất gió) */}
                                    {(() => {
                                        const zI = findSurface('Mái', 'I');
                                        const val = zI ? (viewMode === 'ci' ? zI.ci : (viewMode === 'ce' ? zI.ce : zI.c_net)) : -0.5;
                                        const isSel = selectedZone && selectedZone.zone === 'I' && selectedZone.surface === 'Mái';
                                        const stI = getZoneStyle(val, isSel);
                                        return (
                                            <g className="cursor-pointer" onClick={() => handleZoneClick(zI)}>
                                                <rect x="0" y="0" width="280" height="55" fill={stI.fill} stroke={stI.stroke} strokeWidth={stI.strokeWidth} />
                                                <text x="140" y="32" fill={stI.textColor} fontSize="11" fontWeight="bold" textAnchor="middle">VÙNG I ({val})</text>
                                            </g>
                                        );
                                    })()}

                                    {/* Kích thước đường gióng e/4, e/10 */}
                                    <text x="27" y="162" fill="#94a3b8" fontSize="8" textAnchor="middle">e/4</text>
                                    <text x="252" y="162" fill="#94a3b8" fontSize="8" textAnchor="middle">e/4</text>
                                    <text x="-12" y="142" fill="#94a3b8" fontSize="8" textAnchor="middle">e/10</text>
                                </g>
                            ) : (
                                // Gió θ = 90° (Gió dọc thổi từ trái sang phải dọc theo đường nóc)
                                <g>
                                    <line x1="-35" y1="75" x2="-10" y2="75" stroke="#10b981" strokeWidth="3.5" markerEnd="url(#wind-main-arrow)" />
                                    <text x="-38" y="72" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="end">GIÓ θ = 90°</text>

                                    {/* Vùng F (2 góc mép đón gió đầu hồi) */}
                                    {(() => {
                                        const zF = findSurface('Mái', 'F');
                                        const val = zF ? (viewMode === 'ci' ? zF.ci : (viewMode === 'ce' ? zF.ce : zF.c_net)) : -1.6;
                                        const isSel = selectedZone && selectedZone.zone === 'F' && selectedZone.surface === 'Mái';
                                        const stF = getZoneStyle(val, isSel);
                                        return (
                                            <>
                                                <rect x="0" y="0" width="30" height="35" fill={stF.fill} stroke={stF.stroke} strokeWidth={stF.strokeWidth} className="cursor-pointer" onClick={() => handleZoneClick(zF)} />
                                                <text x="15" y="20" fill={stF.textColor} fontSize="8.5" fontWeight="bold" textAnchor="middle">F ({val})</text>
                                                
                                                <rect x="0" y="115" width="30" height="35" fill={stF.fill} stroke={stF.stroke} strokeWidth={stF.strokeWidth} className="cursor-pointer" onClick={() => handleZoneClick(zF)} />
                                                <text x="15" y="135" fill={stF.textColor} fontSize="8.5" fontWeight="bold" textAnchor="middle">F ({val})</text>
                                            </>
                                        );
                                    })()}

                                    {/* Vùng G (dải đón gió ở giữa) */}
                                    {(() => {
                                        const zG = findSurface('Mái', 'G');
                                        const val = zG ? (viewMode === 'ci' ? zG.ci : (viewMode === 'ce' ? zG.ce : zG.c_net)) : -1.3;
                                        const isSel = selectedZone && selectedZone.zone === 'G' && selectedZone.surface === 'Mái';
                                        const stG = getZoneStyle(val, isSel);
                                        return (
                                            <g className="cursor-pointer" onClick={() => handleZoneClick(zG)}>
                                                <rect x="0" y="35" width="30" height="80" fill={stG.fill} stroke={stG.stroke} strokeWidth={stG.strokeWidth} />
                                                <text x="15" y="78" fill={stG.textColor} fontSize="8.5" fontWeight="bold" textAnchor="middle">G ({val})</text>
                                            </g>
                                        );
                                    })()}

                                    {/* Vùng H (từ e/10 đến e/2) */}
                                    {(() => {
                                        const zH = findSurface('Mái', 'H');
                                        const val = zH ? (viewMode === 'ci' ? zH.ci : (viewMode === 'ce' ? zH.ce : zH.c_net)) : -0.7;
                                        const isSel = selectedZone && selectedZone.zone === 'H' && selectedZone.surface === 'Mái';
                                        const stH = getZoneStyle(val, isSel);
                                        return (
                                            <g className="cursor-pointer" onClick={() => handleZoneClick(zH)}>
                                                <rect x="30" y="0" width="90" height="150" fill={stH.fill} stroke={stH.stroke} strokeWidth={stH.strokeWidth} />
                                                <text x="75" y="78" fill={stH.textColor} fontSize="11" fontWeight="bold" textAnchor="middle">VÙNG H ({val})</text>
                                            </g>
                                        );
                                    })()}

                                    {/* Vùng I (từ e/2 đến hết chiều dài d) */}
                                    {(() => {
                                        const zI = findSurface('Mái', 'I');
                                        const val = zI ? (viewMode === 'ci' ? zI.ci : (viewMode === 'ce' ? zI.ce : zI.c_net)) : -0.6;
                                        const isSel = selectedZone && selectedZone.zone === 'I' && selectedZone.surface === 'Mái';
                                        const stI = getZoneStyle(val, isSel);
                                        return (
                                            <g className="cursor-pointer" onClick={() => handleZoneClick(zI)}>
                                                <rect x="120" y="0" width="160" height="150" fill={stI.fill} stroke={stI.stroke} strokeWidth={stI.strokeWidth} />
                                                <text x="200" y="78" fill={stI.textColor} fontSize="11" fontWeight="bold" textAnchor="middle">VÙNG I ({val})</text>
                                            </g>
                                        );
                                    })()}
                                </g>
                            )}
                        </g>

                        {/* ================= 2. MẶT ĐỨNG KHUNG PHÂN VÙNG TƯỜNG (HÌNH F.5a) ================= */}
                        <g transform="translate(370, 35)">
                            <text x="130" y="-12" fill="#e2e8f0" fontSize="12" fontWeight="bold" textAnchor="middle">
                                2. MẶT ĐỨNG KHUNG & VÙNG TƯỜNG D, E (HÌNH F.5a)
                            </text>

                            {/* Cột và Kèo dầm mái dốc */}
                            <path d="M 30,150 L 30,65 L 130,28 L 230,65 L 230,150 Z" fill="#0b1329" stroke="#64748b" strokeWidth="2" />
                            {/* Mặt đất */}
                            <line x1="10" y1="150" x2="250" y2="150" stroke="#475569" strokeWidth="2.5" />

                            {/* Tường đón gió D (trái) */}
                            {(() => {
                                const zD = findSurface('Tường', 'D');
                                const val = zD ? (viewMode === 'ci' ? zD.ci : (viewMode === 'ce' ? zD.ce : zD.c_net)) : 0.8;
                                const isSel = selectedZone && selectedZone.zone === 'D' && selectedZone.surface === 'Tường';
                                const stD = getZoneStyle(val, isSel);
                                return (
                                    <g className="cursor-pointer" onClick={() => handleZoneClick(zD)}>
                                        <rect x="10" y="65" width="20" height="85" fill={stD.fill} stroke={stD.stroke} strokeWidth={stD.strokeWidth} />
                                        <text x="20" y="110" fill={stD.textColor} fontSize="9.5" fontWeight="bold" textAnchor="middle" transform="rotate(-90 20 110)">D ({val})</text>
                                        
                                        {/* Vector lực đẩy vào tường D */}
                                        <line x1="-15" y1="105" x2="5" y2="105" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow-press)" />
                                    </g>
                                );
                            })()}

                            {/* Tường khuất gió E (phải) */}
                            {(() => {
                                const zE = findSurface('Tường', 'E');
                                const val = zE ? (viewMode === 'ci' ? zE.ci : (viewMode === 'ce' ? zE.ce : zE.c_net)) : -0.5;
                                const isSel = selectedZone && selectedZone.zone === 'E' && selectedZone.surface === 'Tường';
                                const stE = getZoneStyle(val, isSel);
                                return (
                                    <g className="cursor-pointer" onClick={() => handleZoneClick(zE)}>
                                        <rect x="230" y="65" width="20" height="85" fill={stE.fill} stroke={stE.stroke} strokeWidth={stE.strokeWidth} />
                                        <text x="240" y="110" fill={stE.textColor} fontSize="9.5" fontWeight="bold" textAnchor="middle" transform="rotate(90 240 110)">E ({val})</text>
                                        
                                        {/* Vector lực hút ra khỏi tường E */}
                                        <line x1="255" y1="105" x2="275" y2="105" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow-suct)" />
                                    </g>
                                );
                            })()}

                            {/* Ký hiệu cao độ */}
                            <text x="130" y="20" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">Đỉnh mái +{H_rf}m</text>
                            <text x="28" y="55" fill="#94a3b8" fontSize="9" textAnchor="end">H={H_col}m</text>
                            <text x="130" y="165" fill="#94a3b8" fontSize="9.5" textAnchor="middle">Nhịp L = {geom.L} m</text>
                        </g>

                        {/* ================= 3. SƠ ĐỒ ÁP LỰC KHÍ ĐỘNG CÓ ÁP LỰC TRONG (HÌNH F.14) ================= */}
                        <g transform="translate(60, 255)">
                            <text x="260" y="-5" fill="#e2e8f0" fontSize="12" fontWeight="bold" textAnchor="middle">
                                3. SƠ ĐỒ ÁP LỰC TỔNG HỢP CÓ XÉT ÁP LỰC TRONG c_i (HÌNH F.14 - TCVN 2737:2023)
                            </text>
                            
                            {/* Vỏ bao che công trình */}
                            <path d="M 60,115 L 60,50 L 260,18 L 460,50 L 460,115" fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="4,3" />
                            
                            {/* Khối bên trong hiển thị c_i */}
                            <rect x="210" y="50" width="100" height="42" rx="6" fill="#4c1d95" stroke="#a855f7" strokeWidth="1.5" />
                            <text x="260" y="68" fill="#e9d5ff" fontSize="10" fontWeight="bold" textAnchor="middle">ÁP LỰC TRONG</text>
                            <text x="260" y="85" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">
                                c_i = {currentCase.ci > 0 ? `+${currentCase.ci}` : currentCase.ci}
                            </text>

                            {/* Công thức tổng hợp */}
                            <text x="260" y="125" fill="#38bdf8" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                                c_net = c_e - c_i | w_k = W_3s,10 × k(z_e) × c_net × G_f | w_d = 2,1 × w_k
                            </text>
                        </g>
                    </svg>

                    {/* Chú giải ý nghĩa màu sắc */}
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-3 pt-3 border-t border-slate-800 text-xs">
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
                        <span className="text-amber-400 italic">💡 Nhấp chuột vào từng vùng (F, G, H, J, I, D, E...) để xem công thức chi tiết</span>
                    </div>
                </div>

                {/* ================= PANEL THÔNG SỐ VÙNG ĐƯỢC CHỌN (4 cột) ================= */}
                <div className="lg:col-span-4 bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col justify-between shadow-lg">
                    <div>
                        <div className="flex justify-between items-center pb-2.5 border-b border-slate-700 mb-3">
                            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                                <i data-lucide="info" className="w-4 h-4 text-primary"></i>
                                THÔNG SỐ VÙNG KHÍ ĐỘNG
                            </h4>
                            {selectedZone ? (
                                <span className="bg-primary/20 text-primary border border-primary/40 text-xs px-2.5 py-0.5 rounded font-mono font-bold">
                                    Vùng {selectedZone.zone} ({selectedZone.surface})
                                </span>
                            ) : (
                                <span className="text-xs text-slate-400 italic">Chưa chọn vùng</span>
                            )}
                        </div>

                        {selectedZone ? (
                            <div className="space-y-3 text-xs">
                                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-700">
                                    <div className="text-slate-400">Vùng khí động: <strong className="text-white">{selectedZone.name || selectedZone.zone}</strong></div>
                                    <div className="text-slate-400">Bề mặt kết cấu: <strong className="text-amber-300">{selectedZone.surface}</strong></div>
                                    <div className="text-slate-400">Độ cao tương đương z_e: <strong className="text-cyan-300 font-mono">{selectedZone.ze} m</strong></div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                                        <span className="text-slate-400">Hệ số k(z_e):</span>
                                        <div className="text-base font-bold text-white font-mono mt-0.5">{selectedZone.kz}</div>
                                        <span className="text-[10px] text-slate-500">Bảng 9 TCVN 2737</span>
                                    </div>
                                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                                        <span className="text-slate-400">Hệ số giật G_f:</span>
                                        <div className="text-base font-bold text-white font-mono mt-0.5">{selectedZone.Gf}</div>
                                        <span className="text-[10px] text-slate-500">Mục 10.2.7</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 text-center">
                                        <span className="text-[11px] text-slate-400">c_e ngoài:</span>
                                        <div className={`text-sm font-bold font-mono mt-1 ${selectedZone.ce > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                            {selectedZone.ce > 0 ? `+${selectedZone.ce}` : selectedZone.ce}
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 text-center">
                                        <span className="text-[11px] text-slate-400">c_i trong:</span>
                                        <div className="text-sm font-bold text-purple-300 font-mono mt-1">
                                            {selectedZone.ci > 0 ? `+${selectedZone.ci}` : selectedZone.ci}
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-700 text-center">
                                        <span className="text-[11px] text-slate-400">c_net:</span>
                                        <div className={`text-sm font-bold font-mono mt-1 ${selectedZone.c_net > 0 ? 'text-red-300' : 'text-cyan-300'}`}>
                                            {selectedZone.c_net > 0 ? `+${selectedZone.c_net}` : selectedZone.c_net}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Áp lực tiêu chuẩn w_k:</span>
                                        <span className="font-bold text-white font-mono">{selectedZone.pressure_k} kN/m²</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Áp lực tính toán w_d:</span>
                                        <span className="font-bold text-amber-300 font-mono">{selectedZone.pressure_d} kN/m²</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-800">
                                        <span className="text-emerald-400 font-bold">Tải khung ngang q_d:</span>
                                        <span className="text-base font-extrabold text-emerald-300 font-mono">{selectedZone.frameLineLoad_d} kN/m</span>
                                    </div>
                                    <div className="text-[10.5px] text-slate-500 italic text-right">
                                        (Diện truyền tải khung B = {selectedZone.tributaryWidth} m, γ_f = 2,1)
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-400 text-xs italic space-y-3 py-4 text-center">
                                <p>👉 Nhấp vào bất kỳ ô nào trên bản vẽ mặt bằng mái hoặc mặt đứng khung để xem kết quả tính toán chi tiết của vùng đó.</p>
                                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-700 text-left text-[11px] not-italic text-slate-300 space-y-1.5 shadow-inner">
                                    <div className="font-bold text-amber-300">Công thức cơ bản TCVN 2737:2023:</div>
                                    <div>• W₃ₛ,₁₀ = 0,852 × W₀ = {currentCase.W3s_10} kN/m²</div>
                                    <div>• G_f = 0,85 + h/1010 = {currentCase.Gf}</div>
                                    <div>• Áp lực trong c_i = ±0,2 (Độ hở μ ≤ 5%)</div>
                                    <div>• Hệ số độ tin cậy tải trọng gió: γ_f = 2,1</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700 text-[11px] text-slate-400 flex justify-between items-center">
                        <span>Tiêu chuẩn: <strong>TCVN 2737:2023</strong></span>
                        <span className="text-primary font-mono font-semibold">Phụ lục F</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.WindSvg = WindSvg;
