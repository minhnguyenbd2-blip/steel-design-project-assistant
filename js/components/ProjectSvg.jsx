const { useState, useEffect, useMemo, useCallback } = React;

const ProjectSvg = ({ inputs = {}, results = {} }) => {
    const [activeTab, setActiveTab] = useState("cross_section");
    
    const L = Number(inputs.L) || 25;
    const B = Number(inputs.B) || 9;
    const length = Number(inputs.length) || 72;
    const H_col = Number(inputs.H_column) || 8.0;
    const H_rf = Number(inputs.H_roof) || 9.25;
    const purlinSpacing = Number(inputs.purlinSpacing) || 1.2;
    
    const numBays = Math.max(2, Math.round(length / B));
    const roofRise = Math.max(0.1, H_rf - H_col);
    const slopePercent = ((roofRise / (L / 2)) * 100).toFixed(1);
    const alphaRad = Math.atan(roofRise / (L / 2));
    const alphaDeg = ((alphaRad * 180) / Math.PI).toFixed(2);
    const halfSpan = (L / 2).toFixed(1);
    
    const colSec = results.selectedSections?.column || { h: 500, b: 250, tw: 8, tf: 12, r: 16 };
    const rafSec = results.selectedSections?.rafter || { h: 400, b: 200, tw: 6, tf: 10, r: 12 };

    const renderDefs = () => (
        <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
            </marker>
            <marker id="arrow-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
            </marker>
            <pattern id="concrete-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <path d="M 0 0 L 0 8" stroke="#94a3b8" strokeWidth="1" />
                <path d="M 2 2 L 3 2 M 6 6 L 7 6" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            </pattern>
            <pattern id="steel-hatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <path d="M 0 0 L 0 6" stroke="#60a5fa" strokeWidth="1" />
            </pattern>
            <pattern id="soil-hatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <path d="M 0 0 L 0 10" stroke="#334155" strokeWidth="0.5" />
            </pattern>
        </defs>
    );

    const renderCrossSection = () => {
        const scale = 25; // 1m = 25px
        const w = L * scale + 200;
        const h = H_rf * scale + 200;
        const groundY = h - 100;
        const xA = 100;
        const xB = xA + L * scale;
        const xMid = xA + (L * scale) / 2;
        const yEave = groundY - H_col * scale;
        const yPeak = groundY - H_rf * scale;
        
        const colW = (colSec.h / 1000) * scale * 2; // exaggerated slightly for visibility
        const rafH = (rafSec.h / 1000) * scale * 2;
        
        const cosA = Math.cos(alphaRad);
        const sinA = Math.sin(alphaRad);

        // Generate purlins
        const rafterLength = Math.sqrt(Math.pow(L/2, 2) + Math.pow(roofRise, 2));
        const numPurlins = Math.floor(rafterLength / purlinSpacing);
        const actualPurlinSpacing = rafterLength / numPurlins;
        
        const purlins = [];
        for(let i=0; i<=numPurlins; i++) {
            const dist = i * actualPurlinSpacing;
            const dx = (dist * cosA) * scale;
            const dy = (dist * sinA) * scale;
            purlins.push({
                xL: xA + dx, yL: yEave - dy,
                xR: xB - dx, yR: yEave - dy
            });
        }

        return (
            <svg width="100%" height="500" viewBox={`0 0 ${w} ${h}`} className="bg-slate-950 font-sans">
                {renderDefs()}
                
                {/* Ground Line */}
                <line x1="20" y1={groundY} x2={w-20} y2={groundY} stroke="#475569" strokeWidth="2" strokeDasharray="10,5" />
                <rect x="20" y={groundY} width={w-40} height="20" fill="url(#soil-hatch)" opacity="0.5" />
                <text x={w-40} y={groundY-10} fill="#94a3b8" fontSize="12">±0.000</text>

                {/* Grid Lines */}
                <line x1={xA} y1={yPeak-40} x2={xA} y2={groundY+60} stroke="#ef4444" strokeWidth="1" strokeDasharray="10,4,2,4" />
                <line x1={xB} y1={yPeak-40} x2={xB} y2={groundY+60} stroke="#ef4444" strokeWidth="1" strokeDasharray="10,4,2,4" />
                <line x1={xMid} y1={yPeak-40} x2={xMid} y2={groundY-20} stroke="#f59e0b" strokeWidth="1" strokeDasharray="5,3" />

                {/* Grid Bubbles */}
                <circle cx={xA} cy={groundY+60} r="14" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
                <text x={xA} y={groundY+65} fill="#f87171" fontSize="14" fontWeight="bold" textAnchor="middle">A</text>
                
                <circle cx={xB} cy={groundY+60} r="14" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
                <text x={xB} y={groundY+65} fill="#f87171" fontSize="14" fontWeight="bold" textAnchor="middle">B</text>
                
                <circle cx={xMid} cy={yPeak-40} r="10" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
                <text x={xMid} y={yPeak-36} fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">CL</text>

                {/* Foundations */}
                {[xA, xB].map((x, i) => (
                    <g key={`found-${i}`}>
                        <rect x={x-30} y={groundY} width="60" height="40" fill="url(#concrete-hatch)" stroke="#94a3b8" strokeWidth="1.5" />
                        <rect x={x-15} y={groundY-10} width="30" height="10" fill="url(#concrete-hatch)" stroke="#94a3b8" strokeWidth="1.5" />
                        {/* Anchor bolts */}
                        <line x1={x-10} y1={groundY-15} x2={x-10} y2={groundY} stroke="#38bdf8" strokeWidth="2" />
                        <line x1={x+10} y1={groundY-15} x2={x+10} y2={groundY} stroke="#38bdf8" strokeWidth="2" />
                        <rect x={x-20} y={groundY-10} width="40" height="4" fill="#64748b" /> {/* Base plate */}
                    </g>
                ))}

                {/* Columns (Realistic I-Section Profile simplified) */}
                {[xA, xB].map((x, i) => (
                    <g key={`col-${i}`}>
                        <rect x={x - colW/2} y={yEave} width={colW} height={groundY - 10 - yEave} fill="url(#steel-hatch)" stroke="#3b82f6" strokeWidth="2" />
                        <line x1={x} y1={yEave} x2={x} y2={groundY-10} stroke="#1d4ed8" strokeWidth="1" strokeDasharray="4,2" />
                    </g>
                ))}

                {/* Rafters */}
                <path d={`M ${xA} ${yEave} L ${xMid} ${yPeak} L ${xMid} ${yPeak+rafH} L ${xA} ${yEave+rafH} Z`} fill="url(#steel-hatch)" stroke="#3b82f6" strokeWidth="2" />
                <path d={`M ${xB} ${yEave} L ${xMid} ${yPeak} L ${xMid} ${yPeak+rafH} L ${xB} ${yEave+rafH} Z`} fill="url(#steel-hatch)" stroke="#3b82f6" strokeWidth="2" />
                
                {/* Haunch (Nách khung) */}
                <polygon points={`${xA},${yEave+rafH} ${xA+colW*2},${yEave+rafH - (colW*2)*Math.tan(alphaRad)} ${xA},${yEave+rafH+colW*2}`} fill="#1e40af" stroke="#60a5fa" strokeWidth="1" />
                <polygon points={`${xB},${yEave+rafH} ${xB-colW*2},${yEave+rafH - (colW*2)*Math.tan(alphaRad)} ${xB},${yEave+rafH+colW*2}`} fill="#1e40af" stroke="#60a5fa" strokeWidth="1" />

                {/* Ridge Connection (Bản mã đỉnh nóc) */}
                <rect x={xMid-8} y={yPeak-5} width="16" height={rafH+20} fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
                {[yPeak+5, yPeak+rafH/2, yPeak+rafH-5].map((y, i) => (
                    <circle key={`bolt-${i}`} cx={xMid-4} cy={y} r="1.5" fill="#0f172a" />
                ))}
                {[yPeak+5, yPeak+rafH/2, yPeak+rafH-5].map((y, i) => (
                    <circle key={`bolt-r-${i}`} cx={xMid+4} cy={y} r="1.5" fill="#0f172a" />
                ))}

                {/* Purlins & Sag Rods */}
                {purlins.map((p, i) => (
                    <g key={`purlin-${i}`}>
                        {/* Left */}
                        <rect x={p.xL - 4} y={p.yL - 10} width="8" height="10" fill="#f59e0b" stroke="#b45309" strokeWidth="1" transform={`rotate(${alphaDeg}, ${p.xL}, ${p.yL})`} />
                        {/* Right */}
                        <rect x={p.xR - 4} y={p.yR - 10} width="8" height="10" fill="#f59e0b" stroke="#b45309" strokeWidth="1" transform={`rotate(${-alphaDeg}, ${p.xR}, ${p.yR})`} />
                        
                        {/* Sag rods between purlins */}
                        {i > 0 && (
                            <>
                                <line x1={p.xL} y1={p.yL-5} x2={purlins[i-1].xL} y2={purlins[i-1].yL-5} stroke="#cbd5e1" strokeWidth="1" />
                                <line x1={p.xR} y1={p.yR-5} x2={purlins[i-1].xR} y2={purlins[i-1].yR-5} stroke="#cbd5e1" strokeWidth="1" />
                            </>
                        )}
                    </g>
                ))}

                {/* Eave Strut (Dầm chống mép mái) */}
                <rect x={xA-10} y={yEave-12} width="12" height="12" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
                <rect x={xB-2} y={yEave-12} width="12" height="12" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />

                {/* Slope Indicator */}
                <g transform={`translate(${xA + L*scale*0.25}, ${yEave - (L*scale*0.25)*Math.tan(alphaRad) - 20})`}>
                    <polygon points="0,0 40,0 40,-12" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="20" y="12" fill="#38bdf8" fontSize="10" textAnchor="middle">100%</text>
                    <text x="45" y="-4" fill="#38bdf8" fontSize="10">{slopePercent}%</text>
                </g>

                {/* Dimensions */}
                {/* L Span */}
                <line x1={xA} y1={groundY+35} x2={xB} y2={groundY+35} stroke="#64748b" strokeWidth="1" markerStart="url(#arrow-dim)" markerEnd="url(#arrow-dim)" />
                <rect x={xMid-40} y={groundY+27} width="80" height="16" fill="#0f172a" />
                <text x={xMid} y={groundY+39} fill="#cbd5e1" fontSize="12" textAnchor="middle">L = {L}m</text>

                {/* H Column */}
                <line x1={xA-45} y1={yEave} x2={xA-45} y2={groundY} stroke="#64748b" strokeWidth="1" markerStart="url(#arrow-dim)" markerEnd="url(#arrow-dim)" />
                <line x1={xA-50} y1={yEave} x2={xA} y2={yEave} stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />
                <rect x={xA-55} y={groundY - (groundY-yEave)/2 - 10} width="20" height="20" fill="#0f172a" />
                <text x={xA-45} y={groundY - (groundY-yEave)/2 + 4} fill="#cbd5e1" fontSize="12" textAnchor="middle" transform={`rotate(-90, ${xA-45}, ${groundY - (groundY-yEave)/2})`}>H = {H_col}m</text>

                {/* H Roof */}
                <line x1={xMid+20} y1={yPeak} x2={xMid+20} y2={groundY} stroke="#64748b" strokeWidth="1" markerStart="url(#arrow-dim)" markerEnd="url(#arrow-dim)" />
                <line x1={xMid} y1={yPeak} x2={xMid+25} y2={yPeak} stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />
                <rect x={xMid+10} y={yPeak + (groundY-yPeak)/2 - 15} width="20" height="30" fill="#0f172a" />
                <text x={xMid+20} y={yPeak + (groundY-yPeak)/2 + 4} fill="#cbd5e1" fontSize="12" textAnchor="middle" transform={`rotate(-90, ${xMid+20}, ${yPeak + (groundY-yPeak)/2})`}>H_roof = {H_rf}m</text>
            </svg>
        );
    };

    const renderSideElevation = () => {
        const scale = Math.min(25, 700 / length); // fit width
        const w = length * scale + 100;
        const h = H_rf * scale + 150;
        const groundY = h - 60;
        
        return (
            <svg width="100%" height="400" viewBox={`0 0 ${Math.max(w, 800)} ${h}`} className="bg-slate-950 font-sans">
                {renderDefs()}
                
                {/* Ground Line */}
                <line x1="20" y1={groundY} x2={w-20} y2={groundY} stroke="#475569" strokeWidth="2" strokeDasharray="10,5" />
                
                {/* Columns & Grids */}
                {Array.from({length: numBays + 1}).map((_, i) => {
                    const x = 50 + i * (B * scale);
                    return (
                        <g key={`side-col-${i}`}>
                            <line x1={x} y1={groundY - H_col*scale} x2={x} y2={groundY} stroke="#3b82f6" strokeWidth="4" />
                            <line x1={x} y1={groundY - H_col*scale - 20} x2={x} y2={groundY + 30} stroke="#ef4444" strokeWidth="1" strokeDasharray="5,3" />
                            <circle cx={x} cy={groundY + 30} r="12" fill="#0f172a" stroke="#ef4444" strokeWidth="1.5" />
                            <text x={x} y={groundY + 35} fill="#f87171" fontSize="12" fontWeight="bold" textAnchor="middle">{i+1}</text>
                            
                            {/* Foundation */}
                            <rect x={x-15} y={groundY} width="30" height="15" fill="url(#concrete-hatch)" stroke="#94a3b8" />
                        </g>
                    );
                })}

                {/* Eave Gutter & Strut */}
                <rect x="45" y={groundY - H_col*scale - 5} width={length*scale + 10} height="10" fill="#64748b" stroke="#94a3b8" strokeWidth="1" />
                
                {/* Wall Girts (Xà gồ vách) */}
                {[0.25, 0.5, 0.75].map(ratio => {
                    const y = groundY - H_col*scale * ratio;
                    return <line key={`girt-${ratio}`} x1="50" y1={y} x2={50 + length*scale} y2={y} stroke="#64748b" strokeWidth="2" strokeDasharray="10,4" />;
                })}

                {/* Bracing in exterior bays */}
                {numBays >= 2 && (
                    <>
                        {/* First bay */}
                        <line x1="50" y1={groundY - H_col*scale} x2={50 + B*scale} y2={groundY} stroke="#ef4444" strokeWidth="2" strokeDasharray="8,4" />
                        <line x1="50" y1={groundY} x2={50 + B*scale} y2={groundY - H_col*scale} stroke="#ef4444" strokeWidth="2" strokeDasharray="8,4" />
                        
                        {/* Last bay */}
                        <line x1={50 + (numBays-1)*B*scale} y1={groundY - H_col*scale} x2={50 + numBays*B*scale} y2={groundY} stroke="#ef4444" strokeWidth="2" strokeDasharray="8,4" />
                        <line x1={50 + (numBays-1)*B*scale} y1={groundY} x2={50 + numBays*B*scale} y2={groundY - H_col*scale} stroke="#ef4444" strokeWidth="2" strokeDasharray="8,4" />
                    </>
                )}

                {/* Dimensions */}
                {/* Bay spacing */}
                <line x1="50" y1={groundY + 10} x2={50 + B*scale} y2={groundY + 10} stroke="#64748b" strokeWidth="1" markerStart="url(#arrow-dim)" markerEnd="url(#arrow-dim)" />
                <text x={50 + B*scale/2} y={groundY + 8} fill="#cbd5e1" fontSize="10" textAnchor="middle">{B}m</text>

                {/* Total Length */}
                <line x1="50" y1={groundY - H_col*scale - 30} x2={50 + length*scale} y2={groundY - H_col*scale - 30} stroke="#64748b" strokeWidth="1" markerStart="url(#arrow-dim)" markerEnd="url(#arrow-dim)" />
                <rect x={50 + length*scale/2 - 40} y={groundY - H_col*scale - 38} width="80" height="16" fill="#0f172a" />
                <text x={50 + length*scale/2} y={groundY - H_col*scale - 26} fill="#cbd5e1" fontSize="12" textAnchor="middle">L_total = {length}m</text>
            </svg>
        );
    };

    const renderRoofPlan = () => {
        const scale = Math.min(10, 700 / length); // fit width
        const w = length * scale + 100;
        const h = L * scale + 100;
        
        return (
            <svg width="100%" height="400" viewBox={`0 0 ${Math.max(w, 800)} ${h}`} className="bg-slate-950 font-sans">
                {renderDefs()}
                
                {/* Roof Boundary */}
                <rect x="50" y="50" width={length*scale} height={L*scale} fill="#1e293b" stroke="#475569" strokeWidth="2" />
                
                {/* Ridge Line */}
                <line x1="40" y1={50 + L*scale/2} x2={50 + length*scale + 10} y2={50 + L*scale/2} stroke="#f59e0b" strokeWidth="2" strokeDasharray="10,5" />
                <text x={50 + length*scale + 15} y={50 + L*scale/2 + 4} fill="#f59e0b" fontSize="12" fontWeight="bold">ĐỈNH MÁI</text>

                {/* Grids */}
                {Array.from({length: numBays + 1}).map((_, i) => {
                    const x = 50 + i * (B * scale);
                    return (
                        <g key={`roof-grid-${i}`}>
                            <line x1={x} y1="40" x2={x} y2={50 + L*scale + 20} stroke="#ef4444" strokeWidth="1" strokeDasharray="5,3" />
                            <circle cx={x} cy={50 + L*scale + 20} r="10" fill="#0f172a" stroke="#ef4444" strokeWidth="1.5" />
                            <text x={x} y={50 + L*scale + 24} fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">{i+1}</text>
                        </g>
                    );
                })}

                {/* Grid A & B */}
                <circle cx="30" cy="50" r="10" fill="#0f172a" stroke="#ef4444" strokeWidth="1.5" />
                <text x="30" y="54" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">A</text>
                <circle cx="30" cy={50 + L*scale} r="10" fill="#0f172a" stroke="#ef4444" strokeWidth="1.5" />
                <text x="30" y={50 + L*scale + 4} fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">B</text>

                {/* Purlins (Xà gồ) */}
                {[0.25, 0.5, 0.75].map(ratio => {
                    const dy = (L/2)*scale * ratio;
                    return (
                        <g key={`roof-purlin-${ratio}`}>
                            <line x1="50" y1={50 + dy} x2={50 + length*scale} y2={50 + dy} stroke="#64748b" strokeWidth="1" strokeDasharray="4,2" />
                            <line x1="50" y1={50 + L*scale - dy} x2={50 + length*scale} y2={50 + L*scale - dy} stroke="#64748b" strokeWidth="1" strokeDasharray="4,2" />
                        </g>
                    );
                })}

                {/* Bracing in exterior bays */}
                {numBays >= 2 && (
                    <>
                        {/* First bay */}
                        <line x1="50" y1="50" x2={50 + B*scale} y2={50 + L*scale/2} stroke="#ef4444" strokeWidth="1.5" />
                        <line x1="50" y1={50 + L*scale/2} x2={50 + B*scale} y2="50" stroke="#ef4444" strokeWidth="1.5" />
                        <line x1="50" y1={50 + L*scale/2} x2={50 + B*scale} y2={50 + L*scale} stroke="#ef4444" strokeWidth="1.5" />
                        <line x1="50" y1={50 + L*scale} x2={50 + B*scale} y2={50 + L*scale/2} stroke="#ef4444" strokeWidth="1.5" />

                        {/* Last bay */}
                        <line x1={50 + (numBays-1)*B*scale} y1="50" x2={50 + numBays*B*scale} y2={50 + L*scale/2} stroke="#ef4444" strokeWidth="1.5" />
                        <line x1={50 + (numBays-1)*B*scale} y1={50 + L*scale/2} x2={50 + numBays*B*scale} y2="50" stroke="#ef4444" strokeWidth="1.5" />
                        <line x1={50 + (numBays-1)*B*scale} y1={50 + L*scale/2} x2={50 + numBays*B*scale} y2={50 + L*scale} stroke="#ef4444" strokeWidth="1.5" />
                        <line x1={50 + (numBays-1)*B*scale} y1={50 + L*scale} x2={50 + numBays*B*scale} y2={50 + L*scale/2} stroke="#ef4444" strokeWidth="1.5" />
                    </>
                )}

                {/* Dimensions */}
                <line x1="50" y1="20" x2={50 + length*scale} y2="20" stroke="#64748b" strokeWidth="1" markerStart="url(#arrow-dim)" markerEnd="url(#arrow-dim)" />
                <text x={50 + length*scale/2} y="15" fill="#cbd5e1" fontSize="12" textAnchor="middle">L_total = {length}m</text>

                {/* North Arrow */}
                <g transform={`translate(${Math.max(w, 800) - 50}, 40)`}>
                    <circle cx="0" cy="0" r="20" fill="none" stroke="#94a3b8" strokeWidth="2" />
                    <polygon points="0,-15 5,5 0,2 -5,5" fill="#ef4444" />
                    <text x="0" y="22" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">B</text>
                </g>
            </svg>
        );
    };

    const renderSectionDetail = () => {
        return (
            <div className="flex flex-col md:flex-row gap-6 p-4 bg-slate-950 text-slate-300">
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-blue-400 mb-4 border-b border-slate-800 pb-2">TIẾT DIỆN CỘT THÉP</h4>
                    <svg width="300" height="300" viewBox="0 0 300 300">
                        {renderDefs()}
                        <g transform="translate(150, 150)">
                            {/* I-Section Drawing */}
                            {/* Flanges */}
                            <rect x={-colSec.b/2} y={-colSec.h/2} width={colSec.b} height={colSec.tf} fill="url(#steel-hatch)" stroke="#3b82f6" strokeWidth="2" />
                            <rect x={-colSec.b/2} y={colSec.h/2 - colSec.tf} width={colSec.b} height={colSec.tf} fill="url(#steel-hatch)" stroke="#3b82f6" strokeWidth="2" />
                            {/* Web */}
                            <rect x={-colSec.tw/2} y={-colSec.h/2 + colSec.tf} width={colSec.tw} height={colSec.h - 2*colSec.tf} fill="url(#steel-hatch)" stroke="#3b82f6" strokeWidth="2" />
                            
                            {/* Fillet radius approximation */}
                            <circle cx={colSec.tw/2 + colSec.r} cy={-colSec.h/2 + colSec.tf + colSec.r} r={colSec.r} fill="none" stroke="#1d4ed8" strokeWidth="1" strokeDasharray="2,2" />

                            {/* CG Marker */}
                            <circle cx="0" cy="0" r="4" fill="#ef4444" />
                            <line x1="-15" y1="0" x2="15" y2="0" stroke="#ef4444" strokeWidth="1" />
                            <line x1="0" y1="-15" x2="0" y2="15" stroke="#ef4444" strokeWidth="1" />
                            
                            {/* Dimensions */}
                            <line x1={-colSec.b/2} y1={-colSec.h/2 - 20} x2={colSec.b/2} y2={-colSec.h/2 - 20} stroke="#94a3b8" markerStart="url(#arrow-dim)" markerEnd="url(#arrow-dim)" />
                            <text x="0" y={-colSec.h/2 - 25} fill="#cbd5e1" fontSize="12" textAnchor="middle">b = {colSec.b}</text>

                            <line x1={colSec.b/2 + 20} y1={-colSec.h/2} x2={colSec.b/2 + 20} y2={colSec.h/2} stroke="#94a3b8" markerStart="url(#arrow-dim)" markerEnd="url(#arrow-dim)" />
                            <text x={colSec.b/2 + 30} y="0" fill="#cbd5e1" fontSize="12" textAnchor="start" dominantBaseline="middle">h = {colSec.h}</text>
                        </g>
                    </svg>
                    <div className="mt-4 bg-slate-900 p-3 rounded-lg border border-slate-700">
                        <table className="w-full text-xs">
                            <tbody>
                                <tr className="border-b border-slate-800"><td className="py-1 text-slate-400">Chiều cao (h)</td><td className="text-right font-mono">{colSec.h} mm</td></tr>
                                <tr className="border-b border-slate-800"><td className="py-1 text-slate-400">Rộng cánh (b)</td><td className="text-right font-mono">{colSec.b} mm</td></tr>
                                <tr className="border-b border-slate-800"><td className="py-1 text-slate-400">Dày bản bụng (t<sub>w</sub>)</td><td className="text-right font-mono">{colSec.tw} mm</td></tr>
                                <tr><td className="py-1 text-slate-400">Dày bản cánh (t<sub>f</sub>)</td><td className="text-right font-mono">{colSec.tf} mm</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex-1">
                    <h4 className="text-sm font-bold text-blue-400 mb-4 border-b border-slate-800 pb-2">TIẾT DIỆN KÈO THÉP</h4>
                    <svg width="300" height="300" viewBox="0 0 300 300">
                        {renderDefs()}
                        <g transform="translate(150, 150)">
                            {/* Flanges */}
                            <rect x={-rafSec.b/2} y={-rafSec.h/2} width={rafSec.b} height={rafSec.tf} fill="url(#steel-hatch)" stroke="#3b82f6" strokeWidth="2" />
                            <rect x={-rafSec.b/2} y={rafSec.h/2 - rafSec.tf} width={rafSec.b} height={rafSec.tf} fill="url(#steel-hatch)" stroke="#3b82f6" strokeWidth="2" />
                            {/* Web */}
                            <rect x={-rafSec.tw/2} y={-rafSec.h/2 + rafSec.tf} width={rafSec.tw} height={rafSec.h - 2*rafSec.tf} fill="url(#steel-hatch)" stroke="#3b82f6" strokeWidth="2" />
                            
                            {/* CG Marker */}
                            <circle cx="0" cy="0" r="4" fill="#ef4444" />
                            <line x1="-15" y1="0" x2="15" y2="0" stroke="#ef4444" strokeWidth="1" />
                            <line x1="0" y1="-15" x2="0" y2="15" stroke="#ef4444" strokeWidth="1" />

                            {/* Dimensions */}
                            <line x1={-rafSec.b/2} y1={-rafSec.h/2 - 20} x2={rafSec.b/2} y2={-rafSec.h/2 - 20} stroke="#94a3b8" markerStart="url(#arrow-dim)" markerEnd="url(#arrow-dim)" />
                            <text x="0" y={-rafSec.h/2 - 25} fill="#cbd5e1" fontSize="12" textAnchor="middle">b = {rafSec.b}</text>

                            <line x1={rafSec.b/2 + 20} y1={-rafSec.h/2} x2={rafSec.b/2 + 20} y2={rafSec.h/2} stroke="#94a3b8" markerStart="url(#arrow-dim)" markerEnd="url(#arrow-dim)" />
                            <text x={rafSec.b/2 + 30} y="0" fill="#cbd5e1" fontSize="12" textAnchor="start" dominantBaseline="middle">h = {rafSec.h}</text>
                        </g>
                    </svg>
                    <div className="mt-4 bg-slate-900 p-3 rounded-lg border border-slate-700">
                        <table className="w-full text-xs">
                            <tbody>
                                <tr className="border-b border-slate-800"><td className="py-1 text-slate-400">Chiều cao (h)</td><td className="text-right font-mono">{rafSec.h} mm</td></tr>
                                <tr className="border-b border-slate-800"><td className="py-1 text-slate-400">Rộng cánh (b)</td><td className="text-right font-mono">{rafSec.b} mm</td></tr>
                                <tr className="border-b border-slate-800"><td className="py-1 text-slate-400">Dày bản bụng (t<sub>w</sub>)</td><td className="text-right font-mono">{rafSec.tw} mm</td></tr>
                                <tr><td className="py-1 text-slate-400">Dày bản cánh (t<sub>f</sub>)</td><td className="text-right font-mono">{rafSec.tf} mm</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const downloadSVG = () => {
        const svgEl = document.querySelector('#project-svg-container svg');
        if (!svgEl) return;
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ban_ve_2d_${activeTab}_Nhip_${L}m.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const tabs = [
        { id: 'cross_section', label: 'Mặt cắt ngang', icon: 'ruler' },
        { id: 'elevation', label: 'Mặt đứng dọc', icon: 'align-vertical-space-around' },
        { id: 'roof_plan', label: 'Mặt bằng mái', icon: 'layout-grid' },
        { id: 'section_detail', label: 'Chi tiết tiết diện', icon: 'search' }
    ];

    return (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-xl text-slate-200 my-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-700 mb-4 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <i data-lucide="compass" className="w-6 h-6 text-blue-500"></i>
                        BẢN VẼ HÌNH HỌC 2D KẾT CẤU CÔNG TRÌNH
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Khung ngang nhịp <strong className="text-blue-400 font-mono">{L}m</strong>, 
                        bước cột <strong className="text-blue-400 font-mono">{B}m</strong>, 
                        chiều dài <strong className="text-blue-400 font-mono">{length}m</strong> ({numBays} bước).
                    </p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                    <button 
                        onClick={downloadSVG}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors shadow-xs"
                        title="Tải tệp vector SVG của bản vẽ hiện tại"
                    >
                        <i data-lucide="download" className="w-3.5 h-3.5 text-blue-400"></i> Xuất bản vẽ (.SVG)
                    </button>

                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                                    activeTab === tab.id 
                                        ? 'bg-blue-600 text-white shadow-md font-bold' 
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                                }`}
                            >
                                <i data-lucide={tab.icon} className="w-3.5 h-3.5"></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div id="project-svg-container" className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative">
                {/* Scale Bar Hint */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-slate-900/80 rounded border border-slate-700 text-[10px] text-slate-400 font-mono pointer-events-none z-10">
                    Bản vẽ CAD/BIM 2D - TL: Tùy biến
                </div>

                <div className="overflow-x-auto">
                    {activeTab === 'cross_section' && renderCrossSection()}
                    {activeTab === 'elevation' && renderSideElevation()}
                    {activeTab === 'roof_plan' && renderRoofPlan()}
                    {activeTab === 'section_detail' && renderSectionDetail()}
                </div>
            </div>
            
            <div className="flex gap-4 mt-4 text-xs text-slate-400">
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 inline-block rounded-sm"></span> Lưới trục</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 inline-block rounded-sm"></span> Cấu kiện thép</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 inline-block rounded-sm"></span> Hệ xà gồ</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-500 inline-block rounded-sm"></span> Đường kích thước</div>
            </div>
        </div>
    );
};

window.ProjectSvg = ProjectSvg;
