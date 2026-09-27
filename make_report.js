const fs = require('fs');

const code = `
function ReportViewer({ projectState }) {
    const handlePrint = () => {
        window.print();
    };

    const renderLatex = (latex, displayMode = false) => {
        if (!latex) return { __html: '' };
        try {
            return { __html: window.katex.renderToString(latex, { throwOnError: false, displayMode, strict: false }) };
        } catch (e) {
            return { __html: latex };
        }
    };

    // Extract variables for easy access
    const meta = projectState.meta;
    const inputs = projectState.inputs;
    
    // Wind steps
    const windSteps = projectState.windResult ? projectState.windResult.steps : [];
    
    // Slab & Beam steps
    const slabSteps = projectState.slabResult ? projectState.slabResult.steps : [];
    const beamSteps = projectState.beamResult ? projectState.beamResult.steps : [];
    
    // Column & Connection steps
    const columnSteps = projectState.results?.traces?.column || [];
    const connSteps = projectState.results?.traces?.connections || [];

    const renderStep = (step) => (
        <div key={step.stepId} className="mb-4 text-sm print:text-xs text-justify border-b border-slate-100 print:border-slate-300 pb-3">
            <h4 className="font-bold text-slate-800 print:text-black mb-1">• {step.title}</h4>
            <div className="pl-4">
                <div className="flex items-center gap-4 mb-2 overflow-hidden">
                    <span className="font-semibold text-slate-600 print:text-black shrink-0">Công thức:</span>
                    <span dangerouslySetInnerHTML={renderLatex(step.formulaLaTeX, false)} />
                </div>
                <div className="flex items-center gap-4 mb-2 overflow-hidden">
                    <span className="font-semibold text-slate-600 print:text-black shrink-0">Thay số:</span>
                    <span dangerouslySetInnerHTML={renderLatex(step.substitutionLaTeX, false)} />
                </div>
                <div className="flex items-center gap-2 mb-2 font-bold">
                    <span className="text-slate-700 print:text-black">Kết quả:</span>
                    <span className="text-emerald-700 print:text-black">{typeof step.result === 'number' ? step.result.toLocaleString('vi-VN') : step.result} {step.unit}</span>
                    {step.check && (
                        <span className="italic ml-2 font-normal text-xs bg-slate-100 px-1.5 rounded">
                            ({step.check.isPass ? 'Thỏa mãn' : 'Không đạt'})
                        </span>
                    )}
                </div>
                {step.notes && <p className="text-slate-500 print:text-slate-700 text-xs italic">{step.notes.split('\\n')[0]}</p>}
            </div>
        </div>
    );

    const printStyles = \`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-area, #print-area * {
                        visibility: visible;
                    }
                    #print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .print\\\\:hidden {
                        display: none !important;
                    }
                    .print\\\\:text-black {
                        color: #000 !important;
                    }
                    .print\\\\:border-none {
                        border: none !important;
                    }
                    .print\\\\:bg-transparent {
                        background-color: transparent !important;
                    }
                    @page { margin: 20mm; }
                }
            \`;

    return (
        <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-xl text-primary flex items-center gap-2">
                    <i data-lucide="file-text" className="w-5 h-5"></i> Demo Thuyết Minh Tính Toán
                </h2>
                <button 
                    onClick={handlePrint}
                    className="bg-primary hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition-all print:hidden"
                >
                    <i data-lucide="printer" className="w-4 h-4"></i>
                    Xuất file PDF (Print)
                </button>
            </div>
            
            <div className="bg-white text-black p-8 md:p-12 shadow-xl border rounded-lg print:shadow-none print:border-none print:p-0 mx-auto max-w-4xl relative" id="print-area">
                {/* TRANG BÌA (Cover Page) */}
                <div className="text-center mb-16 border-b-2 border-black pb-8 break-after-page">
                    <h2 className="text-xl font-bold uppercase mb-2">Trường Đại Học ......................</h2>
                    <h3 className="text-lg font-semibold mb-12">Khoa Xây Dựng</h3>
                    
                    <h1 className="text-3xl font-extrabold uppercase mb-4 text-blue-900 print:text-black mt-20">THUYẾT MINH TÍNH TOÁN</h1>
                    <h2 className="text-2xl font-bold uppercase mb-16 text-blue-800 print:text-black">ĐỒ ÁN KẾT CẤU THÉP</h2>
                    
                    <div className="text-left max-w-md mx-auto space-y-4 text-lg mt-20 mb-20 border p-6 rounded-lg bg-slate-50 print:bg-white print:border-none">
                        <p><strong>Tên công trình:</strong> {meta.projectName}</p>
                        <p><strong>Địa điểm xây dựng:</strong> {meta.location}</p>
                        <p><strong>Sinh viên thực hiện:</strong> {meta.studentName}</p>
                        <p><strong>MSSV:</strong> {meta.studentId}</p>
                    </div>
                </div>

                {/* NỘI DUNG (Content) */}
                
                {/* Phần 1: Số liệu */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold uppercase mb-4 text-slate-800 print:text-black">CHƯƠNG 1. SỐ LIỆU TÍNH TOÁN</h3>
                    <p className="mb-2 font-bold">1.1 Kích thước hình học:</p>
                    <ul className="list-disc list-inside pl-4 mb-4">
                        <li>Nhịp khung ngang: L = {inputs.L} m</li>
                        <li>Bước cột: B = {inputs.B} m</li>
                        <li>Chiều dài công trình: Chiều dài = {inputs.length} m</li>
                        <li>Chiều cao cột: H = {inputs.H_column} m</li>
                        <li>Độ dốc mái: i = {inputs.roofSlope} %</li>
                    </ul>
                    <p className="mb-2 font-bold">1.2 Điều kiện tính toán:</p>
                    <ul className="list-disc list-inside pl-4 mb-4">
                        <li>Vùng gió: {inputs.windZone} (Địa hình {inputs.terrainCategory}) theo TCVN 2737:2023</li>
                        <li>Mác thép: {inputs.steelGrade} theo TCVN 5575:2024</li>
                    </ul>
                </div>

                {/* Phần 2: Tải trọng gió */}
                <div className="mb-10 break-inside-avoid">
                    <h3 className="text-xl font-bold uppercase mb-4 text-slate-800 print:text-black bg-slate-100 print:bg-transparent p-2">CHƯƠNG 2. TẢI TRỌNG GIÓ LÊN KHUNG (TCVN 2737:2023)</h3>
                    {windSteps.length > 0 ? (
                        <div className="ml-4">
                            {windSteps.map((step, idx) => renderStep(step))}
                        </div>
                    ) : (
                        <p className="text-red-500 italic">Vui lòng chạy tính toán Tải trọng Gió (Tab 2) để xuất dữ liệu.</p>
                    )}
                </div>

                {/* Phần 3: Thiết kế Sàn BTCT */}
                <div className="mb-10 break-inside-avoid">
                    <h3 className="text-xl font-bold uppercase mb-4 text-slate-800 print:text-black bg-slate-100 print:bg-transparent p-2">CHƯƠNG 3. THIẾT KẾ BẢN SÀN BTCT (TCVN 5574:2018)</h3>
                    {slabSteps.length > 0 ? (
                        <div className="ml-4">
                            {slabSteps.map((step, idx) => renderStep(step))}
                        </div>
                    ) : (
                        <p className="text-red-500 italic">Vui lòng chạy tính toán Sàn BTCT (Tab 4) để xuất dữ liệu.</p>
                    )}
                </div>

                {/* Phần 4: Thiết kế Dầm Thép */}
                <div className="mb-10 break-inside-avoid">
                    <h3 className="text-xl font-bold uppercase mb-4 text-slate-800 print:text-black bg-slate-100 print:bg-transparent p-2">CHƯƠNG 4. THIẾT KẾ DẦM THÉP (TCVN 5575:2024)</h3>
                    {beamSteps.length > 0 ? (
                        <div className="ml-4">
                            {beamSteps.map((step, idx) => renderStep(step))}
                        </div>
                    ) : (
                        <p className="text-red-500 italic">Vui lòng chạy tính toán Dầm Thép (Tab 5) để xuất dữ liệu.</p>
                    )}
                </div>

                {/* Phần 5: Thiết kế Cột */}
                <div className="mb-10 break-inside-avoid">
                    <h3 className="text-xl font-bold uppercase mb-4 text-slate-800 print:text-black bg-slate-100 print:bg-transparent p-2">CHƯƠNG 5. THIẾT KẾ CỘT KHUNG CHÍNH (TCVN 5575:2024)</h3>
                    {columnSteps.length > 0 ? (
                        <div className="ml-4">
                            <p className="mb-4 italic font-bold">Tiết diện cột đã chọn: {projectState.results?.selectedSections?.column?.name || "N/A"}</p>
                            {columnSteps.map((step, idx) => renderStep(step))}
                        </div>
                    ) : (
                        <p className="text-red-500 italic">Vui lòng chọn tiết diện cột trong bảng Đề xuất (Tab 6) để xuất dữ liệu chi tiết.</p>
                    )}
                </div>

                {/* Phần 6: Thiết kế Chân Cột */}
                <div className="mb-10 break-inside-avoid">
                    <h3 className="text-xl font-bold uppercase mb-4 text-slate-800 print:text-black bg-slate-100 print:bg-transparent p-2">CHƯƠNG 6. THIẾT KẾ LIÊN KẾT CHÂN CỘT (BASE PLATE)</h3>
                    {connSteps.length > 0 ? (
                        <div className="ml-4">
                            {connSteps.map((step, idx) => renderStep(step))}
                        </div>
                    ) : (
                        <p className="text-red-500 italic">Dữ liệu liên kết sẽ hiển thị sau khi chọn tiết diện Cột (Tab 6).</p>
                    )}
                </div>
                
                {/* Phần ký duyệt */}
                <div className="mt-20 flex justify-between px-12 pb-20 break-inside-avoid">
                    <div className="text-center">
                        <p className="font-bold mb-16">Giáo viên hướng dẫn</p>
                        <p className="italic">(Ký & Ghi rõ họ tên)</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold mb-16">Sinh viên thực hiện</p>
                        <p className="italic font-bold">{meta.studentName}</p>
                    </div>
                </div>

            </div>
            
            {/* INJECT PRINT STYLES */}
            <style dangerouslySetInnerHTML={{__html: printStyles}} />
        </div>
    );
}
window.ReportViewer = ReportViewer;
`;

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/ReportViewer.jsx', code, 'utf8');