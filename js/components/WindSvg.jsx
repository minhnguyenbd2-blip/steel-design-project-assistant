const WindSvg = ({ geom, loadCases }) => {
    const [selectedDir, setSelectedDir] = React.useState('+X');
    const [selectedZone, setSelectedZone] = React.useState(null);

    if (!geom || !loadCases) return <div className="p-4 bg-slate-800 text-white rounded">No wind data</div>;

    const caseData = loadCases[selectedDir];
    if (!caseData) return null;

    const { b: B, d: L, H_col: H, roofRise } = geom;
    
    // Determine wind angle (0 for X, 90 for Y)
    const isX = selectedDir === '+X' || selectedDir === '-X';
    const isPos = selectedDir === '+X' || selectedDir === '+Y';

    // SVG parameters
    const svgW = 800;
    const svgH = 500;
    
    // Plan view mapping (Left side)
    const planX = 50;
    const planY = 100;
    const planW = 300;
    const planH = 200;
    
    // Elevation view mapping (Right side)
    const elX = 450;
    const elY = 150;
    const elW = 250;
    const elH = 150;
    const elRoofH = 50;

    const handleZoneClick = (z) => {
        setSelectedZone(z === selectedZone ? null : z);
    };

    // Helper to get color based on pressure
    const getZoneColor = (pressure) => {
        if (pressure > 0) return 'rgba(239, 68, 68, 0.4)'; // Red for pressure
        return 'rgba(59, 130, 246, 0.4)'; // Blue for suction
    };

    const getStrokeColor = (pressure) => {
        if (pressure > 0) return '#ef4444';
        return '#3b82f6';
    };

    const drawZone = (z, x, y, w, h, labelX, labelY) => {
        const isSelected = selectedZone && selectedZone.surface === z.surface && selectedZone.zone === z.zone;
        return (
            <g key={`${z.surface}-${z.zone}`} onClick={() => handleZoneClick(z)} className="cursor-pointer transition-all hover:opacity-80">
                <rect x={x} y={y} width={w} height={h} fill={getZoneColor(z.pressure)} stroke={isSelected ? '#fff' : getStrokeColor(z.pressure)} strokeWidth={isSelected ? 3 : 1} />
                <text x={labelX} y={labelY} fill="#fff" fontSize="12" textAnchor="middle" dominantBaseline="middle" className="font-bold pointer-events-none">
                    {z.zone} ({z.pressure.toFixed(2)})
                </text>
            </g>
        );
    };

    const renderPlan = () => {
        // Plan view represents the roof and walls
        // For simplicity, we draw the roof zones based on standard layout
        const zones = [];
        
        // Outline
        zones.push(<rect key="plan-outline" x={planX} y={planY} width={planW} height={planH} fill="none" stroke="#64748b" strokeWidth="2" />);
        zones.push(<path key="ridge" d={`M ${planX},${planY + planH/2} L ${planX + planW},${planY + planH/2}`} stroke="#94a3b8" strokeDasharray="5,5" />);
        
        // We will approximate zone positions based on the code in wind_load.js
        const e = isX ? Math.min(B, 2*geom.h) : Math.min(L, 2*geom.h);
        
        // Find zones
        const findZ = (s, z) => caseData.surfaces.find(zone => zone.surface === s && zone.zone === z);
        
        if (isX) {
            // Wind along X axis. Windward is D, leeward is E
            const d = findZ('Wall', 'D');
            const eWall = findZ('Wall', 'E');
            if(d) zones.push(drawZone(d, planX - 10, planY, 10, planH, planX - 5, planY + planH/2)); // Left wall
            if(eWall) zones.push(drawZone(eWall, planX + planW, planY, 10, planH, planX + planW + 5, planY + planH/2)); // Right wall
            
            // Side walls A, B, C
            const a = findZ('Wall', 'A');
            const bWall = findZ('Wall', 'B');
            const c = findZ('Wall', 'C');
            if (a) {
                const aw = planW * (a.width / L);
                zones.push(drawZone(a, planX, planY - 10, aw, 10, planX + aw/2, planY - 5)); // Top
                zones.push(drawZone(a, planX, planY + planH, aw, 10, planX + aw/2, planY + planH + 5)); // Bottom
            }
            if (bWall) {
                const bw = planW * (bWall.width / L);
                const aw = a ? planW * (a.width / L) : 0;
                zones.push(drawZone(bWall, planX + aw, planY - 10, bw, 10, planX + aw + bw/2, planY - 5));
                zones.push(drawZone(bWall, planX + aw, planY + planH, bw, 10, planX + aw + bw/2, planY + planH + 5));
            }
            if (c) {
                const cw = planW * (c.width / L);
                const prev = (a ? a.width : 0) + (bWall ? bWall.width : 0);
                const prevW = planW * (prev / L);
                zones.push(drawZone(c, planX + prevW, planY - 10, cw, 10, planX + prevW + cw/2, planY - 5));
                zones.push(drawZone(c, planX + prevW, planY + planH, cw, 10, planX + prevW + cw/2, planY + planH + 5));
            }

            // Roof F, G, H, I, J
            ['F', 'G', 'H', 'I', 'J'].forEach(zName => {
                const z = findZ('Roof', zName);
                if (z) {
                    // map layout
                    let zx = planX, zy = planY, zw = 0, zh = 0;
                    if (zName === 'F') { zx = planX; zy = planY; zw = planW * (z.length/L); zh = planH * (z.width/B); }
                    if (zName === 'G') { zx = planX; zy = planY + planH * (geom.e_X/4/B); zw = planW * (z.length/L); zh = planH * (z.width/B); }
                    if (zName === 'H') { zx = planX + planW * (e/10/L); zy = planY; zw = planW * (z.length/L); zh = planH; }
                    if (zName === 'I') { zx = planX + planW/2; zy = planY; zw = planW * (z.length/L); zh = planH; }
                    if (zName === 'J') { zx = planX + planW/2 + planW*(e/10/L); zy = planY; zw = planW * (z.length/L); zh = planH; }
                    
                    zones.push(drawZone(z, zx, zy, zw, zh, zx + zw/2, zy + zh/2));
                }
            });
        }
        
        // Wind arrows
        const arrowX = isPos ? planX - 50 : planX + planW + 50;
        const arrowDir = isPos ? 1 : -1;
        zones.push(
            <g key="wind-arrow-plan" stroke="#10b981" fill="#10b981">
                <path d={`M ${arrowX},${planY + planH/2} L ${arrowX + arrowDir*30},${planY + planH/2}`} strokeWidth="3" markerEnd="url(#windhead)" />
                <text x={arrowX + arrowDir*15} y={planY + planH/2 - 10} textAnchor="middle" className="font-bold">WIND {selectedDir}</text>
            </g>
        );

        return zones;
    };

    const renderElevation = () => {
        const zones = [];
        
        // Frame
        zones.push(
            <path key="frame" d={`M ${elX},${elY + elH} L ${elX},${elY} L ${elX + elW/2},${elY - elRoofH} L ${elX + elW},${elY} L ${elX + elW},${elY + elH}`} fill="none" stroke="#64748b" strokeWidth="3" />
        );
        zones.push(<line key="ground" x1={elX - 30} y1={elY + elH} x2={elX + elW + 30} y2={elY + elH} stroke="#475569" strokeWidth="4" />);

        // Dimensions
        zones.push(<text x={elX + elW/2} y={elY + elH + 20} fill="#94a3b8" fontSize="12" textAnchor="middle">B = {B}m</text>);
        zones.push(<text x={elX - 30} y={elY + elH/2} fill="#94a3b8" fontSize="12" textAnchor="middle" transform={`rotate(-90, ${elX - 30}, ${elY + elH/2})`}>H = {H}m</text>);

        const findZ = (s, z) => caseData.surfaces.find(zone => zone.surface === s && zone.zone === z);
        
        if (isX) {
            const d = findZ('Wall', 'D');
            const e = findZ('Wall', 'E');
            if (d) {
                const dir = d.pressure > 0 ? 1 : -1;
                zones.push(<path key="arr-d" d={`M ${elX - 40},${elY + elH/2} L ${elX - 10},${elY + elH/2}`} stroke={getStrokeColor(d.pressure)} strokeWidth="2" markerEnd="url(#arrow)" />);
                zones.push(<text key="txt-d" x={elX - 25} y={elY + elH/2 - 10} fill={getStrokeColor(d.pressure)} fontSize="12" textAnchor="middle">D</text>);
            }
            if (e) {
                const dir = e.pressure > 0 ? 1 : -1;
                zones.push(<path key="arr-e" d={`M ${elX + elW + 10},${elY + elH/2} L ${elX + elW + 40},${elY + elH/2}`} stroke={getStrokeColor(e.pressure)} strokeWidth="2" markerEnd="url(#arrow)" />);
                zones.push(<text key="txt-e" x={elX + elW + 25} y={elY + elH/2 - 10} fill={getStrokeColor(e.pressure)} fontSize="12" textAnchor="middle">E</text>);
            }
        }

        return zones;
    };

    return (
        <div className="wind-svg-container bg-slate-900 rounded-lg p-4 border border-slate-700 shadow-lg mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><i data-lucide="monitor" className="w-5 h-5 text-primary"></i> CAD Visualization</h3>
                <div className="flex gap-2 bg-slate-800 p-1 rounded">
                    {['+X', '-X', '+Y', '-Y'].map(dir => (
                        <button 
                            key={dir} 
                            onClick={() => setSelectedDir(dir)}
                            className={`px-4 py-1.5 rounded text-sm font-bold transition-colors ${selectedDir === dir ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            {dir}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 overflow-x-auto">
                    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="bg-slate-950 rounded border border-slate-800 mx-auto" style={{minWidth: '600px'}}>
                        <defs>
                            <marker id="windhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                            </marker>
                            <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
                                <polygon points="0 0, 8 4, 0 8" fill="currentColor" />
                            </marker>
                        </defs>
                        
                        {/* Title text */}
                        <text x="50" y="40" fill="#94a3b8" fontSize="16" className="font-bold">PLAN VIEW</text>
                        <text x="450" y="40" fill="#94a3b8" fontSize="16" className="font-bold">ELEVATION VIEW</text>
                        
                        {renderPlan()}
                        {renderElevation()}
                        
                        {/* Legend */}
                        <g transform="translate(50, 450)">
                            <rect x="0" y="0" width="15" height="15" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" />
                            <text x="25" y="12" fill="#cbd5e1" fontSize="12">Pressure (+)</text>
                            <rect x="120" y="0" width="15" height="15" fill="rgba(59, 130, 246, 0.4)" stroke="#3b82f6" />
                            <text x="145" y="12" fill="#cbd5e1" fontSize="12">Suction (-)</text>
                            <text x="250" y="12" fill="#94a3b8" fontSize="12 italic">Click zones for details</text>
                        </g>
                    </svg>
                </div>
                
                {/* Details Panel */}
                <div className="w-full lg:w-64 bg-slate-800 rounded p-4 border border-slate-700 h-full">
                    <h4 className="font-bold text-white mb-2 border-b border-slate-600 pb-2">Zone Details</h4>
                    {selectedZone ? (
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-slate-400">Surface:</span> <span className="font-bold text-white">{selectedZone.surface}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Zone:</span> <span className="font-bold text-white">{selectedZone.zone}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Area:</span> <span className="font-mono text-white">{selectedZone.area?.toFixed(2) || '-'} m²</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">ze:</span> <span className="font-mono text-white">{selectedZone.ze?.toFixed(2)} m</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">kz:</span> <span className="font-mono text-white">{selectedZone.kz?.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">ce:</span> <span className="font-mono text-white">{selectedZone.ce?.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">W0:</span> <span className="font-mono text-white">{selectedZone.W0?.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Gf:</span> <span className="font-mono text-white">{selectedZone.Gf?.toFixed(2)}</span></div>
                            <div className="pt-2 border-t border-slate-700 mt-2">
                                <div className="text-slate-400 mb-1">Pressure:</div>
                                <div className={`text-xl font-bold ${selectedZone.pressure > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                    {selectedZone.pressure?.toFixed(3)} kN/m²
                                </div>
                            </div>
                            <div className="pt-2">
                                <div className="text-slate-400 mb-1">Frame Line Load:</div>
                                <div className="text-lg font-bold text-green-400">
                                    {(selectedZone.frameLineLoad || 0).toFixed(3)} kN/m
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Trib. Width: {selectedZone.tributaryWidth?.toFixed(2)}m</div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm italic">Select a zone on the CAD visualization to view calculation details.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

window.WindSvg = WindSvg;
