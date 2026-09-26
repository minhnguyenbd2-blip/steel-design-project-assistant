// React Component to render a Calculation Step

function CalculationBlock({ step }) {
    const { stepId, title, source, formulaLaTeX, substitutionLaTeX, result, unit, check, notes } = step;

    // Helper to format source citation
    const formatSource = (src) => {
        let text = src.standard;
        if (src.section) text += `, Mục ${src.section}`;
        if (src.table) text += `, ${src.table}`;
        if (src.appendix) text += `, Phụ lục ${src.appendix}`;
        if (src.formulaNumber) text += `, CT ${src.formulaNumber}`;
        return text;
    };

    // Use KaTeX to render LaTeX strings safely
    const renderLatex = (latex) => {
        if (!latex) return { __html: '' };
        try {
            return { __html: katex.renderToString(latex, { throwOnError: false, displayMode: true }) };
        } catch (e) {
            return { __html: `<span class="text-red-500">Error rendering LaTeX: ${e.message}</span>` };
        }
    };

    return (
        <div className="calc-block" id={stepId}>
            <div className="calc-title">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm font-mono">{stepId}</span>
                    <span>{title}</span>
                </div>
                <div 
                    className="calc-source flex items-center gap-1"
                    title="Click để xem chi tiết nguồn viện dẫn"
                    onClick={() => alert(`Nguồn: ${formatSource(source)}\n\nHệ thống sẽ hiển thị modal trích dẫn trực tiếp từ TCVN trong phiên bản hoàn chỉnh.`)}
                >
                    <i data-lucide="book-open" className="w-4 h-4"></i>
                    {formatSource(source)}
                </div>
            </div>
            
            {notes && <div className="text-sm text-gray-500 mb-2">{notes}</div>}
            
            <div className="calc-formula text-center text-gray-700 dark:text-gray-300">
                <div dangerouslySetInnerHTML={renderLatex(formulaLaTeX)} />
            </div>
            
            <div className="calc-formula text-center text-gray-600 dark:text-gray-400 mt-2">
                <div dangerouslySetInnerHTML={renderLatex(substitutionLaTeX)} />
            </div>
            
            <div className="calc-result flex items-center justify-center gap-4 mt-4 text-lg">
                <span>Kết quả:</span>
                <span className="font-bold">{result} <span className="text-sm font-normal">{unit}</span></span>
            </div>

            {check && (
                <div className={`mt-4 p-3 rounded border flex flex-col items-center ${check.isPass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-sm text-gray-600 mb-1">Kiểm tra điều kiện:</div>
                    <div dangerouslySetInnerHTML={renderLatex(check.conditionLaTeX)} className="mb-2" />
                    <div className={`font-bold ${check.isPass ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                        {check.isPass ? (
                            <><i data-lucide="check-circle" className="w-5 h-5"></i> THỎA MÃN ĐIỀU KIỆN</>
                        ) : (
                            <><i data-lucide="x-circle" className="w-5 h-5"></i> KHÔNG THỎA MÃN</>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

window.CalculationBlock = CalculationBlock;
