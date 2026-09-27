const { useState, useEffect, useMemo, useCallback } = React;

const WindSvg = (props) => {
    const geom = props.geom || props.inputs;
    const loadCases = props.loadCases || (props.windResult && props.windResult.directions);
    const windResult = props.windResult;
    const inputs = props.inputs || props.geom;

    const [selectedDir, setSelectedDir] = useState('+X');
    const [viewMode, setViewMode] = useState('cross_section'); // 'roof_plan', 'wall_plan', 'cross_section'
    const [coeffMode, setCoeffMode] = useState('net'); // 'net', 'ce', 'ci'
    const [selectedZone, setSelectedZone] = useState(null);
    const [hoverZone, setHoverZone] = useState(null);

    if (!geom || !loadCases) {
        return (
            <div className="p-8 bg-slate-900 text-slate-300 rounded-xl border border-slate-700 text-center italic shadow-inner">
                <svg className="w-8 h-8 text-primary mx-auto mb-2 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.7 7.7A7.1 7.1 0 0 0 5 10.8A7.3 7.3 0 0 0 12 18h8a4 4 0 0 0 0-8c-.3 0-.7 0-1 .1"/>
                    <path d="M8 15l-4-4 4-4"/>
                </svg>
                <p className="font-semibold">Chưa có kết quả phân tích khí động học.</p>
                <p className="text-xs text-slate-400 mt-1">Vui lòng tính toán trước khi xem sơ đồ.</p>
            </div>
        );
    }

    const currentCase = loadCases[selectedDir] || loadCases['+X'];
    if (!currentCase) return null;

    const isTheta0 = currentCase.isTheta0 !== undefined ? currentCase.isTheta0 : (selectedDir === '+X' || selectedDir === '-X');
    const W0 = windResult?.W3s_10 || currentCase.W3s_10 || 0;
    
    // Geometry values
    const L = geom.L || 0;
    const B = geom.B || 0;
    const H_col = geom.H_column || geom.H_col || 0;
    const H_rf = geom.H_roof || geom.H_rf || 0;
    const alpha = geom.alphaDeg || geom.alpha || 0;
    
    // Kích thước chuẩn xác theo TCVN 2737:2023 Phụ lục F.4 & analyzeGeometry
    const h = geom.h || geom.H_rf || geom.H_roof || H_rf || H_col;
    const b = isTheta0 ? (geom.theta0?.b || geom.d_total || geom.length || 72) : (geom.theta90?.b || geom.L || 25);
    const d = isTheta0 ? (geom.theta0?.d || geom.L || 25) : (geom.theta90?.d || geom.d_total || geom.length || 72);
    const e = isTheta0 ? (geom.theta0?.e || Math.min(b, 2 * h)) : (geom.theta90?.e || Math.min(b, 2 * h));

    const getZoneData = (surface, zoneName) => {
        if (currentCase.surfaces) {
            return currentCase.surfaces.find(s => s.surface === surface && s.zone === zoneName);
        }
        const zones = surface === 'Tường' || surface === 'Wall' ? currentCase.wallZones : currentCase.roofZones;
        if (zones) {
            return zones.find(z => z.zone === zoneName);
        }
        return null;
    };

    const getVal = (zone) => {
        if (!zone) return 0;
        if (coeffMode === 'ci') return zone.ci || 0;
        if (coeffMode === 'ce') return zone.ce || 0;
        const ceVal = zone.ce || 0;
        const ciVal = currentCase?.ci || 0;
        return zone.c_net !== undefined ? zone.c_net : (ceVal - ciVal);
    };

    const getPressureVal = (zone) => {
        if (!zone) return 0;
        return zone.pressure_d || zone.pressure_k || 0;
    };

    const getZoneStyle = (val, isSel = false, isHover = false) => {
        const isPos = val > 0;
        return {
            fill: isSel ? 'url(#hatch-sel)' : (isPos ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.25)'),
            stroke: isSel ? '#f59e0b' : (isHover ? '#fff' : (isPos ? '#ef4444' : '#3b82f6')),
            strokeWidth: isSel ? 3 : (isHover ? 2 : 1),
            textColor: isPos ? '#fca5a5' : '#93c5fd'
        };
    };

    const handleZoneClick = (zone) => {
        if (!zone) return;
        setSelectedZone(prev => (prev && prev.zone === zone.zone && prev.surface === zone.surface) ? null : zone);
    };

    const SVG_WIDTH = 800;
    const SVG_HEIGHT = 500;
    
    const drawGrid = () => (
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        </pattern>
    );

    const drawDefs = () => (
        <defs>
            {drawGrid()}
            <pattern id="hatch-sel" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" strokeWidth="2" opacity="0.5" />
            </pattern>
            <linearGradient id="grad-press" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#b91c1c" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-suct" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1" />
            </linearGradient>
            <marker id="wind-main-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#10b981" />
            </marker>
            <marker id="arrow-press" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#b91c1c" />
            </marker>
            <marker id="arrow-suct" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#1d4ed8" />
            </marker>
            <marker id="dim-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#94a3b8" />
            </marker>
        </defs>
    );

    const renderPressureArrow = (x, y, val, angle, pressureVal, lengthScale = 20) => {
        const isPos = val > 0;
        const length = Math.max(15, Math.min(60, Math.abs(val) * lengthScale));
        const color = isPos ? 'url(#grad-press)' : 'url(#grad-suct)';
        const marker = isPos ? 'url(#arrow-press)' : 'url(#arrow-suct)';
        const textColor = isPos ? '#ef4444' : '#3b82f6';
        
        const finalAngle = isPos ? angle : angle + 180;
        
        return (
            <g transform={`translate(${x}, ${y}) rotate(${finalAngle})`}>
                <line x1="0" y1="0" x2={length} y2="0" stroke={color} strokeWidth="3" markerEnd={marker} />
                <text x={length + 12} y="4" fill={textColor} fontSize="11" fontWeight="bold" transform={`rotate(${-finalAngle} ${length + 12} 4)`}>
                    {Math.abs(pressureVal).toFixed(2)}
                </text>
            </g>
        );
    };

    const renderDimension = (x1, y1, x2, y2, label, offset = 20, isVertical = false) => {
        const dx = isVertical ? offset : 0;
        const dy = isVertical ? 0 : offset;
        return (
            <g>
                <line x1={x1} y1={y1} x2={x1+dx} y2={y1+dy} stroke="rgba(100,116,139,0.3)" strokeWidth="1" strokeDasharray="2,2"/>
                <line x1={x2} y1={y2} x2={x2+dx} y2={y2+dy} stroke="rgba(100,116,139,0.3)" strokeWidth="1" strokeDasharray="2,2"/>
                <line x1={x1+dx} y1={y1+dy} x2={x2+dx} y2={y2+dy} stroke="#94a3b8" strokeWidth="1" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)"/>
                <text x={(x1+x2)/2 + dx + (isVertical?5:0)} y={(y1+y2)/2 + dy - (isVertical?0:5)} fill="#cbd5e1" fontSize="10" textAnchor="middle" dominantBaseline={isVertical ? "middle" : "auto"}>
                    {label}
                </text>
            </g>
        );
    };

    const renderNorthArrow = (x, y) => (
        <g transform={`translate(${x}, ${y})`}>
            <circle cx="0" cy="0" r="15" fill="none" stroke="#64748b" strokeWidth="2"/>
            <polygon points="0,-18 5,-5 0,0 -5,-5" fill="#ef4444"/>
            <polygon points="0,18 5,5 0,0 -5,5" fill="#cbd5e1"/>
            <text x="0" y="-22" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="middle">N</text>
        </g>
    );

    const renderCrossSection = () => {
        const cx = 400, cy = 380;
        const spanM = Math.max(Number(L) || 25, 10);
        const scale = Math.min(35, 560 / spanM);
        const w = spanM * scale;
        const hCol = (Number(H_col) || 8) * scale;
        const rawRise = H_rf > H_col ? (H_rf - H_col) : (spanM / 2) * Math.tan((alpha || 5.71) * Math.PI / 180);
        const hRf = Math.max(25, rawRise * scale);
        
        const pLL = { x: cx - w/2, y: cy };
        const pLR = { x: cx + w/2, y: cy };
        const pTL = { x: cx - w/2, y: cy - hCol };
        const pTR = { x: cx + w/2, y: cy - hCol };
        const pApex = { x: cx, y: cy - hCol - hRf };

        const roofAngleDeg = (Math.atan2(hRf, w/2) * 180) / Math.PI;
        
        const isLeftToRight = selectedDir === '+X' || selectedDir === '+Y';
        const windX = isLeftToRight ? pTL.x - 90 : pTR.x + 90;
        const windDir = isLeftToRight ? 1 : -1;

        return (
            <g>
                <text x="400" y="35" fill="#e2e8f0" fontSize="15" fontWeight="bold" textAnchor="middle">
                    MẶT CẮT NGANG KHUNG NGANG & PHÂN VÙNG ÁP LỰC
                </text>
                
                {/* Wind direction main arrow */}
                <g transform={`translate(${windX}, ${cy - hCol/2})`}>
                    <line x1="0" y1="0" x2={windDir * 55} y2="0" stroke="#10b981" strokeWidth="4" markerEnd="url(#wind-main-arrow)" />
                    <text x={windDir * 28} y="-12" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">GIÓ {selectedDir}</text>
                </g>

                {/* Ground line */}
                <line x1="60" y1={cy} x2="740" y2={cy} stroke="#475569" strokeWidth="2" strokeDasharray="8,4" />
                <text x="735" y={cy - 6} fill="#64748b" fontSize="10" textAnchor="end">±0.000</text>

                {/* Foundation pedestals */}
                <rect x={pLL.x - 14} y={cy} width="28" height="12" fill="#334155" stroke="#64748b" strokeWidth="1" rx="2" />
                <rect x={pLR.x - 14} y={cy} width="28" height="12" fill="#334155" stroke="#64748b" strokeWidth="1" rx="2" />

                {/* Main frame silhouette */}
                <path d={`M ${pLL.x} ${pLL.y} L ${pTL.x} ${pTL.y} L ${pApex.x} ${pApex.y} L ${pTR.x} ${pTR.y} L ${pLR.x} ${pLR.y} Z`} fill="rgba(30, 41, 59, 0.45)" stroke="#64748b" strokeWidth="2.5" />

                {/* Centerline */}
                <line x1={cx} y1={pApex.y - 18} x2={cx} y2={cy} stroke="#f59e0b" strokeWidth="1" strokeDasharray="6,3" />
                <circle cx={cx} cy={pApex.y - 18} r="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
                <text x={cx} y={pApex.y - 15} fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle">CL</text>

                {/* Left Wall Zone */}
                {(() => {
                    const zoneName = isLeftToRight ? 'D' : 'E';
                    const z = getZoneData('Tường', zoneName) || getZoneData('Wall', zoneName);
                    if(!z) return null;
                    const val = getVal(z);
                    const ciVal = z.ci || currentCase.ci || 0;
                    const isSel = selectedZone?.zone === zoneName;
                    const st = getZoneStyle(val, isSel, hoverZone?.zone === zoneName);
                    const wallThick = 14;
                    return (
                        <g onClick={() => handleZoneClick(z)} onMouseEnter={() => setHoverZone(z)} onMouseLeave={() => setHoverZone(null)} className="cursor-pointer group">
                            <title>{`Vùng ${zoneName} (${isLeftToRight ? 'Đón gió' : 'Khuất gió'}) - c_e: ${z.ce}, c_i: ${ciVal}, c_net: ${val.toFixed(2)}`}</title>
                            <rect x={pTL.x - wallThick} y={pTL.y} width={wallThick} height={hCol} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} rx="2"/>
                            
                            {/* External pressure arrow */}
                            {renderPressureArrow(pTL.x - wallThick/2, cy - hCol/2, z.ce, 0, getPressureVal(z), 25)}
                            <text x={pTL.x - wallThick - 12} y={cy - hCol/2 + 5} fill={st.textColor} fontSize="13" fontWeight="bold" textAnchor="end">{zoneName}</text>
                            
                            {/* Internal pressure arrow */}
                            {ciVal !== 0 && (
                                <g opacity="0.6">
                                    {renderPressureArrow(pTL.x + 10, cy - hCol/2, ciVal, 180, Math.abs(ciVal * W0 * (z.Gf || 1)), 15)}
                                </g>
                            )}
                        </g>
                    );
                })()}

                {/* Right Wall Zone */}
                {(() => {
                    const zoneName = isLeftToRight ? 'E' : 'D';
                    const z = getZoneData('Tường', zoneName) || getZoneData('Wall', zoneName);
                    if(!z) return null;
                    const val = getVal(z);
                    const ciVal = z.ci || currentCase.ci || 0;
                    const isSel = selectedZone?.zone === zoneName;
                    const st = getZoneStyle(val, isSel, hoverZone?.zone === zoneName);
                    const wallThick = 14;
                    return (
                        <g onClick={() => handleZoneClick(z)} onMouseEnter={() => setHoverZone(z)} onMouseLeave={() => setHoverZone(null)} className="cursor-pointer group">
                            <title>{`Vùng ${zoneName} (${!isLeftToRight ? 'Đón gió' : 'Khuất gió'}) - c_e: ${z.ce}, c_i: ${ciVal}, c_net: ${val.toFixed(2)}`}</title>
                            <rect x={pTR.x} y={pTR.y} width={wallThick} height={hCol} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} rx="2"/>
                            
                            {/* External pressure arrow */}
                            {renderPressureArrow(pTR.x + wallThick/2, cy - hCol/2, z.ce, 180, getPressureVal(z), 25)}
                            <text x={pTR.x + wallThick + 12} y={cy - hCol/2 + 5} fill={st.textColor} fontSize="13" fontWeight="bold" textAnchor="start">{zoneName}</text>
                            
                            {/* Internal pressure arrow */}
                            {ciVal !== 0 && (
                                <g opacity="0.6">
                                    {renderPressureArrow(pTR.x - 10, cy - hCol/2, ciVal, 0, Math.abs(ciVal * W0 * (z.Gf || 1)), 15)}
                                </g>
                            )}
                        </g>
                    );
                })()}

                {/* Left Roof Zone */}
                {(() => {
                    const zG = getZoneData('Mái', 'G') || getZoneData('Roof', 'G') || getZoneData('Mái', 'H');
                    if(!zG) return null;
                    const val = getVal(zG);
                    const ciVal = zG.ci || currentCase.ci || 0;
                    const isSel = selectedZone?.zone === zG.zone;
                    const st = getZoneStyle(val, isSel, hoverZone?.zone === zG.zone);
                    const midX = (pTL.x + pApex.x) / 2;
                    const midY = (pTL.y + pApex.y) / 2;
                    const thick = 14;
                    return (
                        <g onClick={() => handleZoneClick(zG)} onMouseEnter={() => setHoverZone(zG)} onMouseLeave={() => setHoverZone(null)} className="cursor-pointer group">
                            <title>{`Vùng mái ${zG.zone} - c_e: ${zG.ce}, c_i: ${ciVal}, c_net: ${val.toFixed(2)}`}</title>
                            <path d={`M ${pTL.x} ${pTL.y} L ${pApex.x} ${pApex.y} L ${pApex.x} ${pApex.y - thick} L ${pTL.x - 4} ${pTL.y - thick} Z`} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth}/>
                            
                            {/* External pressure arrow */}
                            {renderPressureArrow(midX, midY - thick/2, zG.ce, 90 - roofAngleDeg, getPressureVal(zG), 25)}
                            <text x={midX} y={midY - 22} fill={st.textColor} fontSize="13" fontWeight="bold" textAnchor="middle" stroke="#090d16" strokeWidth="3" paintOrder="stroke">{zG.zone} ({val.toFixed(2)})</text>
                            
                            {/* Internal pressure arrow */}
                            {ciVal !== 0 && (
                                <g opacity="0.6">
                                    {renderPressureArrow(midX, midY + 10, ciVal, 270 - roofAngleDeg, Math.abs(ciVal * W0 * (zG.Gf || 1)), 15)}
                                </g>
                            )}
                        </g>
                    );
                })()}

                {/* Right Roof Zone */}
                {(() => {
                    const zI = getZoneData('Mái', 'I') || getZoneData('Roof', 'I') || getZoneData('Mái', 'J');
                    if(!zI) return null;
                    const val = getVal(zI);
                    const ciVal = zI.ci || currentCase.ci || 0;
                    const isSel = selectedZone?.zone === zI.zone;
                    const st = getZoneStyle(val, isSel, hoverZone?.zone === zI.zone);
                    const midX = (pTR.x + pApex.x) / 2;
                    const midY = (pTR.y + pApex.y) / 2;
                    const thick = 14;
                    return (
                        <g onClick={() => handleZoneClick(zI)} onMouseEnter={() => setHoverZone(zI)} onMouseLeave={() => setHoverZone(null)} className="cursor-pointer group">
                            <title>{`Vùng mái ${zI.zone} - c_e: ${zI.ce}, c_i: ${ciVal}, c_net: ${val.toFixed(2)}`}</title>
                            <path d={`M ${pApex.x} ${pApex.y} L ${pTR.x} ${pTR.y} L ${pTR.x + 4} ${pTR.y - thick} L ${pApex.x} ${pApex.y - thick} Z`} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth}/>
                            
                            {/* External pressure arrow */}
                            {renderPressureArrow(midX, midY - thick/2, zI.ce, 90 + roofAngleDeg, getPressureVal(zI), 25)}
                            <text x={midX} y={midY - 22} fill={st.textColor} fontSize="13" fontWeight="bold" textAnchor="middle" stroke="#090d16" strokeWidth="3" paintOrder="stroke">{zI.zone} ({val.toFixed(2)})</text>
                            
                            {/* Internal pressure arrow */}
                            {ciVal !== 0 && (
                                <g opacity="0.6">
                                    {renderPressureArrow(midX, midY + 10, ciVal, 270 + roofAngleDeg, Math.abs(ciVal * W0 * (zI.Gf || 1)), 15)}
                                </g>
                            )}
                        </g>
                    );
                })()}

                {/* Grid Bubbles A and B */}
                <g transform={`translate(${pLL.x}, ${cy + 24})`}>
                    <circle cx="0" cy="0" r="13" fill="#0f172a" stroke="#ef4444" strokeWidth="1.5" />
                    <text x="0" y="4" fill="#f87171" fontSize="11" fontWeight="bold" textAnchor="middle">A</text>
                    <line x1="0" y1="-13" x2="0" y2="-24" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2"/>
                </g>
                <g transform={`translate(${pLR.x}, ${cy + 24})`}>
                    <circle cx="0" cy="0" r="13" fill="#0f172a" stroke="#ef4444" strokeWidth="1.5" />
                    <text x="0" y="4" fill="#f87171" fontSize="11" fontWeight="bold" textAnchor="middle">B</text>
                    <line x1="0" y1="-13" x2="0" y2="-24" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2"/>
                </g>

                {/* Dimension Lines */}
                {renderDimension(pLL.x, cy, pLR.x, cy, `Nhịp L = ${L} m`, 55)}
                {renderDimension(pLL.x, cy, pTL.x, pTL.y, `H_cột = ${H_col} m`, -65, true)}
                {renderDimension(pLR.x, cy, pLR.x, pApex.y, `H_đỉnh = ${H_rf} m`, 65, true)}

                {/* Roof Slope Indicator */}
                <path d={`M ${pTL.x + 36} ${pTL.y} A 36 36 0 0 0 ${pTL.x + 32} ${pTL.y - 12}`} fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                <text x={pTL.x + 42} y={pTL.y - 8} fill="#cbd5e1" fontSize="11" fontWeight="bold">α = {alpha}°</text>
            </g>
        );
    };

    const renderRoofPlan = () => {
        const cx = 400, cy = 250;
        const b_dim = Math.max(Number(b) || 72, 5);
        const d_dim = Math.max(Number(d) || 25, 5);
        const maxW = 660;
        const maxH = 340;
        const scale = Math.min(maxW / b_dim, maxH / d_dim);
        const w = b_dim * scale;
        const h_dim = d_dim * scale;
        const e_scaled = Math.min(e * scale, h_dim * 0.95);
        
        return (
            <g>
                <text x="400" y="35" fill="#e2e8f0" fontSize="15" fontWeight="bold" textAnchor="middle">
                    SƠ ĐỒ PHÂN VÙNG MÁI THEO TCVN 2737:2023 (MẶT BẰNG)
                </text>
                {renderNorthArrow(730, 50)}
                
                {/* Wind direction indicator */}
                <g transform={`translate(${cx}, ${cy + h_dim/2 + 55})`}>
                    <line x1="0" y1="30" x2="0" y2="0" stroke="#10b981" strokeWidth="4" markerEnd="url(#wind-main-arrow)" />
                    <text x="0" y="44" fill="#10b981" fontSize="12" fontWeight="bold" textAnchor="middle">HƯỚNG GIÓ {selectedDir}</text>
                </g>

                <g transform={`translate(${cx - w/2}, ${cy - h_dim/2})`}>
                    {/* Roof Boundary */}
                    <rect x="0" y="0" width={w} height={h_dim} fill="#0f172a" stroke="#64748b" strokeWidth="2" />
                    
                    {/* Ridge Line */}
                    {isTheta0 ? (
                        <>
                            <line x1="0" y1={h_dim/2} x2={w} y2={h_dim/2} stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,3" />
                            <text x={w - 10} y={h_dim/2 - 6} fill="#fbbf24" fontSize="10" textAnchor="end">Đỉnh mái (Ridge)</text>
                        </>
                    ) : (
                        <>
                            <line x1={w/2} y1="0" x2={w/2} y2={h_dim} stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,3" />
                            <text x={w/2 + 6} y={15} fill="#fbbf24" fontSize="10">Đỉnh mái</text>
                        </>
                    )}

                    {isTheta0 ? (
                        /* Gió 0 độ */
                        <>
                            {/* Vùng F (Góc mép đón gió) */}
                            {['F'].map(zn => {
                                const z = getZoneData('Mái', zn) || getZoneData('Roof', zn);
                                if(!z) return null;
                                const val = getVal(z);
                                const isSel = selectedZone?.zone === zn;
                                const st = getZoneStyle(val, isSel, hoverZone?.zone === zn);
                                const fWidth = Math.min(e_scaled/4, w/4);
                                const fHeight = Math.min(e_scaled/10, h_dim/4);
                                return (
                                    <g key={zn} onClick={() => handleZoneClick(z)} onMouseEnter={()=>setHoverZone(z)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                        <title>{`Vùng ${zn}: ${val.toFixed(2)}`}</title>
                                        <rect x="0" y={h_dim - fHeight} width={fWidth} height={fHeight} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={fWidth/2} y={h_dim - fHeight/2 + 4} fill={st.textColor} fontSize="12" fontWeight="bold" textAnchor="middle">{zn}</text>
                                        
                                        <rect x={w - fWidth} y={h_dim - fHeight} width={fWidth} height={fHeight} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={w - fWidth/2} y={h_dim - fHeight/2 + 4} fill={st.textColor} fontSize="12" fontWeight="bold" textAnchor="middle">{zn}</text>
                                    </g>
                                );
                            })}
                            
                            {/* Vùng G (Dải giữa mép đón gió) */}
                            {['G'].map(zn => {
                                const z = getZoneData('Mái', zn) || getZoneData('Roof', zn);
                                if(!z) return null;
                                const val = getVal(z);
                                const isSel = selectedZone?.zone === zn;
                                const st = getZoneStyle(val, isSel, hoverZone?.zone === zn);
                                const fWidth = Math.min(e_scaled/4, w/4);
                                const fHeight = Math.min(e_scaled/10, h_dim/4);
                                return (
                                    <g key={zn} onClick={() => handleZoneClick(z)} onMouseEnter={()=>setHoverZone(z)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                        <title>{`Vùng ${zn}: ${val.toFixed(2)}`}</title>
                                        <rect x={fWidth} y={h_dim - fHeight} width={w - 2*fWidth} height={fHeight} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={w/2} y={h_dim - fHeight/2 + 4} fill={st.textColor} fontSize="13" fontWeight="bold" textAnchor="middle">{zn} ({val.toFixed(2)})</text>
                                    </g>
                                );
                            })}

                            {/* Vùng H (Mái đón gió còn lại) */}
                            {['H'].map(zn => {
                                const z = getZoneData('Mái', zn) || getZoneData('Roof', zn);
                                if(!z) return null;
                                const val = getVal(z);
                                const isSel = selectedZone?.zone === zn;
                                const st = getZoneStyle(val, isSel, hoverZone?.zone === zn);
                                const fHeight = Math.min(e_scaled/10, h_dim/4);
                                const hHeight = Math.max(0, h_dim/2 - fHeight);
                                return (
                                    <g key={zn} onClick={() => handleZoneClick(z)} onMouseEnter={()=>setHoverZone(z)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                        <title>{`Vùng ${zn}: ${val.toFixed(2)}`}</title>
                                        <rect x="0" y={h_dim/2} width={w} height={hHeight} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={w/2} y={h_dim/2 + hHeight/2 + 4} fill={st.textColor} fontSize="13" fontWeight="bold" textAnchor="middle">{zn} ({val.toFixed(2)})</text>
                                    </g>
                                );
                            })}

                            {/* Vùng J (Mái khuất gió - dải nóc) */}
                            {['J'].map(zn => {
                                const z = getZoneData('Mái', zn) || getZoneData('Roof', zn);
                                if(!z) return null;
                                const val = getVal(z);
                                const isSel = selectedZone?.zone === zn;
                                const st = getZoneStyle(val, isSel, hoverZone?.zone === zn);
                                const jHeight = Math.min(e_scaled/10, h_dim/4);
                                return (
                                    <g key={zn} onClick={() => handleZoneClick(z)} onMouseEnter={()=>setHoverZone(z)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                        <title>{`Vùng ${zn}: ${val.toFixed(2)}`}</title>
                                        <rect x="0" y={h_dim/2 - jHeight} width={w} height={jHeight} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={w/2} y={h_dim/2 - jHeight/2 + 4} fill={st.textColor} fontSize="13" fontWeight="bold" textAnchor="middle">{zn} ({val.toFixed(2)})</text>
                                    </g>
                                );
                            })}

                            {/* Vùng I (Mái khuất gió còn lại) */}
                            {['I'].map(zn => {
                                const z = getZoneData('Mái', zn) || getZoneData('Roof', zn);
                                if(!z) return null;
                                const val = getVal(z);
                                const isSel = selectedZone?.zone === zn;
                                const st = getZoneStyle(val, isSel, hoverZone?.zone === zn);
                                const jHeight = Math.min(e_scaled/10, h_dim/4);
                                const iHeight = Math.max(0, h_dim/2 - jHeight);
                                return (
                                    <g key={zn} onClick={() => handleZoneClick(z)} onMouseEnter={()=>setHoverZone(z)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                        <title>{`Vùng ${zn}: ${val.toFixed(2)}`}</title>
                                        <rect x="0" y="0" width={w} height={iHeight} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={w/2} y={iHeight/2 + 4} fill={st.textColor} fontSize="13" fontWeight="bold" textAnchor="middle">{zn} ({val.toFixed(2)})</text>
                                    </g>
                                );
                            })}
                        </>
                    ) : (
                        /* Gió 90 độ */
                        <>
                            {/* Vùng F (Góc mép hồi đón gió) */}
                            {['F'].map(zn => {
                                const z = getZoneData('Mái', zn) || getZoneData('Roof', zn);
                                if(!z) return null;
                                const val = getVal(z);
                                const isSel = selectedZone?.zone === zn;
                                const st = getZoneStyle(val, isSel, hoverZone?.zone === zn);
                                const fWidth = Math.min(e_scaled/4, w/3);
                                const fHeight = Math.min(e_scaled/10, h_dim/4);
                                return (
                                    <g key={zn} onClick={() => handleZoneClick(z)} onMouseEnter={()=>setHoverZone(z)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                        <title>{`Vùng ${zn}: ${val.toFixed(2)}`}</title>
                                        <rect x="0" y={h_dim - fHeight} width={fWidth} height={fHeight} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={fWidth/2} y={h_dim - fHeight/2 + 4} fill={st.textColor} fontSize="11" fontWeight="bold" textAnchor="middle">{zn}</text>
                                        
                                        <rect x={w - fWidth} y={h_dim - fHeight} width={fWidth} height={fHeight} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={w - fWidth/2} y={h_dim - fHeight/2 + 4} fill={st.textColor} fontSize="11" fontWeight="bold" textAnchor="middle">{zn}</text>
                                    </g>
                                );
                            })}

                            {/* Vùng G (Giữa mép hồi đón gió) */}
                            {['G'].map(zn => {
                                const z = getZoneData('Mái', zn) || getZoneData('Roof', zn);
                                if(!z) return null;
                                const val = getVal(z);
                                const isSel = selectedZone?.zone === zn;
                                const st = getZoneStyle(val, isSel, hoverZone?.zone === zn);
                                const fWidth = Math.min(e_scaled/4, w/3);
                                const fHeight = Math.min(e_scaled/10, h_dim/4);
                                return (
                                    <g key={zn} onClick={() => handleZoneClick(z)} onMouseEnter={()=>setHoverZone(z)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                        <title>{`Vùng ${zn}: ${val.toFixed(2)}`}</title>
                                        <rect x={fWidth} y={h_dim - fHeight} width={w - 2*fWidth} height={fHeight} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={w/2} y={h_dim - fHeight/2 + 4} fill={st.textColor} fontSize="12" fontWeight="bold" textAnchor="middle">{zn} ({val.toFixed(2)})</text>
                                    </g>
                                );
                            })}

                            {/* Vùng H (Dải giữa) */}
                            {['H'].map(zn => {
                                const z = getZoneData('Mái', zn) || getZoneData('Roof', zn);
                                if(!z) return null;
                                const val = getVal(z);
                                const isSel = selectedZone?.zone === zn;
                                const st = getZoneStyle(val, isSel, hoverZone?.zone === zn);
                                const fHeight = Math.min(e_scaled/10, h_dim/4);
                                const hEnd = Math.min(e_scaled/2, h_dim * 0.7);
                                const hHeight = Math.max(0, hEnd - fHeight);
                                return (
                                    <g key={zn} onClick={() => handleZoneClick(z)} onMouseEnter={()=>setHoverZone(z)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                        <title>{`Vùng ${zn}: ${val.toFixed(2)}`}</title>
                                        <rect x="0" y={h_dim - hEnd} width={w} height={hHeight} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={w/2} y={h_dim - hEnd + hHeight/2 + 4} fill={st.textColor} fontSize="13" fontWeight="bold" textAnchor="middle">{zn} ({val.toFixed(2)})</text>
                                    </g>
                                );
                            })}

                            {/* Vùng I (Phần còn lại) */}
                            {['I'].map(zn => {
                                const z = getZoneData('Mái', zn) || getZoneData('Roof', zn);
                                if(!z) return null;
                                const val = getVal(z);
                                const isSel = selectedZone?.zone === zn;
                                const st = getZoneStyle(val, isSel, hoverZone?.zone === zn);
                                const hEnd = Math.min(e_scaled/2, h_dim * 0.7);
                                const iHeight = Math.max(0, h_dim - hEnd);
                                return (
                                    <g key={zn} onClick={() => handleZoneClick(z)} onMouseEnter={()=>setHoverZone(z)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                        <title>{`Vùng ${zn}: ${val.toFixed(2)}`}</title>
                                        <rect x="0" y="0" width={w} height={iHeight} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={w/2} y={iHeight/2 + 4} fill={st.textColor} fontSize="13" fontWeight="bold" textAnchor="middle">{zn} ({val.toFixed(2)})</text>
                                    </g>
                                );
                            })}
                        </>
                    )}
                </g>

                {/* Dimensions for plan */}
                {renderDimension(cx - w/2, cy + h_dim/2, cx + w/2, cy + h_dim/2, `b = ${b_dim.toFixed(1)} m`, 30)}
                {renderDimension(cx + w/2, cy - h_dim/2, cx + w/2, cy + h_dim/2, `d = ${d_dim.toFixed(1)} m`, 30, true)}
            </g>
        );
    };

    const renderWallPlan = () => {
        const cx = 400, cy = 250;
        const b_dim = Math.max(Number(b) || 72, 5);
        const d_dim = Math.max(Number(d) || 25, 5);
        const maxW = 660;
        const maxH = 340;
        const scale = Math.min(maxW / b_dim, maxH / d_dim);
        const w = b_dim * scale;
        const h_dim = d_dim * scale;
        const wallT = 16;
        
        const aLen = Math.min(e / 5, d_dim) * scale;
        const bLen = Math.max(0, Math.min(e, d_dim) * scale - aLen);
        const cLen = Math.max(0, h_dim - (aLen + bLen));

        const zD = getZoneData('Tường', 'D') || getZoneData('Wall', 'D');
        const zE = getZoneData('Tường', 'E') || getZoneData('Wall', 'E');
        const zA = getZoneData('Tường', 'A') || getZoneData('Wall', 'A');
        const zB = getZoneData('Tường', 'B') || getZoneData('Wall', 'B');
        const zC = getZoneData('Tường', 'C') || getZoneData('Wall', 'C');

        return (
            <g>
                <text x="400" y="35" fill="#e2e8f0" fontSize="15" fontWeight="bold" textAnchor="middle">
                    SƠ ĐỒ PHÂN VÙNG TƯỜNG THEO TCVN 2737:2023 (MẶT BẰNG)
                </text>
                {renderNorthArrow(730, 50)}

                {/* Wind direction indicator */}
                <g transform={`translate(${cx}, ${cy + h_dim/2 + 55})`}>
                    <line x1="0" y1="30" x2="0" y2="0" stroke="#10b981" strokeWidth="4" markerEnd="url(#wind-main-arrow)" />
                    <text x="0" y="44" fill="#10b981" fontSize="12" fontWeight="bold" textAnchor="middle">HƯỚNG GIÓ {selectedDir}</text>
                </g>

                <g transform={`translate(${cx - w/2}, ${cy - h_dim/2})`}>
                    {/* Building floor interior */}
                    <rect x="0" y="0" width={w} height={h_dim} fill="#0b1329" stroke="#334155" strokeWidth="1" />
                    <text x={w/2} y={h_dim/2} fill="#475569" fontSize="12" fontStyle="italic" textAnchor="middle">Mặt bằng sàn nhà</text>

                    {/* Windward Wall: Zone D (Bottom) */}
                    {zD && (() => {
                        const val = getVal(zD);
                        const st = getZoneStyle(val, selectedZone?.zone === 'D', hoverZone?.zone === 'D');
                        return (
                            <g onClick={() => handleZoneClick(zD)} onMouseEnter={()=>setHoverZone(zD)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                <title>{`Vùng D (Tường đón gió): ${val.toFixed(2)}`}</title>
                                <rect x="0" y={h_dim - wallT} width={w} height={wallT} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                <text x={w/2} y={h_dim - wallT/2 + 4} fill={st.textColor} fontSize="12" fontWeight="bold" textAnchor="middle">VÙNG D ({val.toFixed(2)})</text>
                            </g>
                        );
                    })()}

                    {/* Leeward Wall: Zone E (Top) */}
                    {zE && (() => {
                        const val = getVal(zE);
                        const st = getZoneStyle(val, selectedZone?.zone === 'E', hoverZone?.zone === 'E');
                        return (
                            <g onClick={() => handleZoneClick(zE)} onMouseEnter={()=>setHoverZone(zE)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                <title>{`Vùng E (Tường khuất gió): ${val.toFixed(2)}`}</title>
                                <rect x="0" y="0" width={w} height={wallT} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                <text x={w/2} y={wallT/2 + 4} fill={st.textColor} fontSize="12" fontWeight="bold" textAnchor="middle">VÙNG E ({val.toFixed(2)})</text>
                            </g>
                        );
                    })()}

                    {/* Left Side Wall Zones A, B, C */}
                    {zA && (() => {
                        const val = getVal(zA);
                        const st = getZoneStyle(val, selectedZone?.zone === 'A', hoverZone?.zone === 'A');
                        return (
                            <g onClick={() => handleZoneClick(zA)} onMouseEnter={()=>setHoverZone(zA)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                <title>{`Vùng A (Tường bên): ${val.toFixed(2)}`}</title>
                                <rect x="0" y={h_dim - wallT - aLen} width={wallT} height={aLen} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                <text x={wallT + 8} y={h_dim - wallT - aLen/2 + 4} fill={st.textColor} fontSize="10" fontWeight="bold">A</text>
                            </g>
                        );
                    })()}

                    {zB && bLen > 0 && (() => {
                        const val = getVal(zB);
                        const st = getZoneStyle(val, selectedZone?.zone === 'B', hoverZone?.zone === 'B');
                        return (
                            <g onClick={() => handleZoneClick(zB)} onMouseEnter={()=>setHoverZone(zB)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                <title>{`Vùng B (Tường bên): ${val.toFixed(2)}`}</title>
                                <rect x="0" y={h_dim - wallT - aLen - bLen} width={wallT} height={bLen} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                <text x={wallT + 8} y={h_dim - wallT - aLen - bLen/2 + 4} fill={st.textColor} fontSize="10" fontWeight="bold">B</text>
                            </g>
                        );
                    })()}

                    {zC && cLen > 0 && (() => {
                        const val = getVal(zC);
                        const st = getZoneStyle(val, selectedZone?.zone === 'C', hoverZone?.zone === 'C');
                        return (
                            <g onClick={() => handleZoneClick(zC)} onMouseEnter={()=>setHoverZone(zC)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                <title>{`Vùng C (Tường bên): ${val.toFixed(2)}`}</title>
                                <rect x="0" y={wallT} width={wallT} height={cLen} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                <text x={wallT + 8} y={wallT + cLen/2 + 4} fill={st.textColor} fontSize="10" fontWeight="bold">C</text>
                            </g>
                        );
                    })()}

                    {/* Right Side Wall Zones A, B, C */}
                    {zA && (() => {
                        const val = getVal(zA);
                        const st = getZoneStyle(val, selectedZone?.zone === 'A', hoverZone?.zone === 'A');
                        return (
                            <g onClick={() => handleZoneClick(zA)} onMouseEnter={()=>setHoverZone(zA)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                <rect x={w - wallT} y={h_dim - wallT - aLen} width={wallT} height={aLen} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                <text x={w - wallT - 8} y={h_dim - wallT - aLen/2 + 4} fill={st.textColor} fontSize="10" fontWeight="bold" textAnchor="end">A</text>
                            </g>
                        );
                    })()}

                    {zB && bLen > 0 && (() => {
                        const val = getVal(zB);
                        const st = getZoneStyle(val, selectedZone?.zone === 'B', hoverZone?.zone === 'B');
                        return (
                            <g onClick={() => handleZoneClick(zB)} onMouseEnter={()=>setHoverZone(zB)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                <rect x={w - wallT} y={h_dim - wallT - aLen - bLen} width={wallT} height={bLen} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                <text x={w - wallT - 8} y={h_dim - wallT - aLen - bLen/2 + 4} fill={st.textColor} fontSize="10" fontWeight="bold" textAnchor="end">B</text>
                            </g>
                        );
                    })()}

                    {zC && cLen > 0 && (() => {
                        const val = getVal(zC);
                        const st = getZoneStyle(val, selectedZone?.zone === 'C', hoverZone?.zone === 'C');
                        return (
                            <g onClick={() => handleZoneClick(zC)} onMouseEnter={()=>setHoverZone(zC)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                <rect x={w - wallT} y={wallT} width={wallT} height={cLen} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                <text x={w - wallT - 8} y={wallT + cLen/2 + 4} fill={st.textColor} fontSize="10" fontWeight="bold" textAnchor="end">C</text>
                            </g>
                        );
                    })()}
                </g>

                {/* Dimensions */}
                {renderDimension(cx - w/2, cy + h_dim/2, cx + w/2, cy + h_dim/2, `b = ${b_dim.toFixed(1)} m`, 30)}
                {renderDimension(cx + w/2, cy - h_dim/2, cx + w/2, cy + h_dim/2, `d = ${d_dim.toFixed(1)} m`, 30, true)}
            </g>
        );
    };

    const downloadWindSVG = () => {
        const svgEl = document.querySelector('.wind-svg-card svg');
        if (!svgEl) return;
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `so_do_gio_${selectedDir}_${viewMode}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="wind-svg-card bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-2xl text-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-slate-700">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.7 7.7A7.1 7.1 0 0 0 5 10.8A7.3 7.3 0 0 0 12 18h8a4 4 0 0 0 0-8c-.3 0-.7 0-1 .1"/>
                            <path d="M8 15l-4-4 4-4"/>
                        </svg>
                        PHÂN VÙNG ÁP LỰC GIÓ THEO TCVN 2737:2023
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex gap-3">
                        <span>L = {L}m</span>
                        <span>B = {B}m</span>
                        <span>H_col = {H_col}m</span>
                        <span>α = {alpha}°</span>
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <button 
                            onClick={downloadWindSVG}
                            className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 transition-all"
                            title="Tải tệp vector sơ đồ gió"
                        >
                            <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            <span>Xuất SVG</span>
                        </button>
                        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                            <button onClick={() => setViewMode('cross_section')} className={`px-3 py-1 text-xs rounded transition-all ${viewMode === 'cross_section' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:text-white'}`}>Mặt cắt ngang</button>
                            <button onClick={() => setViewMode('roof_plan')} className={`px-3 py-1 text-xs rounded transition-all ${viewMode === 'roof_plan' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:text-white'}`}>Sơ đồ vùng mái</button>
                            <button onClick={() => setViewMode('wall_plan')} className={`px-3 py-1 text-xs rounded transition-all ${viewMode === 'wall_plan' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:text-white'}`}>Sơ đồ vùng tường</button>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                            {['+X', '-X', '+Y', '-Y'].map(dir => (
                                <button key={dir} onClick={() => { setSelectedDir(dir); setSelectedZone(null); }} className={`px-2 py-1 text-xs rounded transition-all ${selectedDir === dir ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}>Gió {dir.replace(/[+-]/g, '')}° {dir}</button>
                            ))}
                        </div>
                        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                            <button onClick={() => setCoeffMode('net')} className={`px-2 py-1 text-xs rounded ${coeffMode === 'net' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}>c_net</button>
                            <button onClick={() => setCoeffMode('ce')} className={`px-2 py-1 text-xs rounded ${coeffMode === 'ce' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}>c_e</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col justify-between" style={{ minHeight: '420px' }}>
                    <div className="flex-1 flex justify-center items-center p-2">
                        <svg width="100%" height="100%" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="max-w-full">
                            {drawDefs()}
                            <rect width="100%" height="100%" fill="url(#grid)" />

                            {viewMode === 'cross_section' && renderCrossSection()}
                            {viewMode === 'roof_plan' && renderRoofPlan()}
                            {viewMode === 'wall_plan' && renderWallPlan()}
                        </svg>
                    </div>

                    {/* Integrated Horizontal Legend Bar */}
                    <div className="flex flex-wrap items-center justify-center gap-6 py-2.5 px-4 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-1.5 bg-red-500 block rounded-full"></span>
                            <span>Áp lực dương (+) (Đẩy)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-1.5 bg-blue-500 block rounded-full"></span>
                            <span>Áp lực âm (-) (Hút)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold text-sm leading-none">→</span>
                            <span>Hướng gió</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 border border-amber-400 rounded-sm" style={{background: 'url(#hatch-sel)'}}></span>
                            <span>Vùng đang chọn</span>
                        </div>
                        <div className="text-[11px] text-slate-400 italic">
                            * Nhấp vào vùng để xem chi tiết
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg flex flex-col">
                    <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2 border-b border-slate-700 pb-2">
                        <svg className="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 16v-4"/>
                            <path d="M12 8h.01"/>
                        </svg>
                        CHI TIẾT TÍNH TOÁN
                    </h4>
                    
                    {selectedZone ? (
                        <div className="space-y-4 text-sm flex-1">
                            <div className="bg-slate-900 p-3 rounded-lg border border-primary/30">
                                <div className="text-slate-400 text-xs">Vùng chọn:</div>
                                <div className="text-xl font-bold text-white">
                                    Vùng {selectedZone.zone} <span className="text-sm font-normal text-slate-400">({selectedZone.surface})</span>
                                </div>
                            </div>
                            
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1 font-mono">
                                <div className="font-bold text-slate-200 mb-2 border-b border-slate-700 pb-1 text-sm font-sans">Công thức TCVN 2737:2023</div>
                                <div>We = W₀ × k(z_e) × c_e × Gf</div>
                                <div>Wi = W₀ × k(z_e) × c_i × Gf</div>
                                <div>W_net = We - Wi</div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                    <div className="text-[10px] text-slate-400">k(z_e)</div>
                                    <div className="font-mono text-white">{selectedZone.kz?.toFixed(3) || '-'}</div>
                                </div>
                                <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                    <div className="text-[10px] text-slate-400">G_f</div>
                                    <div className="font-mono text-white">{selectedZone.Gf?.toFixed(3) || currentCase.Gf || '-'}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                    <div className="text-[10px] text-slate-400">c_e</div>
                                    <div className={`font-mono font-bold ${(selectedZone.ce || 0) > 0 ? 'text-red-400' : 'text-blue-400'}`}>{selectedZone.ce !== undefined ? selectedZone.ce : '-'}</div>
                                </div>
                                <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                    <div className="text-[10px] text-slate-400">c_i</div>
                                    <div className="font-mono text-purple-400 font-bold">{selectedZone.ci || currentCase.ci || 0}</div>
                                </div>
                                <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                    <div className="text-[10px] text-slate-400">c_net</div>
                                    <div className={`font-mono font-bold ${getVal(selectedZone) > 0 ? 'text-red-400' : 'text-blue-400'}`}>{getVal(selectedZone).toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-300 text-xs">Áp lực tiêu chuẩn (W_e):</span>
                                    <span className="font-mono font-bold text-white">{selectedZone.pressure_k?.toFixed(2) || 0} kN/m²</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-300 text-xs">Áp lực tính toán (W_d):</span>
                                    <span className="font-mono font-bold text-amber-400">{selectedZone.pressure_d?.toFixed(2) || 0} kN/m²</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 text-sm py-10 flex-1 flex flex-col items-center justify-center">
                            <svg className="w-8 h-8 mb-2 opacity-50 mx-auto text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m9 9 5 12 1.8-5.2L21 14Z"/>
                                <path d="M7.2 2.2 8 5.1"/>
                                <path d="m5.1 8-2.9-.8"/>
                                <path d="M14 4.1 12 6"/>
                                <path d="m6 12-1.9 2"/>
                            </svg>
                            <p>Nhấp vào một vùng trên sơ đồ<br/>để xem chi tiết tải trọng</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

window.WindSvg = WindSvg;
