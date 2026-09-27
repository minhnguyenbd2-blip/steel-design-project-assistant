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
                <i data-lucide="wind" className="w-8 h-8 text-primary mx-auto mb-2 animate-bounce"></i>
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
    
    // Dimensions
    const b = isTheta0 ? B : L;
    const d = isTheta0 ? L : B;
    const h = H_col;
    const e = Math.min(b, 2 * h);

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
        return coeffMode === 'ci' ? zone.ci : (coeffMode === 'ce' ? zone.ce : (zone.c_net || (zone.ce - (currentCase.ci || 0))));
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
                <line x1={x1} y1={y1} x2={x1+dx} y2={y1+dy} stroke="#64748b" strokeWidth="1" strokeDasharray="2,2"/>
                <line x2={x2} y2={y2} x2={x2+dx} y2={y2+dy} stroke="#64748b" strokeWidth="1" strokeDasharray="2,2"/>
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
        const cx = 400, cy = 350;
        const scale = 200 / L;
        const w = L * scale;
        const hCol = H_col * scale;
        const hRf = (H_rf - H_col) * scale;
        
        const pLL = {x: cx - w/2, y: cy};
        const pLR = {x: cx + w/2, y: cy};
        const pTL = {x: cx - w/2, y: cy - hCol};
        const pTR = {x: cx + w/2, y: cy - hCol};
        const pApex = {x: cx, y: cy - hCol - hRf};

        const roofAngleDeg = alpha;
        
        const isLeftToRight = selectedDir === '+X' || selectedDir === '+Y';
        const windX = isLeftToRight ? cx - w/2 - 120 : cx + w/2 + 120;
        const windDir = isLeftToRight ? 1 : -1;

        return (
            <g>
                <text x="400" y="40" fill="#e2e8f0" fontSize="16" fontWeight="bold" textAnchor="middle">MẶT CẮT NGANG CÔNG TRÌNH</text>
                
                <g transform={`translate(${windX}, ${cy - hCol/2})`}>
                    <line x1="0" y1="0" x2={windDir * 60} y2="0" stroke="#10b981" strokeWidth="4" markerEnd="url(#wind-main-arrow)" />
                    <text x={windDir * 30} y="-10" fill="#10b981" fontSize="12" fontWeight="bold" textAnchor="middle">GIÓ {selectedDir}</text>
                </g>

                <line x1="100" y1={cy} x2="700" y2={cy} stroke="#475569" strokeWidth="3" />
                <path d={`M ${pLL.x} ${pLL.y} L ${pTL.x} ${pTL.y} L ${pApex.x} ${pApex.y} L ${pTR.x} ${pTR.y} L ${pLR.x} ${pLR.y}`} fill="rgba(30,41,59,0.5)" stroke="#94a3b8" strokeWidth="3" />

                {/* Left Wall */}
                {(() => {
                    const zoneName = isLeftToRight ? 'D' : 'E';
                    const z = getZoneData('Tường', zoneName) || getZoneData('Wall', zoneName);
                    if(!z) return null;
                    const val = getVal(z);
                    const st = getZoneStyle(val, selectedZone?.zone === zoneName);
                    return (
                        <g onClick={() => handleZoneClick(z)} className="cursor-pointer group">
                            <title>{`Vùng ${zoneName} - c_e: ${z.ce}`}</title>
                            <rect x={pTL.x - 12} y={pTL.y} width="12" height={hCol} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth}/>
                            {renderPressureArrow(pTL.x - 6, cy - hCol/2, val, 0, getPressureVal(z), 30)}
                            <text x={pTL.x - 20} y={cy - hCol/2} fill={st.textColor} fontSize="14" fontWeight="bold">{zoneName}</text>
                        </g>
                    )
                })()}

                {/* Right Wall */}
                {(() => {
                    const zoneName = isLeftToRight ? 'E' : 'D';
                    const z = getZoneData('Tường', zoneName) || getZoneData('Wall', zoneName);
                    if(!z) return null;
                    const val = getVal(z);
                    const st = getZoneStyle(val, selectedZone?.zone === zoneName);
                    return (
                        <g onClick={() => handleZoneClick(z)} className="cursor-pointer group">
                            <title>{`Vùng ${zoneName} - c_e: ${z.ce}`}</title>
                            <rect x={pTR.x} y={pTR.y} width="12" height={hCol} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth}/>
                            {renderPressureArrow(pTR.x + 6, cy - hCol/2, val, 180, getPressureVal(z), 30)}
                            <text x={pTR.x + 20} y={cy - hCol/2} fill={st.textColor} fontSize="14" fontWeight="bold">{zoneName}</text>
                        </g>
                    )
                })()}

                {/* Left Roof */}
                {(() => {
                    const zG = getZoneData('Mái', 'G') || getZoneData('Roof', 'G') || getZoneData('Mái', 'H');
                    if(!zG) return null;
                    const val = getVal(zG);
                    const st = getZoneStyle(val, selectedZone?.zone === zG.zone);
                    const midX = (pTL.x + pApex.x)/2;
                    const midY = (pTL.y + pApex.y)/2;
                    return (
                        <g onClick={() => handleZoneClick(zG)} className="cursor-pointer group">
                            <title>{`Vùng ${zG.zone} - c_e: ${zG.ce}`}</title>
                            <path d={`M ${pTL.x} ${pTL.y} L ${pApex.x} ${pApex.y} L ${pApex.x} ${pApex.y-12} L ${pTL.x-5} ${pTL.y-12} Z`} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth}/>
                            {renderPressureArrow(midX, midY-6, val, 90 - roofAngleDeg, getPressureVal(zG), 30)}
                            <text x={midX} y={midY-25} fill={st.textColor} fontSize="14" fontWeight="bold" textAnchor="middle">{zG.zone}</text>
                        </g>
                    )
                })()}

                {/* Right Roof */}
                {(() => {
                    const zI = getZoneData('Mái', 'I') || getZoneData('Roof', 'I');
                    if(!zI) return null;
                    const val = getVal(zI);
                    const st = getZoneStyle(val, selectedZone?.zone === 'I');
                    const midX = (pTR.x + pApex.x)/2;
                    const midY = (pTR.y + pApex.y)/2;
                    return (
                        <g onClick={() => handleZoneClick(zI)} className="cursor-pointer group">
                            <title>{`Vùng ${zI.zone} - c_e: ${zI.ce}`}</title>
                            <path d={`M ${pApex.x} ${pApex.y} L ${pTR.x} ${pTR.y} L ${pTR.x+5} ${pTR.y-12} L ${pApex.x} ${pApex.y-12} Z`} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth}/>
                            {renderPressureArrow(midX, midY-6, val, 90 + roofAngleDeg, getPressureVal(zI), 30)}
                            <text x={midX} y={midY-25} fill={st.textColor} fontSize="14" fontWeight="bold" textAnchor="middle">{zI.zone}</text>
                        </g>
                    )
                })()}

                {renderDimension(pLL.x, cy, pLR.x, cy, `L = ${L}m`, 40)}
                {renderDimension(pLL.x, cy, pTL.x, pTL.y, `H_col = ${H_col}m`, -50, true)}
                {renderDimension(pApex.x, cy, pApex.x, pApex.y, `H_roof = ${H_rf}m`, 50, true)}

                <path d={`M ${pTL.x + 40} ${pTL.y} A 40 40 0 0 0 ${pTL.x + 35} ${pTL.y - 15}`} fill="none" stroke="#94a3b8" strokeWidth="1" />
                <text x={pTL.x + 50} y={pTL.y - 10} fill="#cbd5e1" fontSize="10">α={alpha}°</text>
            </g>
        );
    };

    const renderRoofPlan = () => {
        const cx = 400, cy = 250;
        const scale = 300 / Math.max(L, B);
        const w = b * scale;
        const h_dim = d * scale;
        const e_scaled = e * scale;
        
        return (
            <g>
                <text x="400" y="40" fill="#e2e8f0" fontSize="16" fontWeight="bold" textAnchor="middle">SƠ ĐỒ PHÂN VÙNG MÁI</text>
                {renderNorthArrow(700, 60)}
                
                <g transform={`translate(400, ${cy + h_dim/2 + 60})`}>
                    <line x1="0" y1="30" x2="0" y2="0" stroke="#10b981" strokeWidth="4" markerEnd="url(#wind-main-arrow)" />
                    <text x="0" y="45" fill="#10b981" fontSize="12" fontWeight="bold" textAnchor="middle">GIÓ {selectedDir}</text>
                </g>

                <g transform={`translate(${cx - w/2}, ${cy - h_dim/2})`}>
                    <rect x="0" y="0" width={w} height={h_dim} fill="#0f172a" stroke="#64748b" strokeWidth="2" />
                    
                    {isTheta0 ? (
                        <line x1="0" y1={h_dim/2} x2={w} y2={h_dim/2} stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,3" />
                    ) : (
                        <line x1={w/2} y1="0" x2={w/2} y2={h_dim} stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,3" />
                    )}

                    {isTheta0 && (
                        <>
                            {['F'].map(zn => {
                                const z = getZoneData('Mái', zn) || getZoneData('Roof', zn);
                                if(!z) return null;
                                const val = getVal(z);
                                const st = getZoneStyle(val, selectedZone?.zone === zn, hoverZone?.zone === zn);
                                return (
                                    <g key={zn} onClick={() => handleZoneClick(z)} onMouseEnter={()=>setHoverZone(z)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                        <title>{`Vùng ${zn}: ${val.toFixed(2)}`}</title>
                                        <rect x="0" y={h_dim - e_scaled/10} width={e_scaled/4} height={e_scaled/10} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={e_scaled/8} y={h_dim - e_scaled/20 + 4} fill={st.textColor} fontSize="12" fontWeight="bold" textAnchor="middle">{zn}</text>
                                        
                                        <rect x={w - e_scaled/4} y={h_dim - e_scaled/10} width={e_scaled/4} height={e_scaled/10} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={w - e_scaled/8} y={h_dim - e_scaled/20 + 4} fill={st.textColor} fontSize="12" fontWeight="bold" textAnchor="middle">{zn}</text>
                                    </g>
                                )
                            })}
                            
                            {['G'].map(zn => {
                                const z = getZoneData('Mái', zn) || getZoneData('Roof', zn);
                                if(!z) return null;
                                const val = getVal(z);
                                const st = getZoneStyle(val, selectedZone?.zone === zn, hoverZone?.zone === zn);
                                return (
                                    <g key={zn} onClick={() => handleZoneClick(z)} onMouseEnter={()=>setHoverZone(z)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                        <title>{`Vùng ${zn}: ${val.toFixed(2)}`}</title>
                                        <rect x={e_scaled/4} y={h_dim - e_scaled/10} width={w - e_scaled/2} height={e_scaled/10} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={w/2} y={h_dim - e_scaled/20 + 4} fill={st.textColor} fontSize="14" fontWeight="bold" textAnchor="middle">{zn} ({val})</text>
                                    </g>
                                )
                            })}

                            {['H'].map(zn => {
                                const z = getZoneData('Mái', zn) || getZoneData('Roof', zn);
                                if(!z) return null;
                                const val = getVal(z);
                                const st = getZoneStyle(val, selectedZone?.zone === zn, hoverZone?.zone === zn);
                                return (
                                    <g key={zn} onClick={() => handleZoneClick(z)} onMouseEnter={()=>setHoverZone(z)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                        <title>{`Vùng ${zn}: ${val.toFixed(2)}`}</title>
                                        <rect x="0" y={h_dim/2} width={w} height={h_dim/2 - e_scaled/10} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={w/2} y={h_dim/2 + (h_dim/2 - e_scaled/10)/2} fill={st.textColor} fontSize="14" fontWeight="bold" textAnchor="middle">{zn} ({val})</text>
                                    </g>
                                )
                            })}

                            {['J'].map(zn => {
                                const z = getZoneData('Mái', zn) || getZoneData('Roof', zn);
                                if(!z) return null;
                                const val = getVal(z);
                                const st = getZoneStyle(val, selectedZone?.zone === zn, hoverZone?.zone === zn);
                                return (
                                    <g key={zn} onClick={() => handleZoneClick(z)} onMouseEnter={()=>setHoverZone(z)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                        <title>{`Vùng ${zn}: ${val.toFixed(2)}`}</title>
                                        <rect x="0" y={h_dim/2 - e_scaled/10} width={w} height={e_scaled/10} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={w/2} y={h_dim/2 - e_scaled/20 + 4} fill={st.textColor} fontSize="14" fontWeight="bold" textAnchor="middle">{zn} ({val})</text>
                                    </g>
                                )
                            })}

                            {['I'].map(zn => {
                                const z = getZoneData('Mái', zn) || getZoneData('Roof', zn);
                                if(!z) return null;
                                const val = getVal(z);
                                const st = getZoneStyle(val, selectedZone?.zone === zn, hoverZone?.zone === zn);
                                return (
                                    <g key={zn} onClick={() => handleZoneClick(z)} onMouseEnter={()=>setHoverZone(z)} onMouseLeave={()=>setHoverZone(null)} className="cursor-pointer">
                                        <title>{`Vùng ${zn}: ${val.toFixed(2)}`}</title>
                                        <rect x="0" y="0" width={w} height={h_dim/2 - e_scaled/10} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} />
                                        <text x={w/2} y={(h_dim/2 - e_scaled/10)/2} fill={st.textColor} fontSize="14" fontWeight="bold" textAnchor="middle">{zn} ({val})</text>
                                    </g>
                                )
                            })}
                        </>
                    )}
                </g>
            </g>
        );
    };

    const renderWallPlan = () => {
        return (
            <g>
                <text x="400" y="40" fill="#e2e8f0" fontSize="16" fontWeight="bold" textAnchor="middle">SƠ ĐỒ PHÂN VÙNG TƯỜNG (MẶT BẰNG)</text>
                <text x="400" y="250" fill="#94a3b8" fontSize="14" fontStyle="italic" textAnchor="middle">Sử dụng Mặt cắt ngang hoặc xem bảng chi tiết</text>
            </g>
        );
    };

    return (
        <div className="wind-svg-card bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-2xl text-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-slate-700">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <i data-lucide="wind" className="w-5 h-5 text-primary"></i>
                        PHÂN VÙNG ÁP LỰC GIÓ
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex gap-3">
                        <span>L = {L}m</span>
                        <span>B = {B}m</span>
                        <span>H_col = {H_col}m</span>
                        <span>α = {alpha}°</span>
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <button onClick={() => setViewMode('cross_section')} className={`px-3 py-1 text-xs rounded transition-all ${viewMode === 'cross_section' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:text-white'}`}>Mặt cắt ngang</button>
                        <button onClick={() => setViewMode('roof_plan')} className={`px-3 py-1 text-xs rounded transition-all ${viewMode === 'roof_plan' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:text-white'}`}>Sơ đồ vùng mái</button>
                        <button onClick={() => setViewMode('wall_plan')} className={`px-3 py-1 text-xs rounded transition-all ${viewMode === 'wall_plan' ? 'bg-primary text-white font-bold' : 'text-slate-400 hover:text-white'}`}>Sơ đồ vùng tường</button>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                            {['+X', '-X', '+Y', '-Y'].map(dir => (
                                <button key={dir} onClick={() => { setSelectedDir(dir); setSelectedZone(null); }} className={`px-2 py-1 text-xs rounded transition-all ${selectedDir === dir ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}>Gió {dir.replace(/[+-]/g, '')}° {dir}</button>
                            ))}
                        </div>
                        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                            <button onClick={() => setCoeffMode('net')} className={`px-2 py-1 text-xs rounded ${coeffMode === 'net' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>c_net</button>
                            <button onClick={() => setCoeffMode('ce')} className={`px-2 py-1 text-xs rounded ${coeffMode === 'ce' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>c_e</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative flex justify-center items-center p-2" style={{ minHeight: '400px' }}>
                    <svg width="100%" height="100%" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="max-w-full">
                        {drawDefs()}
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {viewMode === 'cross_section' && renderCrossSection()}
                        {viewMode === 'roof_plan' && renderRoofPlan()}
                        {viewMode === 'wall_plan' && renderWallPlan()}
                    </svg>

                    <div className="absolute bottom-4 left-4 bg-slate-900/90 p-3 rounded-lg border border-slate-700 text-xs backdrop-blur-sm pointer-events-none">
                        <div className="font-bold mb-2 text-white border-b border-slate-700 pb-1">CHÚ GIẢI</div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-4 h-1 bg-red-500 block"></span>
                            <span className="text-slate-300">Áp lực dương (+) (Đẩy)</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-4 h-1 bg-blue-500 block"></span>
                            <span className="text-slate-300">Áp lực âm (-) (Hút)</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-emerald-500 font-bold">→</span>
                            <span className="text-slate-300">Hướng gió</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4" style={{background: 'url(#hatch-sel)'}}></span>
                            <span className="text-slate-300">Vùng đang chọn</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg flex flex-col">
                    <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2 border-b border-slate-700 pb-2">
                        <i data-lucide="info" className="w-4 h-4 text-primary"></i>
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
                                    <div className={`font-mono font-bold ${selectedZone.ce > 0 ? 'text-red-400' : 'text-blue-400'}`}>{selectedZone.ce}</div>
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
                            <i data-lucide="mouse-pointer-click" className="w-8 h-8 mb-2 opacity-50"></i>
                            <p>Nhấp vào một vùng trên sơ đồ<br/>để xem chi tiết tải trọng</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

window.WindSvg = WindSvg;
