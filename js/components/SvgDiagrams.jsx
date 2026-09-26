// SVG Generator for Sections

function ISectionSVG({ h, b, tw, tf }) {
    // Canvas dimensions
    const width = 300;
    const height = 400;
    const padding = 50;

    // Scale to fit
    const scaleX = (width - 2 * padding) / b;
    const scaleY = (height - 2 * padding) / h;
    const scale = Math.min(scaleX, scaleY);

    const b_scaled = b * scale;
    const h_scaled = h * scale;
    const tw_scaled = tw * scale;
    const tf_scaled = tf * scale;

    const cx = width / 2;
    const cy = height / 2;

    const left = cx - b_scaled / 2;
    const right = cx + b_scaled / 2;
    const top = cy - h_scaled / 2;
    const bottom = cy + h_scaled / 2;
    const webLeft = cx - tw_scaled / 2;
    const webRight = cx + tw_scaled / 2;

    // SVG Path for I section
    const pathData = `
        M ${left} ${top}
        L ${right} ${top}
        L ${right} ${top + tf_scaled}
        L ${webRight} ${top + tf_scaled}
        L ${webRight} ${bottom - tf_scaled}
        L ${right} ${bottom - tf_scaled}
        L ${right} ${bottom}
        L ${left} ${bottom}
        L ${left} ${bottom - tf_scaled}
        L ${webLeft} ${bottom - tf_scaled}
        L ${webLeft} ${top + tf_scaled}
        L ${left} ${top + tf_scaled}
        Z
    `;

    return (
        <div className="flex flex-col items-center justify-center p-4 border rounded bg-white dark:bg-slate-800 dark:border-slate-700">
            <svg width={width} height={height} className="drop-shadow-md">
                <defs>
                    <pattern id="hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="8" stroke="#3b82f6" strokeWidth="2" opacity="0.3" />
                    </pattern>
                </defs>

                {/* Section Path */}
                <path d={pathData} fill="url(#hatch)" stroke="#1e40af" strokeWidth="2" />
                
                {/* Dimensions */}
                {/* Height line */}
                <line x1={left - 20} y1={top} x2={left - 20} y2={bottom} stroke="#64748b" strokeWidth="1" />
                <line x1={left - 25} y1={top} x2={left - 15} y2={top} stroke="#64748b" strokeWidth="1" />
                <line x1={left - 25} y1={bottom} x2={left - 15} y2={bottom} stroke="#64748b" strokeWidth="1" />
                <text x={left - 30} y={cy} textAnchor="middle" transform={`rotate(-90, ${left - 30}, ${cy})`} className="text-xs fill-slate-500 font-mono">h = {h}</text>

                {/* Width line */}
                <line x1={left} y1={top - 20} x2={right} y2={top - 20} stroke="#64748b" strokeWidth="1" />
                <line x1={left} y1={top - 25} x2={left} y2={top - 15} stroke="#64748b" strokeWidth="1" />
                <line x1={right} y1={top - 25} x2={right} y2={top - 15} stroke="#64748b" strokeWidth="1" />
                <text x={cx} y={top - 30} textAnchor="middle" className="text-xs fill-slate-500 font-mono">b = {b}</text>

                {/* Web thickness line */}
                <line x1={webLeft} y1={cy} x2={webRight} y2={cy} stroke="#ef4444" strokeWidth="1" />
                <text x={cx} y={cy - 10} textAnchor="middle" className="text-xs fill-red-500 font-mono">tw = {tw}</text>

                {/* Flange thickness line */}
                <line x1={right + 20} y1={top} x2={right + 20} y2={top + tf_scaled} stroke="#ef4444" strokeWidth="1" />
                <line x1={right + 15} y1={top} x2={right + 25} y2={top} stroke="#ef4444" strokeWidth="1" />
                <line x1={right + 15} y1={top + tf_scaled} x2={right + 25} y2={top + tf_scaled} stroke="#ef4444" strokeWidth="1" />
                <text x={right + 30} y={top + tf_scaled / 2} alignmentBaseline="middle" className="text-xs fill-red-500 font-mono">tf = {tf}</text>

                {/* Axes */}
                <line x1={cx} y1={20} x2={cx} y2={height - 20} stroke="#94a3b8" strokeDasharray="5,5" strokeWidth="1" />
                <line x1={20} y1={cy} x2={width - 20} y2={cy} stroke="#94a3b8" strokeDasharray="5,5" strokeWidth="1" />
                <text x={cx} y={15} textAnchor="middle" className="text-xs fill-slate-400 font-mono">y</text>
                <text x={width - 15} y={cy + 3} textAnchor="start" className="text-xs fill-slate-400 font-mono">x</text>

            </svg>
            <div className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                Tiết diện I Tổ hợp (Đơn vị: mm)
            </div>
        </div>
    );
}

window.ISectionSVG = ISectionSVG;
