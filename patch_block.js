const fs = require('fs');

const code = `
function CalculationBlock({ stepId, title, source, formulaLaTeX, substitutionLaTeX, result, unit, check = null, notes = "" }) {
    // 1. Phân tích nội dung ghi chú (Notes)
    // Tách Ý NGHĨA KÝ HIỆU và GHI CHÚ CHUNG
    const lines = notes.split('\\n');
    let hasSymbols = false;
    let symbols = [];
    let otherNotes = [];
    let header = "";

    let inSymbolSection = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        if (line.includes("Ý NGHĨA KÝ HIỆU") || line.includes("Ý NGHĨA KÝ HIỆU TOÁN HỌC") || line.includes("THÔNG SỐ")) {
            inSymbolSection = true;
            header = line.replace(/^[\\-•*]+\\s*/, '').replace(/:$/, '').trim();
            hasSymbols = true;
            continue;
        }

        if (inSymbolSection) {
            const symMatch = line.match(/^[\\-•*]?\\s*([a-zA-Z0-9_{}()\\\\]+)\\s*(?:=\\s*([0-9.,\\-]+(?:\\s*[a-zA-Z/%2]+)?))?\\s*:\\s*(.+)/);
            if (symMatch) {
                symbols.push({ symbol: symMatch[1].trim(), value: symMatch[2] ? symMatch[2].trim() : null, meaning: symMatch[3].trim() });
            } else {
                const symMatch2 = line.match(/^[\\-•*]?\\s*([^:]+):\\s*(.+)/);
                if (symMatch2) {
                    let leftPart = symMatch2[1].trim();
                    let valMatch = leftPart.match(/(.+)\\s*=\\s*([0-9.,\\-]+(?:\\s*[a-zA-Z/%2]+)?)$/);
                    if (valMatch) {
                        symbols.push({ symbol: valMatch[1].trim(), value: valMatch[2].trim(), meaning: symMatch2[2].trim() });
                    } else {
                        symbols.push({ symbol: leftPart, value: null, meaning: symMatch2[2].trim() });
                    }
                } else {
                    otherNotes.push(line);
                }
            }
        } else {
            otherNotes.push(line);
        }
    }

    const formatSource = (src) => typeof src === 'string' ? src : \`\${src.standard}, \${src.section}\`;

    const renderLatex = (latex, displayMode = false) => {
        try {
            return { __html: window.katex.renderToString(latex, { throwOnError: false, displayMode, strict: false }) };
        } catch (e) {
            return { __html: latex };
        }
    };

    return (
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-800/80 overflow-hidden mb-8 transition-all hover:shadow-md" id={stepId}>
            {/* Elegant Left Accent Line */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600"></div>
            
            {/* Header Area */}
            <div className="px-5 py-4 pl-6 flex flex-wrap justify-between items-center border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 gap-3">
                <div className="flex items-center gap-3">
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono text-xs px-2.5 py-1 rounded-md font-bold tracking-wide border border-blue-100/50 dark:border-blue-800/40 shadow-sm">
                        {stepId}
                    </span>
                    <h3 className="text-base md:text-[17px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                        {title}
                    </h3>
                </div>
                {source && (
                    <div 
                        className="text-[11px] bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700 shadow-sm"
                        title="Tiêu chuẩn áp dụng"
                    >
                        <i data-lucide="book" className="w-3.5 h-3.5 text-blue-500"></i>
                        <span className="font-semibold">{formatSource(source)}</span>
                    </div>
                )}
            </div>

            {/* Main Content Grid */}
            <div className={\`p-5 pl-6 grid grid-cols-1 \${hasSymbols ? 'lg:grid-cols-12' : ''} gap-6\`}>
                
                {/* LFT COLUMN: MATH & RESULT */}
                <div className={\`\${hasSymbols ? 'lg:col-span-7' : 'w-full'} flex flex-col gap-4\`}>
                    
                    {/* Formula Block */}
                    {formulaLaTeX && (
                        <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/40 relative group">
                            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] uppercase tracking-widest text-slate-300 font-mono">Formula</span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                    <span className="text-blue-500 text-xs font-bold block leading-none">1</span>
                                </div>
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Công thức tổng quát</span>
                            </div>
                            <div className="flex justify-center text-slate-800 dark:text-slate-100 overflow-x-auto py-2">
                                <div dangerouslySetInnerHTML={renderLatex(formulaLaTeX, true)} />
                            </div>
                        </div>
                    )}

                    {/* Substitution Block */}
                    {substitutionLaTeX && (
                        <div className="bg-slate-50/50 dark:bg-slate-800/20 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/40 relative group">
                            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] uppercase tracking-widest text-slate-300 font-mono">Subst</span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                    <span className="text-emerald-500 text-xs font-bold block leading-none">2</span>
                                </div>
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Thay số & Thử nguyên</span>
                            </div>
                            <div className="flex justify-center text-slate-800 dark:text-slate-100 overflow-x-auto py-2">
                                <div dangerouslySetInnerHTML={renderLatex(substitutionLaTeX, true)} />
                            </div>
                        </div>
                    )}

                    {/* Result Block (Stunning Emerald Box) */}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50/40 dark:from-emerald-900/20 dark:to-teal-900/10 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
                        <div className="flex items-baseline gap-3">
                            <span className="text-sm font-semibold text-emerald-800/70 dark:text-emerald-400/80">Kết quả:</span>
                            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tracking-tight">
                                {typeof result === 'number' ? result.toLocaleString('vi-VN') : result}
                            </span>
                            {unit && (
                                <span className="text-sm font-medium text-emerald-600/80 dark:text-emerald-500/80">{unit}</span>
                            )}
                        </div>

                        {/* Condition Check Badge */}
                        {check && (
                            <div className="shrink-0">
                                {check.isPass ? (
                                    <span className="px-3 py-1.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-sm border border-emerald-200 dark:border-emerald-800">
                                        <i data-lucide="check-circle-2" className="w-4 h-4"></i>
                                        THỎA MÃN
                                    </span>
                                ) : (
                                    <span className="px-3 py-1.5 rounded-lg bg-red-100/80 dark:bg-red-900/50 text-red-800 dark:text-red-300 text-xs font-bold flex items-center gap-1.5 shadow-sm border border-red-200 dark:border-red-800">
                                        <i data-lucide="x-circle" className="w-4 h-4"></i>
                                        KHÔNG ĐẠT
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Other Notes */}
                    {otherNotes.length > 0 && (
                        <div className="mt-1 text-[11.5px] text-slate-500 dark:text-slate-400 space-y-1">
                            {otherNotes.map((n, idx) => (
                                <p key={idx} className="flex items-start gap-1.5">
                                    <i data-lucide="corner-down-right" className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5"></i>
                                    <span>{n}</span>
                                </p>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: SYMBOLS LIST */}
                {hasSymbols && (
                    <div className="lg:col-span-5 flex flex-col pt-1">
                        <div className="flex items-center gap-2 font-bold text-xs text-slate-500 dark:text-slate-400 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                            <i data-lucide="book-open" className="w-4 h-4"></i> 
                            <span className="uppercase tracking-wider">{header || "Giải thích Ký hiệu"}</span>
                        </div>
                        
                        <div className="space-y-4 overflow-y-auto max-h-[380px] pr-2 custom-scrollbar">
                            {symbols.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3 group">
                                    <div className="shrink-0 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-mono text-blue-600 dark:text-blue-400 text-xs shadow-sm group-hover:border-blue-300 transition-colors">
                                        {item.symbol ? (
                                            <div dangerouslySetInnerHTML={renderLatex(item.symbol, false)} />
                                        ) : (
                                            <span>—</span>
                                        )}
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-snug">
                                            {item.meaning}
                                        </p>
                                        {item.value && (
                                            <div className="mt-1 flex items-center gap-1.5">
                                                <span className="w-3 h-[1px] bg-slate-300 dark:bg-slate-600"></span>
                                                <span className="text-[11px] font-mono text-slate-700 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-1.5 rounded">
                                                    = {item.value}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

window.CalculationBlock = CalculationBlock;
`;

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/CalculationBlock.jsx', code, 'utf8');