const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/ReportViewer.jsx', 'utf8');

const injection = `
    const purlinSteps = projectState.results?.purlinResult?.steps || [];
`;

c = c.replace(
    /const slabSteps = projectState.slabResult \? projectState.slabResult.steps : \[\];/,
    `$&
    const purlinSteps = projectState.results?.purlinResult?.steps || [];`
);

const htmlInjection = `
                {/* Phần: Thiết kế Xà gồ */}
                <div className="mb-10 break-inside-avoid">
                    <h3 className="text-xl font-bold uppercase mb-4 text-slate-800 print:text-black bg-slate-100 print:bg-transparent p-2">CHƯƠNG 3. THIẾT KẾ XÀ GỒ MÁI (TCVN 5575:2024)</h3>
                    {purlinSteps.length > 0 ? (
                        <div className="ml-4">
                            <p className="mb-4 italic font-bold">Tiết diện Xà gồ: {projectState.results?.purlinResult?.purlin?.name || "N/A"}</p>
                            {purlinSteps.map((step, idx) => renderStep(step))}
                        </div>
                    ) : (
                        <p className="text-red-500 italic">Vui lòng chạy tính toán Xà gồ (Tab 2) để xuất dữ liệu.</p>
                    )}
                </div>
`;

c = c.replace(
    /\{\/\* Phần 3: Thiết kế Sàn BTCT \*\/\}/,
    `${htmlInjection}
                {/* Phần 4: Thiết kế Sàn BTCT */}`
);
c = c.replace(/CHƯƠNG 3\. THIẾT KẾ BẢN SÀN/, 'CHƯƠNG 4. THIẾT KẾ BẢN SÀN');
c = c.replace(/CHƯƠNG 4\. THIẾT KẾ DẦM/, 'CHƯƠNG 5. THIẾT KẾ DẦM');
c = c.replace(/CHƯƠNG 5\. THIẾT KẾ CỘT/, 'CHƯƠNG 6. THIẾT KẾ CỘT');
c = c.replace(/CHƯƠNG 6\. THIẾT KẾ LIÊN KẾT/, 'CHƯƠNG 7. THIẾT KẾ LIÊN KẾT');

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/ReportViewer.jsx', c, 'utf8');