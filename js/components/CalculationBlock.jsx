// js/components/CalculationBlock.jsx
// Khối hiển thị chi tiết bước tính toán kỹ thuật (Engineering Calculation Block)
// Thiết kế thông minh: Công thức tự ngắt dòng (Multi-line KaTeX), Bảng ký hiệu lưới đa cột (No-scroll Grid)
// Ngôn ngữ ưu tiên: Tiếng Việt, thuật ngữ Tiếng Anh nếu có đi kèm nằm trong dấu () kế bên.

function CalculationBlock({ step }) {
    if (!step) return null;

    if (step.isNarrative) {
        return (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl shadow-sm border-l-4 border-l-blue-500 border-t border-r border-b border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 leading-relaxed text-justify mb-6">
                {step.content.split('\n').map((para, i) => (
                    <p key={i} className="mb-2 last:mb-0" dangerouslySetInnerHTML={{__html: para}}></p>
                ))}
            </div>
        );
    }

    const { stepId, title, source, formulaLaTeX, substitutionLaTeX, result, unit, check = null, notes = "" } = step;

    // 1. Phân tích nội dung ghi chú (Notes)
    // Tách Ý NGHĨA KÝ HIỆU và GHI CHÚ CHUNG
    const lines = notes.split('\n');
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
            header = line.replace(/^[\-•*]+\s*/, '').replace(/:$/, '').trim();
            hasSymbols = true;
            continue;
        }

        if (inSymbolSection) {
            const symMatch = line.match(/^[\-•*]?\s*([a-zA-Z0-9_{}()\\]+)\s*(?:=\s*([0-9.,\-]+(?:\s*[a-zA-Z/%2]+)?))?\s*:\s*(.+)/);
            if (symMatch) {
                symbols.push({ symbol: symMatch[1].trim(), value: symMatch[2] ? symMatch[2].trim() : null, meaning: symMatch[3].trim() });
            } else {
                const symMatch2 = line.match(/^[\-•*]?\s*([^:]+):\s*(.+)/);
                if (symMatch2) {
                    let leftPart = symMatch2[1].trim();
                    let valMatch = leftPart.match(/(.+)\s*=\s*([0-9.,\-]+(?:\s*[a-zA-Z/%2]+)?)$/);
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

    const formatSource = (src) => typeof src === 'string' ? src : `${src.standard}, ${src.section}`;

    // Hàm tối ưu hóa công thức KaTeX để tự động ngắt dòng thông minh (Smart Multi-line Wrap)
    // Tránh việc công thức quá dài trên 1 dòng gây thanh cuộn ngang khó nhìn
    const formatLatexSmart = (latex) => {
        if (!latex) return "";
        // Nếu chuỗi công thức chứa nhiều đẳng thức phân cách bởi ; \quad hoặc ; ta tách thành các dòng căn chỉnh
        if (latex.includes("; \\quad") || latex.includes(";\\quad") || latex.includes("; \\") || (latex.includes(";") && !latex.includes("\\begin"))) {
            const parts = latex.split(/;\s*\\quad\s*|;\s*\\\\\s*|;\s*\\|;\s*/);
            const validParts = parts.filter(p => p.trim().length > 0);
            if (validParts.length > 1) {
                return "\\begin{aligned}\n" + validParts.map(p => p.trim()).join(" \\\\[5pt]\n") + "\n\\end{aligned}";
            }
        }
        return latex;
    };

    const renderLatex = (latex, displayMode = false) => {
        try {
            const formatted = displayMode ? formatLatexSmart(latex) : latex;
            return { __html: window.katex.renderToString(formatted, { throwOnError: false, displayMode, strict: false }) };
        } catch (e) {
            return { __html: latex };
        }
    };

    return (
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden mb-8 transition-all hover:shadow-md" id={stepId}>
            {/* Thanh màu bên trái thể hiện trạng thái */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${check && !check.isPass ? 'bg-red-500' : 'bg-gradient-to-b from-blue-500 to-indigo-600'}`}></div>
            
            {/* Header: Mã bước + Tiêu đề + Căn cứ tiêu chuẩn */}
            <div className="px-5 py-4 pl-6 flex flex-wrap justify-between items-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 gap-3">
                <div className="flex items-center gap-3">
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono text-xs px-2.5 py-1 rounded-md font-bold tracking-wide border border-blue-200 dark:border-blue-800 shadow-sm">
                        {stepId}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                        {title}
                    </h3>
                </div>
                {source && (
                    <div 
                        className="text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm"
                        title="Tiêu chuẩn thiết kế áp dụng"
                    >
                        <i data-lucide="book-open" className="w-3.5 h-3.5 text-blue-500"></i>
                        <span className="font-semibold">{formatSource(source)}</span>
                    </div>
                )}
            </div>

            {/* Nội dung tính toán: Layout thông minh Full-width, không ép cột hẹp */}
            <div className="p-6 space-y-5">
                
                {/* 1. Công thức tổng quát & Thay số thử nguyên: Thiết kế thoáng, căn giữa đẹp mắt */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Khối công thức tổng quát */}
                    {formulaLaTeX && (
                        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Công thức Tổng quát (Formula)</span>
                            </div>
                            <div className="flex justify-center items-center text-slate-900 dark:text-slate-100 py-3 text-sm md:text-base overflow-x-auto">
                                <div dangerouslySetInnerHTML={renderLatex(formulaLaTeX, true)} />
                            </div>
                        </div>
                    )}

                    {/* Khối thay số & thứ nguyên */}
                    {substitutionLaTeX && (
                        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Thay số & Thứ nguyên (Substitution)</span>
                            </div>
                            <div className="flex justify-center items-center text-slate-900 dark:text-slate-100 py-3 text-sm md:text-base overflow-x-auto">
                                <div dangerouslySetInnerHTML={renderLatex(substitutionLaTeX, true)} />
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Khối kết quả tính toán và huy hiệu Đạt / Không đạt */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-blue-50/30 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-blue-950/10 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
                    <div className="flex items-baseline gap-3">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kết quả (Result):</span>
                        <span className="text-2xl md:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono tracking-tight">
                            {typeof result === 'number' ? result.toLocaleString('vi-VN') : result}
                        </span>
                        {unit && (
                            <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{unit}</span>
                        )}
                    </div>

                    {check && (
                        <div className="shrink-0">
                            {check.isPass ? (
                                <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-sm border border-emerald-300 dark:border-emerald-700">
                                    <i data-lucide="check-circle-2" className="w-4 h-4 text-emerald-600 dark:text-emerald-400"></i>
                                    THỎA MÃN (PASS)
                                </span>
                            ) : (
                                <span className="px-4 py-2 rounded-xl bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 text-xs font-bold flex items-center gap-2 shadow-sm border border-red-300 dark:border-red-700">
                                    <i data-lucide="x-circle" className="w-4 h-4 text-red-600 dark:text-red-400"></i>
                                    KHÔNG ĐẠT (FAIL)
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Khối giải thích ký hiệu & thông số: Bố trí theo Lưới Đa cột thoáng đãng, KHÔNG cuộn dọc */}
                {hasSymbols && symbols.length > 0 && (
                    <div className="pt-2">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <i data-lucide="info" className="w-4 h-4 text-blue-500"></i>
                            <span>{header || "Ý NGHĨA KÝ HIỆU & THÔNG SỐ ÁP DỤNG (SYMBOLS & PARAMETERS)"}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {symbols.map((item, idx) => (
                                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                                    <div className="shrink-0 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 font-mono text-blue-600 dark:text-blue-400 text-xs font-bold shadow-2xs">
                                        {item.symbol ? (
                                            <div dangerouslySetInnerHTML={renderLatex(item.symbol, false)} />
                                        ) : (
                                            <span>•</span>
                                        )}
                                    </div>
                                    <div className="flex-1 text-xs">
                                        <p className="text-slate-700 dark:text-slate-300 leading-snug">
                                            {item.meaning}
                                        </p>
                                        {item.value && (
                                            <div className="mt-1 font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                                                = {item.value}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Ghi chú phụ nếu có */}
                {otherNotes.length > 0 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        {otherNotes.map((n, idx) => (
                            <p key={idx} className="flex items-start gap-1.5">
                                <i data-lucide="chevron-right" className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5"></i>
                                <span>{n}</span>
                            </p>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}

window.CalculationBlock = CalculationBlock;
