// React Component to render a Calculation Step
// Chuẩn hóa theo phong cách Thuyết minh Kỹ thuật Kết cấu Thép & TCVN 2737:2023 / TCVN 5575:2024
// Bố cục rõ ràng: Công thức tổng quát -> Thay số tính toán -> Kết quả & Kiểm tra -> Bảng giải thích ý nghĩa từng ký hiệu

function CalculationBlock({ step }) {
    if (!step) return null;
    const { stepId, title, source, formulaLaTeX, substitutionLaTeX, result, unit, check, notes, symbols: explicitSymbols } = step;

    // Định dạng nguồn trích dẫn tiêu chuẩn
    const formatSource = (src) => {
        if (!src) return "TCVN";
        let text = src.standard || "TCVN";
        if (src.section) text += `, Mục ${src.section}`;
        if (src.table) text += `, ${src.table}`;
        if (src.figure) text += `, ${src.figure}`;
        if (src.appendix) text += `, Phụ lục ${src.appendix}`;
        if (src.formulaNumber || src.formula) text += `, ${src.formulaNumber || src.formula}`;
        return text;
    };

    // Render KaTeX an toàn với fallback văn bản
    const renderLatex = (latex, displayMode = true) => {
        if (!latex) return { __html: '' };
        if (typeof window.katex === 'undefined') {
            return { __html: `<span class="font-mono text-sm">${latex}</span>` };
        }
        try {
            // Chuyển một số ký hiệu thường dùng sang dạng LaTeX chuẩn
            let cleaned = latex
                .replace(/γ_T/g, '\\gamma_T')
                .replace(/γ_G/g, '\\gamma_G')
                .replace(/γ_Q/g, '\\gamma_Q')
                .replace(/γ_f/g, '\\gamma_f')
                .replace(/γ_c/g, '\\gamma_c')
                .replace(/Σ/g, '\\sum ')
                .replace(/≤/g, '\\le ')
                .replace(/≥/g, '\\ge ')
                .replace(/×/g, '\\times ')
                .replace(/·/g, '\\cdot ');

            return {
                __html: window.katex.renderToString(cleaned, {
                    throwOnError: false,
                    displayMode: displayMode
                })
            };
        } catch (e) {
            return { __html: `<span class="font-mono text-xs text-amber-500">${latex}</span>` };
        }
    };

    // Phân tích ghi chú để lấy danh sách giải thích ký hiệu
    const parseNotesToSymbols = (rawNotes) => {
        if (explicitSymbols && Array.isArray(explicitSymbols) && explicitSymbols.length > 0) {
            return { header: 'Ý nghĩa các ký hiệu trong công thức:', symbols: explicitSymbols, otherNotes: [] };
        }
        if (!rawNotes || typeof rawNotes !== 'string') {
            return { header: '', symbols: [], otherNotes: [] };
        }

        const lines = rawNotes.split('\n').map(l => l.trim()).filter(Boolean);
        const symbolsList = [];
        const others = [];
        let headerText = 'Ý nghĩa các ký hiệu trong công thức:';

        lines.forEach(line => {
            if (line.startsWith('•') || line.startsWith('-')) {
                const content = line.replace(/^[•\-]\s*/, '');
                const colonIdx = content.indexOf(':');
                if (colonIdx > 0) {
                    const left = content.slice(0, colonIdx).trim();
                    const right = content.slice(colonIdx + 1).trim();

                    let sym = left;
                    let val = '';
                    if (left.includes('=')) {
                        const eqIdx = left.indexOf('=');
                        sym = left.slice(0, eqIdx).trim();
                        val = left.slice(eqIdx + 1).trim();
                    }

                    symbolsList.push({ symbol: sym, value: val, meaning: right });
                } else {
                    symbolsList.push({ symbol: '', value: '', meaning: content });
                }
            } else if (line.toUpperCase().includes('Ý NGHĨA') || line.toUpperCase().includes('KÝ HIỆU')) {
                headerText = line;
            } else {
                others.push(line);
            }
        });

        return { header: headerText, symbols: symbolsList, otherNotes: others };
    };

    const { header, symbols, otherNotes } = parseNotesToSymbols(notes);
    const hasSymbols = symbols.length > 0;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-500 shadow-md overflow-hidden mb-8 transition-all hover:shadow-lg" id={stepId}>
            {/* Header: Mã bước tính & Nguồn tiêu chuẩn */}
            <div className="bg-slate-50 dark:bg-slate-900/70 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-xs font-mono font-bold">
                        {stepId}
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm md:text-base">
                        {title}
                    </h3>
                </div>
                
                {source && (
                    <div 
                        className="text-xs bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md flex items-center gap-1.5 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        title="Viện dẫn tiêu chuẩn áp dụng"
                        onClick={() => alert(`Nguồn viện dẫn tiêu chuẩn:\n${formatSource(source)}`)}
                    >
                        <i data-lucide="book-marked" className="w-3.5 h-3.5 text-primary inline"></i>
                        <span className="font-medium font-mono">{formatSource(source)}</span>
                    </div>
                )}
            </div>

            {/* Nội dung chính: Phân bổ 2 cột (Cột Trái: Toán học | Cột Phải: Giải thích ký hiệu) */}
            <div className={`p-4 md:p-5 grid grid-cols-1 ${hasSymbols ? 'lg:grid-cols-12' : ''} gap-5`}>
                
                {/* ================= CỘT TRÁI: DÒNG CHẢY TÍNH TOÁN ================= */}
                <div className={`${hasSymbols ? 'lg:col-span-7' : 'w-full'} space-y-4`}>
                    
                    {/* 1. Công thức tổng quát */}
                    {formulaLaTeX && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700/80">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 pb-1 border-b border-slate-200 dark:border-slate-700/60">
                                <span className="flex items-center gap-1.5 text-primary">
                                    <i data-lucide="function-square" className="w-3.5 h-3.5"></i> 1. Công thức tổng quát:
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Formula</span>
                            </div>
                            <div className="overflow-x-auto py-1 text-slate-800 dark:text-slate-100 flex justify-center">
                                <div dangerouslySetInnerHTML={renderLatex(formulaLaTeX, true)} />
                            </div>
                        </div>
                    )}

                    {/* 2. Thế số tính toán cụ thể */}
                    {substitutionLaTeX && (
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700/80">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 pb-1 border-b border-slate-200 dark:border-slate-700/60">
                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <i data-lucide="calculator" className="w-3.5 h-3.5"></i> 2. Thay số & thứ nguyên:
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Substitution</span>
                            </div>
                            <div className="overflow-x-auto py-1 text-slate-700 dark:text-slate-200 flex justify-center">
                                <div dangerouslySetInnerHTML={renderLatex(substitutionLaTeX, true)} />
                            </div>
                        </div>
                    )}

                    {/* 3. Kết quả tính toán & Kiểm tra */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/60">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                3. Kết quả:
                            </span>
                            <span className="text-base md:text-lg font-extrabold text-blue-700 dark:text-blue-400 font-mono">
                                {typeof result === 'number' ? result.toLocaleString('vi-VN') : result}
                            </span>
                            {unit && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-slate-600 dark:text-slate-300">
                                    {unit}
                                </span>
                            )}
                        </div>

                        {/* Kiểm tra điều kiện (Check Pass / Fail) */}
                        {check && (
                            <div className="flex items-center gap-2">
                                {check.isPass ? (
                                    <span className="px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold flex items-center gap-1">
                                        <i data-lucide="check-circle-2" className="w-4 h-4 text-emerald-600 dark:text-emerald-400"></i>
                                        THỎA MÃN (PASS)
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-md bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-800 text-xs font-bold flex items-center gap-1">
                                        <i data-lucide="alert-octagon" className="w-4 h-4 text-red-600 dark:text-red-400"></i>
                                        KHÔNG THỎA MÃN (FAIL)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Hiển thị công thức điều kiện kiểm tra (nếu có conditionLaTeX) */}
                    {check && check.conditionLaTeX && (
                        <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${check.isPass ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200' : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200'}`}>
                            <span className="font-semibold">Điều kiện kiểm tra:</span>
                            <div dangerouslySetInnerHTML={renderLatex(check.conditionLaTeX, false)} />
                        </div>
                    )}

                    {/* Ghi chú khác (nếu có) */}
                    {otherNotes.length > 0 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                            {otherNotes.map((n, idx) => (
                                <p key={idx} className="flex items-start gap-1.5">
                                    <i data-lucide="info" className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5"></i>
                                    <span>{n}</span>
                                </p>
                            ))}
                        </div>
                    )}
                </div>

                {/* ================= CỘT PHẢI: BẢNG GIẢI THÍCH Ý NGHĨA KÝ HIỆU ================= */}
                {hasSymbols && (
                    <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/70 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/80 flex flex-col justify-start">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700 dark:text-slate-200 pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                            <i data-lucide="help-circle" className="w-4 h-4 text-amber-500"></i>
                            <span>{header || "Ý nghĩa ký hiệu trong công thức:"}</span>
                        </div>

                        <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
                            {symbols.map((item, idx) => (
                                <div key={idx} className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs flex flex-col gap-1 transition-all hover:border-primary/40">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        {/* Ký hiệu toán học */}
                                        <div className="flex items-center gap-1.5 font-bold text-primary dark:text-blue-400">
                                            {item.symbol ? (
                                                <div 
                                                    className="inline-block bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900"
                                                    dangerouslySetInnerHTML={renderLatex(item.symbol, false)} 
                                                />
                                            ) : (
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                                            )}
                                        </div>

                                        {/* Giá trị áp dụng nếu có */}
                                        {item.value && (
                                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                                                = {item.value}
                                            </span>
                                        )}
                                    </div>

                                    {/* Ý nghĩa diễn giải */}
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11.5px]">
                                        {item.meaning}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10.5px] text-slate-400 flex items-center justify-between">
                            <span>Quy chuẩn ký hiệu: TCVN 2737 & 5575</span>
                            <span className="italic">Ký hiệu đồng nhất toàn đồ án</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

window.CalculationBlock = CalculationBlock;
