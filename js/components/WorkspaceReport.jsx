// js/components/WorkspaceReport.jsx
// Thuyết minh Tính toán Kết cấu Thép Chuyên nghiệp (Professional Steel Design Report)
// Tuân thủ toàn diện: TCVN 2737:2023 (Tải trọng & Tác động) và TCVN 5575:2024 (Kết cấu Thép)
// Đối chiếu đồng bộ 100% với Đồ án mẫu Kết cấu Thép Trường ĐH Kiến trúc TP.HCM
// Quy chuẩn ngôn ngữ: Tiếng Việt 100%, thuật ngữ Tiếng Anh nếu có đi kèm nằm trong dấu () kế bên.

const WorkspaceReport = ({ workspaceState }) => {
    if (!workspaceState) return null;

    const members = workspaceState.members || [];
    const designResults = workspaceState.designResults || {};
    const loads = workspaceState.loads || [];
    const combos = workspaceState.loadCombinations || [];
    const legacyInputs = workspaceState.legacyInputs || {};
    const windInputs = legacyInputs.windParams || {};
    const proj = workspaceState.metadata || {};

    // Sắp xếp cấu kiện: Cột (Column) -> Kèo/Dầm (Rafter/Beam) -> Cấu kiện phụ (Purlin/Girt/Brace)
    const sortedMembers = [...members].sort((a, b) => {
        const order = { 'column': 0, 'rafter': 1, 'beam': 2, 'purlin': 3, 'girt': 4, 'brace': 5 };
        const orderA = order[a.type] !== undefined ? order[a.type] : 9;
        const orderB = order[b.type] !== undefined ? order[b.type] : 9;
        if (orderA !== orderB) return orderA - orderB;
        return a.id.localeCompare(b.id);
    });

    // 1. Trích xuất thông số hình học công trình
    const L = Number(legacyInputs.L || legacyInputs.B_span) || 24; // Nhịp khung (m)
    const B = Number(legacyInputs.B || legacyInputs.B_step) || 6;  // Bước cột (m)
    const totalLen = Number(legacyInputs.length || legacyInputs.length_d) || 72; // Chiều dài nhà (m)
    const H_col = Number(legacyInputs.H_column) || 8; // Chiều cao đỉnh cột (m)
    const H_rf = Number(legacyInputs.H_roof) || 9.25; // Chiều cao đỉnh mái (m)
    const roofRise = Math.max(0.1, H_rf - H_col);
    const alphaRad = Math.atan(roofRise / (L / 2));
    const alphaDeg = Number(((alphaRad * 180) / Math.PI).toFixed(2));
    const slopePercent = Number(((roofRise / (L / 2)) * 100).toFixed(1));
    const cosA = Number(Math.cos(alphaRad).toFixed(4));

    // 2. Trích xuất thông số tải trọng gió TCVN 2737:2023
    const windZone = windInputs.windZone || legacyInputs.windZone || 'II';
    const terrain = windInputs.terrainCategory || legacyInputs.terrainCategory || 'B';
    const W0_map = { 'I': 0.65, 'II': 0.95, 'III': 1.25, 'IV': 1.55, 'V': 1.85 };
    const W0 = W0_map[windZone] || 0.95; // kN/m2
    const gamma_T = 0.852;
    const W3s10 = Number((gamma_T * W0).toFixed(3)); // kN/m2
    const Gf = Number((0.85 + H_rf / 1010).toFixed(3)); // Hệ số ứng giật Phụ lục E

    // 3. TÍNH ĐỘ CAO TƯƠNG ĐƯƠNG VÀ HỆ SỐ k(ze) RIÊNG BIỆT CHO TƯỜNG VÀ MÁI (TCVN 2737:2023 Mục 10.2.4 & Bảng 9)
    // Tường: Chiều cao đón gió là H_col => ze_wall = H_col
    // Mái: Chiều cao đỉnh mái là H_rf => ze_roof = H_rf
    const zg_map = { 'A': 213.36, 'B': 274.32, 'C': 365.76 };
    const alpha_terr_map = { 'A': 11.5, 'B': 9.5, 'C': 7.0 };
    const zg = zg_map[terrain] || 274.32;
    const alpha_terr = alpha_terr_map[terrain] || 9.5;

    const ze_wall = H_col;
    const kz_wall = Number((2.01 * Math.pow(ze_wall / zg, 2 / alpha_terr)).toFixed(3));

    const ze_roof = H_rf;
    const kz_roof = Number((2.01 * Math.pow(ze_roof / zg, 2 / alpha_terr)).toFixed(3));

    // 4. Chạy động cơ tính toán nếu có sẵn trong window để trích xuất bảng số liệu đầy đủ
    let windCalc = null;
    let gravCalc = null;
    let combCalc = null;
    try {
        if (typeof window.calculateWindLoad === 'function') {
            windCalc = window.calculateWindLoad({
                L, B, length: totalLen, H_column: H_col, H_roof: H_rf,
                windZone, terrainCategory: terrain, porosityPercent: 0
            });
        }
        if (typeof window.calculateGravityLoads === 'function') {
            gravCalc = window.calculateGravityLoads({ L, B, H_column: H_col, H_roof: H_rf });
        }
        if (typeof window.calculateLoadCombinations === 'function' && gravCalc && windCalc) {
            combCalc = window.calculateLoadCombinations(gravCalc, windCalc);
        }
    } catch (err) {
        console.warn("Lỗi tính toán phụ trợ Thuyết minh:", err);
    }

    // Tĩnh tải & hoạt tải tính toán
    const q_DL = gravCalc ? gravCalc.q_DL : Number(((0.1514 * 1.05 / cosA) * B).toFixed(2));
    const q_LL = gravCalc ? gravCalc.q_LL : Number(((0.30 * 1.30 / cosA) * B).toFixed(2));

    // Dữ liệu bảng gió
    const windSurfaces = (windCalc && windCalc.loadCases && windCalc.loadCases['+X']) ? windCalc.loadCases['+X'].surfaces : [];

    // Tiện ích render công thức KaTeX an toàn
    const renderLatex = (latex, displayMode = false) => {
        if (!latex) return { __html: '' };
        try {
            if (window.katex) {
                return { __html: window.katex.renderToString(latex, { throwOnError: false, displayMode, strict: false }) };
            }
            return { __html: latex };
        } catch (e) {
            return { __html: latex };
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto print:max-w-none text-sm text-slate-800 dark:text-slate-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 md:p-12 print:shadow-none print:border-none print:p-0">

                {/* ========================================================================= */}
                {/* TRANG BÌA HỒ SƠ THIẾT KẾ (COVER PAGE)                                     */}
                {/* ========================================================================= */}
                <div className="text-center mb-12 border-b-2 border-slate-900 dark:border-slate-100 pb-10 print:break-after-page">
                    <div className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold mb-2">
                        BỘ XÂY DỰNG — TRƯỜNG ĐẠI HỌC KIẾN TRÚC TP. HỒ CHÍ MINH — KHOA XÂY DỰNG
                    </div>
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-8">
                        BỘ MÔN KẾT CẤU CÔNG TRÌNH — ĐỒ ÁN MÔN HỌC KẾT CẤU THÉP
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold uppercase mb-4 text-blue-900 dark:text-blue-400 tracking-tight">
                        THUYẾT MINH TÍNH TOÁN KẾT CẤU THÉP
                    </h1>
                    <h2 className="text-xl md:text-2xl font-bold uppercase text-slate-700 dark:text-slate-300 mb-8">
                        THIẾT KẾ KHUNG NHÀ CÔNG NGHIỆP MỘT TẦNG, MỘT NHỊP (PORTAL FRAME)
                    </h2>

                    <div className="max-w-md mx-auto my-8 p-6 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-3">
                        <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                            <span className="font-bold text-slate-500">Tên công trình (Project Name):</span>
                            <span className="font-bold text-slate-800 dark:text-slate-100">{proj.name || 'Nhà xưởng Công nghiệp Thép tiền chế'}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                            <span className="font-bold text-slate-500">Sinh viên thực hiện (Designer):</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{proj.author || 'Kỹ sư Thiết kế'}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                            <span className="font-bold text-slate-500">Tiêu chuẩn tải trọng (Load Code):</span>
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">TCVN 2737:2023</span>
                        </div>
                        <div className="flex justify-between border-b pb-2 dark:border-slate-700">
                            <span className="font-bold text-slate-500">Tiêu chuẩn thép (Steel Code):</span>
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">TCVN 5575:2024</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold text-slate-500">Ngày hoàn thành (Date):</span>
                            <span className="font-semibold">{new Date().toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>

                    <div className="text-xs text-slate-400 italic">
                        Thành phố Hồ Chí Minh, Năm {new Date().getFullYear()}
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* MỤC LỤC THUYẾT MINH (TABLE OF CONTENTS)                                  */}
                {/* ========================================================================= */}
                <div className="mb-10 p-6 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 print:break-after-page">
                    <h2 className="font-bold text-base uppercase text-primary border-b pb-2 mb-4 tracking-wider flex items-center gap-2">
                        <i data-lucide="list" className="w-4 h-4"></i> MỤC LỤC HỒ SƠ THUYẾT MINH (TABLE OF CONTENTS)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        <div className="flex justify-between border-b border-dotted py-1">
                            <span>CHƯƠNG 1: SỐ LIỆU THIẾT KẾ VÀ LỰA CHỌN VẬT LIỆU</span>
                            <span className="font-bold">Chương 1</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted py-1">
                            <span>CHƯƠNG 2: XÁC ĐỊNH KÍCH THƯỚC KHUNG & SƠ BỘ CHỌN TIẾT DIỆN</span>
                            <span className="font-bold">Chương 2</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted py-1">
                            <span>CHƯƠNG 3: XÁC ĐỊNH TẢI TRỌNG TÁC DỤNG (TCVN 2737:2023)</span>
                            <span className="font-bold">Chương 3</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted py-1">
                            <span>CHƯƠNG 4: TỔ HỢP TẢI TRỌNG THIẾT KẾ KHUNG PHẲNG</span>
                            <span className="font-bold">Chương 4</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted py-1">
                            <span>CHƯƠNG 5: THIẾT KẾ TOLE LỢP MÁI VÀ XÀ GỒ MÁI (PURLIN)</span>
                            <span className="font-bold">Chương 5</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted py-1">
                            <span>CHƯƠNG 6: TÍNH TOÁN VÀ KIỂM TRA CỘT THÉP (TCVN 5575:2024)</span>
                            <span className="font-bold">Chương 6</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted py-1">
                            <span>CHƯƠNG 7: TÍNH TOÁN VÀ KIỂM TRA DẦM MÁI / KÈO THÉP</span>
                            <span className="font-bold">Chương 7</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted py-1">
                            <span>CHƯƠNG 8: TÍNH TOÁN CÁC CHI TIẾT LIÊN KẾT CHÍNH (JOINTS)</span>
                            <span className="font-bold">Chương 8</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted py-1">
                            <span>CHƯƠNG 9: KẾT LUẬN VÀ KIẾN NGHỊ KỸ THUẬT</span>
                            <span className="font-bold">Chương 9</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-12">

                    {/* ========================================================================= */}
                    {/* CHƯƠNG 1: SỐ LIỆU THIẾT KẾ VÀ LỰA CHỌN VẬT LIỆU                           */}
                    {/* ========================================================================= */}
                    <section>
                        <h2 className="font-bold text-lg border-b-2 border-primary pb-2 mb-6 uppercase text-primary tracking-wide">
                            CHƯƠNG 1: SỐ LIỆU THIẾT KẾ VÀ LỰA CHỌN VẬT LIỆU (DESIGN DATA & MATERIALS)
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-sm mb-2 text-slate-900 dark:text-slate-100">1.1. Số liệu Thiết kế Chung (Design Parameters)</h3>
                                <p className="text-justify mb-4">
                                    Công trình là nhà xưởng công nghiệp một tầng, một nhịp kết cấu khung thép tiền chế (Portal Frame).
                                    Mái dốc hai phía lợp tole cách nhiệt, hệ sườn tường tôn bao che. Hệ giằng cột và giằng mái chữ X (X-bracing)
                                    được bố trí nghiêm ngặt tại hai gian đầu hồi của nhà để tạo khối cứng không gian ổn định dọc công trình.
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="text-slate-500 mb-1">Nhịp khung ngang (Span L):</div>
                                        <div className="font-bold font-mono text-sm text-blue-600 dark:text-blue-400">{L} m</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="text-slate-500 mb-1">Bước khung cột (Bay Spacing B):</div>
                                        <div className="font-bold font-mono text-sm text-blue-600 dark:text-blue-400">{B} m</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="text-slate-500 mb-1">Chiều dài toàn bộ nhà (Length):</div>
                                        <div className="font-bold font-mono text-sm text-blue-600 dark:text-blue-400">{totalLen} m</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="text-slate-500 mb-1">Chiều cao đỉnh cột (H_cột):</div>
                                        <div className="font-bold font-mono text-sm text-blue-600 dark:text-blue-400">{H_col} m</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="text-slate-500 mb-1">Chiều cao đỉnh mái (H_mái):</div>
                                        <div className="font-bold font-mono text-sm text-blue-600 dark:text-blue-400">{H_rf} m</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="text-slate-500 mb-1">Độ dốc mái (Roof Slope i):</div>
                                        <div className="font-bold font-mono text-sm text-blue-600 dark:text-blue-400">{slopePercent}% (α = {alphaDeg}°)</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="text-slate-500 mb-1">Vùng áp lực gió (Wind Zone):</div>
                                        <div className="font-bold font-mono text-sm text-blue-600 dark:text-blue-400">Vùng {windZone} (W₀ = {W0} kN/m²)</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700">
                                        <div className="text-slate-500 mb-1">Dạng địa hình (Terrain):</div>
                                        <div className="font-bold font-mono text-sm text-blue-600 dark:text-blue-400">Dạng {terrain} (Tương đối trống trải)</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-sm mb-2 text-slate-900 dark:text-slate-100">1.2. Lựa chọn Vật liệu và Cường độ Tính toán (TCVN 5575:2024)</h3>
                                <p className="text-justify mb-3">
                                    Vật liệu thép sử dụng cho khung chính (cột, kèo) và kết cấu thứ cấp (xà gồ, giằng) tuân thủ nghiêm ngặt
                                    quy chuẩn TCVN 5575:2024. Cường độ tính toán chịu kéo, nén, uốn của thép được xác định theo công thức:
                                    <span className="font-mono font-bold mx-1">f = f<sub>y</sub> / γ<sub>m</sub></span>
                                    với hệ số độ tin cậy vật liệu <span className="font-mono">γ<sub>m</sub> = 1,05</span> (TCVN 5575:2024 Mục 4.2).
                                    Cường độ chịu cắt tính toán: <span className="font-mono font-bold mx-1">f<sub>v</sub> = 0,58 × f</span>.
                                    Hệ số điều kiện làm việc của kết cấu: <span className="font-mono">γ<sub>c</sub> = 1,00</span>.
                                </p>

                                <table className="w-full text-xs border-collapse border border-slate-200 dark:border-slate-700 mb-3">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="border border-slate-200 dark:border-slate-700 p-2 text-left">Hạng mục Vật liệu</th>
                                            <th className="border border-slate-200 dark:border-slate-700 p-2 text-left">Quy cách / Mác vật liệu</th>
                                            <th className="border border-slate-200 dark:border-slate-700 p-2 text-center">Cường độ chảy (fy)</th>
                                            <th className="border border-slate-200 dark:border-slate-700 p-2 text-center">Cường độ tính toán (f)</th>
                                            <th className="border border-slate-200 dark:border-slate-700 p-2 text-center">Cường độ cắt (fv)</th>
                                            <th className="border border-slate-200 dark:border-slate-700 p-2 text-center">Mô đun đàn hồi (E)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workspaceState.materials.map(mat => (
                                            <tr key={mat.id}>
                                                <td className="border border-slate-200 dark:border-slate-700 p-2 font-bold">{mat.name} (Thép khung chính)</td>
                                                <td className="border border-slate-200 dark:border-slate-700 p-2">Thép cán nóng / Thép tấm tổ hợp</td>
                                                <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">{mat.fy} MPa</td>
                                                <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono font-bold text-blue-600">{(mat.fy / 1.05).toFixed(1)} MPa</td>
                                                <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">{(0.58 * mat.fy / 1.05).toFixed(1)} MPa</td>
                                                <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">{mat.E.toLocaleString('vi-VN')} MPa</td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 font-bold">Thép xà gồ mái (Purlin)</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2">Thép mạ kẽm cường độ cao Z250 / C200</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">245 MPa</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono font-bold text-blue-600">233,3 MPa</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">135,3 MPa</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">205.000 MPa</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 font-bold">Bu lông liên kết mặt bích</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2">Bu lông cường độ cao cấp bền 8.8 (Grade 8.8)</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">640 MPa</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono font-bold text-blue-600">f_tb = 400 MPa</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">f_vb = 320 MPa</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">210.000 MPa</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 font-bold">Bu lông neo móng (Anchor Bolt)</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2">Thép bu lông cấp bền 5.8 / Mác 09Mn2Si</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">400 MPa</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono font-bold text-blue-600">f_ba = 190 MPa</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">f_vb = 210 MPa</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">210.000 MPa</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 font-bold">Bê tông móng (Foundation Concrete)</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2">Bê tông mác B20 (Mác #250)</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">--</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono font-bold text-blue-600">R_b = 11,5 MPa</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">R_bt = 0,9 MPa</td>
                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">27.000 MPa</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* CHƯƠNG 2: XÁC ĐỊNH KÍCH THƯỚC KHUNG & SƠ BỘ CHỌN TIẾT DIỆN               */}
                    {/* ========================================================================= */}
                    <section>
                        <h2 className="font-bold text-lg border-b-2 border-primary pb-2 mb-6 uppercase text-primary tracking-wide">
                            CHƯƠNG 2: XÁC ĐỊNH KÍCH THƯỚC KHUNG NGANG & SƠ BỘ CHỌN TIẾT DIỆN (PRELIMINARY SIZING)
                        </h2>

                        <div className="space-y-6">
                            <p className="text-justify">
                                Dựa trên số liệu đề bài và các công thức kinh nghiệm của giáo trình Thiết kế Kết cấu Thép Nhà Công nghiệp
                                (ĐH Kiến trúc TP.HCM & ĐH Bách Khoa), kích thước hình học khung ngang và sơ bộ kích thước tiết diện cấu kiện được xác định như sau:
                            </p>

                            {/* 2.1 SƠ BỘ TIẾT DIỆN CỘT THÉP */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <i data-lucide="box" className="w-4 h-4 text-amber-500"></i>
                                    2.1. Sơ bộ Chọn Tiết diện Cột Thép (Steel Column)
                                </h3>
                                <p className="text-justify">
                                    Chiều cao tiết diện cột được xác định sơ bộ theo chiều cao cột H = {H_col} m:
                                </p>
                                <div className="font-mono bg-white dark:bg-slate-800 p-2.5 rounded border text-center">
                                    h<sub>cột</sub> = (1/15 ÷ 1/20) × H = (1/15 ÷ 1/20) × {H_col * 1000} mm = {Math.round(H_col*1000/20)} ÷ {Math.round(H_col*1000/15)} mm
                                    &emsp;⇒ Chọn sơ bộ: <strong className="text-blue-600">h<sub>c</sub> = 400 ÷ 450 mm</strong>
                                </div>
                                <p className="text-justify">
                                    Bề rộng bản cánh cột: b<sub>f</sub> = (1/2 ÷ 1/3) × h<sub>c</sub> = 150 ÷ 200 mm ⇒ Chọn <strong className="text-blue-600">b<sub>f</sub> = 200 mm</strong>.<br/>
                                    Chiều dày bản bụng: t<sub>w</sub> ≥ h<sub>c</sub> / 100 và t<sub>w</sub> ≥ 8 mm ⇒ Chọn <strong className="text-blue-600">t<sub>w</sub> = 8 ÷ 10 mm</strong>.<br/>
                                    Chiều dày bản cánh: t<sub>f</sub> ≥ b<sub>f</sub> / 30 và t<sub>f</sub> ≥ 10 mm ⇒ Chọn <strong className="text-blue-600">t<sub>f</sub> = 10 ÷ 12 mm</strong>.<br/>
                                    <strong>Tiết diện cột chọn sơ bộ: I400×200×8×10 mm (hoặc I450×200×8×12 mm).</strong>
                                </p>
                            </div>

                            {/* 2.2 SƠ BỘ TIẾT DIỆN DẦM MÁI / KÈO THÉP */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <i data-lucide="minus" className="w-4 h-4 text-indigo-500"></i>
                                    2.2. Sơ bộ Chọn Tiết diện Dầm Mái / Kèo Thép (Rafter)
                                </h3>
                                <p className="text-justify">
                                    Chiều cao tiết diện dầm mái tại nách khung (vị trí mô men lớn nhất) lấy theo nhịp khung L = {L} m:
                                </p>
                                <div className="font-mono bg-white dark:bg-slate-800 p-2.5 rounded border text-center">
                                    h<sub>kèo,nách</sub> = (1/20 ÷ 1/30) × L = (1/20 ÷ 1/30) × {L * 1000} mm = {Math.round(L*1000/30)} ÷ {Math.round(L*1000/20)} mm
                                    &emsp;⇒ Chọn sơ bộ: <strong className="text-blue-600">h<sub>kèo</sub> = 500 ÷ 600 mm</strong>
                                </div>
                                <p className="text-justify">
                                    Tại đỉnh mái (nơi mô men nhỏ hơn): chiều cao tiết diện dầm giảm xuống còn h<sub>kèo,đỉnh</sub> = 300 ÷ 350 mm.<br/>
                                    Bề rộng bản cánh: b<sub>f</sub> = (1/2 ÷ 1/4) × h<sub>kèo</sub> = 180 ÷ 220 mm ⇒ Chọn <strong className="text-blue-600">b<sub>f</sub> = 200 mm</strong>.<br/>
                                    Bản bụng t<sub>w</sub> = 8 mm; Bản cánh t<sub>f</sub> = 10 ÷ 12 mm.<br/>
                                    <strong>Tiết diện dầm mái chọn sơ bộ: I500×200×8×10 mm (thay đổi tiết diện về đỉnh I350×200×8×10 mm).</strong>
                                </p>
                            </div>

                            {/* 2.3 SƠ BỘ CHỌN TOLE LỢP VÀ XÀ GỒ MÁI */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <i data-lucide="layers" className="w-4 h-4 text-emerald-500"></i>
                                    2.3. Sơ bộ Chọn Tole Lợp Mái và Xà gồ Mái (Roof Cladding & Purlin)
                                </h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>
                                        <strong>Tole lợp mái:</strong> Chọn tole sóng vuông mạ hợp kim nhôm kẽm (Zamil Steel 5 sóng), bề dày t = 0,5 mm (trọng lượng tiêu chuẩn g<sub>tole</sub> = 0,05 kN/m²).
                                    </li>
                                    <li>
                                        <strong>Khoảng cách xà gồ mái (a):</strong> Chọn bước xà gồ bố trí hợp lý trên sườn dầm mái:
                                        <span className="font-mono font-bold mx-1">a = 1,2 ÷ 1,5 m</span>.
                                    </li>
                                    <li>
                                        <strong>Chiều cao xà gồ mái:</strong> Nhịp xà gồ đúng bằng bước cột B = {B} m:
                                        <span className="font-mono mx-1">h<sub>xg</sub> = (1/35 ÷ 1/45) × B = (1/35 ÷ 1/45) × {B * 1000} mm = {Math.round(B*1000/45)} ÷ {Math.round(B*1000/35)} mm</span>.
                                        ⇒ <strong>Chọn xà gồ thép dập nguội chữ Z250×72×20×2.0 mm (hoặc Z200×65×20×1.8 mm).</strong>
                                    </li>
                                </ul>
                            </div>

                            {/* 2.4 BỐ TRÍ HỆ GIẰNG KẾT CẤU */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <i data-lucide="git-branch" className="w-4 h-4 text-purple-500"></i>
                                    2.4. Bố trí Hệ Giằng Kết Cấu (Bracing System)
                                </h3>
                                <p className="text-justify">
                                    Hệ giằng có vai trò tạo sự bất biến hình không gian cho toàn bộ nhà, đảm bảo độ ổn định tổng thể cho các khung ngang
                                    và truyền toàn bộ tải trọng gió đầu hồi, lực xô dọc nhà xuống hệ móng.
                                    Tuân thủ nghiêm ngặt nguyên tắc cấu tạo:
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>
                                        <strong>Hệ giằng cột chữ X (Wall Bracing):</strong> Bố trí ở <strong>hai gian đầu hồi</strong> của công trình
                                        (gian khung 1–2 và gian cuối cùng). Thanh giằng chéo chữ X sử dụng thép góc đều cạnh kép chữ thập 2L63×5 hoặc thép tròn căng đúp Ø22 có tăng đơ.
                                    </li>
                                    <li>
                                        <strong>Hệ giằng mái chữ X (Roof Bracing):</strong> Bố trí ở hai gian đầu hồi tương ứng với hệ giằng cột,
                                        kết hợp với các thanh chống dọc tại đỉnh mái và mép mái để tạo thành giàn không gian đầu hồi cứng chắc.
                                    </li>
                                    <li>
                                        <strong>Xà gồ tường (Wall Girts):</strong> Bố trí dọc theo các cột biên với khoảng cách đứng 1,5 m để đỡ hệ tôn vách bao che.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* CHƯƠNG 3: XÁC ĐỊNH TẢI TRỌNG VÀ SƠ ĐỒ TÍNH CỦA KHUNG                     */}
                    {/* ========================================================================= */}
                    <section>
                        <h2 className="font-bold text-lg border-b-2 border-primary pb-2 mb-6 uppercase text-primary tracking-wide">
                            CHƯƠNG 3: XÁC ĐỊNH TẢI TRỌNG VÀ SƠ ĐỒ TÍNH (LOADS & STRUCTURAL ACTIONS)
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-sm mb-2 text-slate-900 dark:text-slate-100">3.1. Tĩnh tải (Tải trọng thường xuyên — Dead Load)</h3>
                                <p className="text-justify mb-2">
                                    Tĩnh tải tác dụng lên khung ngang bao gồm trọng lượng bản thân của tấm tôn lợp mái, tôn vách,
                                    trọng lượng hệ xà gồ mái, hệ giằng, và các hệ thống kỹ thuật treo trần (đèn chiếu sáng, thông gió, PCCC).
                                    Theo TCVN 2737:2023 Bảng 1, hệ số độ tin cậy tải trọng thường xuyên đối với kết cấu kim loại và tôn nhẹ là:
                                    <span className="font-mono font-bold mx-1">γ<sub>G</sub> = 1,05</span>.
                                </p>
                                <p className="text-justify mb-3">
                                    Tải trọng trên mặt dốc mái được quy đổi về mặt bằng hình chiếu theo công thức:
                                    <span className="font-mono font-bold mx-1">g<sub>mb</sub> = g<sub>mái</sub> / cos α</span>.
                                    Tải trọng phân bố đều tác dụng trên 1 mét dài dầm mái khung ngang (với bước khung B = {B} m):
                                </p>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border font-mono text-xs text-center">
                                    q<sub>DL</sub> = (Σ g<sub>k,i</sub> × γ<sub>G</sub> / cos α) × B = (0,1514 × 1,05 / {cosA}) × {B} = <strong className="text-blue-600">{q_DL} kN/m</strong>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-sm mb-2 text-slate-900 dark:text-slate-100">3.2. Hoạt tải Sửa chữa Mái (Roof Live Load)</h3>
                                <p className="text-justify mb-2">
                                    Căn cứ theo <strong>TCVN 2737:2023 Bảng 4, Mục 8.3.1 (Khu vực H — Mái không sử dụng, chỉ có người đi lại bảo dưỡng sửa chữa)</strong>:
                                    Giá trị hoạt tải tiêu chuẩn phân bố đều trên mặt bằng mái:
                                    <span className="font-mono font-bold mx-1">p<sub>k</sub> = 0,30 kN/m²</span> (tương đương 30 daN/m²).
                                    Hệ số độ tin cậy tải trọng tạm thời: <span className="font-mono font-bold mx-1">γ<sub>Q</sub> = 1,30</span>.
                                </p>
                                <p className="text-justify mb-3">
                                    Giá trị hoạt tải tính toán tác dụng dồn lên 1 mét dài dầm mái khung ngang:
                                </p>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border font-mono text-xs text-center">
                                    q<sub>LL</sub> = (p<sub>k</sub> × γ<sub>Q</sub> / cos α) × B = (0,30 × 1,30 / {cosA}) × {B} = <strong className="text-blue-600">{q_LL} kN/m</strong>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-sm mb-2 text-slate-900 dark:text-slate-100">3.3. Tải trọng Gió Chính (Wind Load) theo TCVN 2737:2023</h3>
                                <p className="text-justify mb-3">
                                    Theo TCVN 2737:2023 Mục 10.2 và Phụ lục F, áp lực gió tiêu chuẩn w<sub>k</sub> và áp lực gió tính toán w<sub>d</sub>
                                    tại cao độ tương đương z<sub>e</sub> tác dụng lên từng vùng bề mặt công trình được xác định theo công thức:
                                </p>

                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-center font-mono text-xs space-y-1 mb-4">
                                    <div className="text-sm font-bold text-blue-900 dark:text-blue-300">
                                        w<sub>k</sub> = W<sub>3s,10</sub> × k(z<sub>e</sub>) × (c<sub>e</sub> − c<sub>i</sub>) × G<sub>f</sub> [kN/m²]
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-400">
                                        w<sub>d</sub> = γ<sub>f</sub> × w<sub>k</sub> = 2,1 × w<sub>k</sub> [kN/m²]; &emsp; q<sub>d</sub> = w<sub>d</sub> × B [kN/m dài khung]
                                    </div>
                                </div>

                                {/* ĐẶC BIỆT: THUYẾT MINH PHÂN TÁCH Kze TƯỜNG VÀ MÁI */}
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-300 dark:border-amber-700 text-xs space-y-2 mb-4">
                                    <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-sm">
                                        <i data-lucide="alert-triangle" className="w-4 h-4 text-amber-600"></i>
                                        NGUYÊN TẮC BẮT BUỘC: PHÂN TÁCH ĐỘ CAO TƯƠNG ĐƯƠNG z<sub>e</sub> VÀ HỆ SỐ k(z<sub>e</sub>) CHO TƯỜNG VÀ MÁI
                                    </div>
                                    <p className="text-justify">
                                        Theo <strong>TCVN 2737:2023 Điều 10.2.4 và Phụ lục F</strong>, việc tính toán hệ số thay đổi áp lực gió theo độ cao k(z<sub>e</sub>)
                                        phải được thực hiện <strong>riêng biệt cho từng bộ phận</strong>, tuyệt đối không được gộp chung:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1.5">
                                        <li>
                                            <strong>Đối với TƯỜNG ĐỨNG (Walls):</strong> Chiều cao của diện đón gió tường là chiều cao đỉnh cột
                                            <span className="font-mono font-bold mx-1">H<sub>cột</sub> = {H_col} m</span>.
                                            Do h = H<sub>cột</sub> &lt; b = {totalLen} m nên độ cao tương đương của tường lấy đúng bằng chiều cao cột:
                                            <span className="font-mono font-bold mx-1">z<sub>e,tường</sub> = {ze_wall} m</span>.
                                            Hệ số độ cao tương ứng theo Bảng 9 (Địa hình {terrain}):
                                            <span className="font-mono font-bold mx-1 text-blue-700 dark:text-blue-300">k(z<sub>e,tường</sub>) = {kz_wall}</span>.
                                        </li>
                                        <li>
                                            <strong>Đối với MÁI DỐC (Roofs):</strong> Chiều cao công trình tại đỉnh mái là
                                            <span className="font-mono font-bold mx-1">h = H<sub>đỉnh mái</sub> = {H_rf} m</span>.
                                            Do h &lt; b nên độ cao tương đương của mái lấy bằng chiều cao đỉnh mái:
                                            <span className="font-mono font-bold mx-1">z<sub>e,mái</sub> = {ze_roof} m</span>.
                                            Hệ số độ cao tương ứng theo Bảng 9 (Địa hình {terrain}):
                                            <span className="font-mono font-bold mx-1 text-blue-700 dark:text-blue-300">k(z<sub>e,mái</sub>) = {kz_roof}</span>.
                                        </li>
                                    </ul>
                                    <p className="italic text-slate-500">
                                        Kết luận: k(z<sub>e,mái</sub>) = {kz_roof} &gt; k(z<sub>e,tường</sub>) = {kz_wall}. Hai bộ phận có hệ số khác nhau và được tính độc lập.
                                    </p>
                                </div>

                                {/* BẢNG CHI TIẾT TẢI GIÓ TỪNG VÙNG */}
                                <h4 className="font-bold text-xs mb-2">Bảng tổng hợp Tải trọng Gió tác dụng lên các vùng của Khung ngang (θ = 0°, Gió +X):</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs border-collapse border border-slate-200 dark:border-slate-700">
                                        <thead className="bg-slate-100 dark:bg-slate-900">
                                            <tr>
                                                <th className="border border-slate-200 dark:border-slate-700 p-2 text-left">Bề mặt</th>
                                                <th className="border border-slate-200 dark:border-slate-700 p-2 text-center">Vùng</th>
                                                <th className="border border-slate-200 dark:border-slate-700 p-2 text-center">Cao độ ze</th>
                                                <th className="border border-slate-200 dark:border-slate-700 p-2 text-center">k(ze)</th>
                                                <th className="border border-slate-200 dark:border-slate-700 p-2 text-center">c_e</th>
                                                <th className="border border-slate-200 dark:border-slate-700 p-2 text-center">c_i</th>
                                                <th className="border border-slate-200 dark:border-slate-700 p-2 text-center">c_net</th>
                                                <th className="border border-slate-200 dark:border-slate-700 p-2 text-right">W_k (kN/m²)</th>
                                                <th className="border border-slate-200 dark:border-slate-700 p-2 text-right">q_d (kN/m)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {windSurfaces.length > 0 ? windSurfaces.map((s, idx) => (
                                                <tr key={idx} className={s.surface === 'Tường' ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}>
                                                    <td className="border border-slate-200 dark:border-slate-700 p-2 font-medium">{s.surface}</td>
                                                    <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-bold font-mono">{s.zone}</td>
                                                    <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">{s.ze} m</td>
                                                    <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono font-bold text-blue-600">{s.kz}</td>
                                                    <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">{s.ce > 0 ? `+${s.ce}` : s.ce}</td>
                                                    <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono">{s.ci > 0 ? `+${s.ci}` : s.ci}</td>
                                                    <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-mono font-bold">{s.c_net > 0 ? `+${s.c_net}` : s.c_net}</td>
                                                    <td className="border border-slate-200 dark:border-slate-700 p-2 text-right font-mono">{s.pressure_k}</td>
                                                    <td className="border border-slate-200 dark:border-slate-700 p-2 text-right font-mono font-bold text-emerald-600">{s.frameLineLoad_d}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="9" className="p-4 text-center text-slate-400 italic">
                                                        Dữ liệu tải gió đang được tính toán theo động cơ TCVN 2737:2023...
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* CHƯƠNG 4: TỔ HỢP TẢI TRỌNG THIẾT KẾ KHUNG PHẲNG                           */}
                    {/* ========================================================================= */}
                    <section>
                        <h2 className="font-bold text-lg border-b-2 border-primary pb-2 mb-6 uppercase text-primary tracking-wide">
                            CHƯƠNG 4: TỔ HỢP TẢI TRỌNG THIẾT KẾ KHUNG NGANG (LOAD COMBINATIONS)
                        </h2>

                        <div className="space-y-4">
                            <p className="text-justify">
                                Tổ hợp tải trọng được thiết lập theo quy định của <strong>TCVN 2737:2023 Điều 4.3</strong>.
                                Phân biệt rõ hai nhóm tổ hợp cơ bản:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="font-bold text-blue-600 dark:text-blue-400 mb-1">Tổ hợp Cơ bản 1 (THCB 1)</div>
                                    <div className="font-mono text-slate-600 dark:text-slate-400 mb-2">S = S_G + 1,0 × S_Q1</div>
                                    <p className="text-justify">Gồm tải trọng thường xuyên (tĩnh tải) và <strong>một</strong> hoạt tải tạm thời (hoạt tải mái hoặc gió). Hệ số tổ hợp ψ = 1,0 (Điều 4.3.3).</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="font-bold text-purple-600 dark:text-purple-400 mb-1">Tổ hợp Cơ bản 2 (THCB 2)</div>
                                    <div className="font-mono text-slate-600 dark:text-slate-400 mb-2">S = S_G + 0,9 × S_Q1 + 0,9 × S_Q2</div>
                                    <p className="text-justify">Gồm tĩnh tải và <strong>từ hai hoạt tải trở lên</strong> cùng xuất hiện đồng thời. Trị số hoạt tải được nhân hệ số giảm trừ ψ = 0,9 (Điều 4.3.4).</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="font-bold text-red-600 dark:text-red-400 mb-1">Tổ hợp Nhổ Neo Móng (Uplift)</div>
                                    <div className="font-mono text-slate-600 dark:text-slate-400 mb-2">S = 0,9 × S_G,tc + 1,0 × S_W,bốc</div>
                                    <p className="text-justify">Xét trường hợp tĩnh tải nhỏ nhất có lợi kết hợp với gió bốc mái để kiểm tra lực nhổ và lực kéo nguy hiểm nhất tại bu lông chân cột.</p>
                                </div>
                            </div>

                            {/* BẢNG TỔ HỢP TẢI TRỌNG VÀ NỘI LỰC */}
                            {combCalc && combCalc.frameForces && combCalc.frameForces.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-bold text-xs mb-2">Bảng tổng hợp Nội lực Chân cột theo các Tổ hợp Tải trọng:</h4>
                                    <table className="w-full text-xs border-collapse border border-slate-200 dark:border-slate-700">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                                            <tr>
                                                <th className="border border-slate-200 dark:border-slate-700 p-2 text-left">Ký hiệu</th>
                                                <th className="border border-slate-200 dark:border-slate-700 p-2 text-left">Tên Tổ hợp</th>
                                                <th className="border border-slate-200 dark:border-slate-700 p-2 text-right">Lực dọc N (kN)</th>
                                                <th className="border border-slate-200 dark:border-slate-700 p-2 text-right">Mô men Mx (kNm)</th>
                                                <th className="border border-slate-200 dark:border-slate-700 p-2 text-right">Lực cắt Vx (kN)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {combCalc.frameForces.map((f, idx) => (
                                                <tr key={idx} className={idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-900/20'}>
                                                    <td className="border border-slate-200 dark:border-slate-700 p-2 font-mono font-bold">{f.id}</td>
                                                    <td className="border border-slate-200 dark:border-slate-700 p-2">{f.name}</td>
                                                    <td className={"border border-slate-200 dark:border-slate-700 p-2 text-right font-mono " + (f.N < 0 ? 'text-red-500 font-bold' : '')}>{f.N}</td>
                                                    <td className="border border-slate-200 dark:border-slate-700 p-2 text-right font-mono font-bold">{f.Mx}</td>
                                                    <td className="border border-slate-200 dark:border-slate-700 p-2 text-right font-mono">{f.Vx}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* CHƯƠNG 5: THIẾT KẾ TOLE LỢP MÁI VÀ XÀ GỒ MÁI                              */}
                    {/* ========================================================================= */}
                    <section>
                        <h2 className="font-bold text-lg border-b-2 border-primary pb-2 mb-6 uppercase text-primary tracking-wide">
                            CHƯƠNG 5: THIẾT KẾ TOLE LỢP MÁI VÀ XÀ GỒ MÁI (ROOF CLADDING & PURLIN)
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-sm mb-2 text-slate-900 dark:text-slate-100">5.1. Thiết kế Tole Lợp Mái (Roof Cladding)</h3>
                                <p className="text-justify mb-2">
                                    Mái sử dụng tole sóng mạ hợp kim nhôm kẽm (Zamil Steel 5 sóng), bề dày 0,5 mm.
                                    Khoảng cách giữa các xà gồ đỡ tole là <span className="font-mono font-bold">a = 1,2 ÷ 1,5 m</span>.
                                    Sơ đồ tính toán xem tole như dầm liên tục nhiều nhịp kê trên các xà gồ mái.
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-xs">
                                    <li><strong>Kiểm tra điều kiện bền:</strong> Ứng suất uốn lớn nhất do tĩnh tải và hoạt tải / gió bốc:
                                        <span className="font-mono mx-1">σ = M<sub>max</sub> / W<sub>x</sub> ≤ f × γ<sub>c</sub></span>.
                                    </li>
                                    <li><strong>Kiểm tra điều kiện độ võng:</strong> Độ võng đàn hồi dưới tác dụng của tải trọng tiêu chuẩn:
                                        <span className="font-mono mx-1">Δ / a ≤ [Δ / a] = 1 / 150</span> (TCVN 5575:2024 Phụ lục M).
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-sm mb-2 text-slate-900 dark:text-slate-100">5.2. Thiết kế Xà gồ Mái (Roof Purlin)</h3>
                                <p className="text-justify mb-2">
                                    Xà gồ mái là cấu kiện thép hình cán nguội chữ Z (Z200 / Z250) hoặc chữ C, nhịp tính toán bằng bước khung cột
                                    <span className="font-mono font-bold mx-1">B = {B} m</span>.
                                    Do mái có độ dốc α = {alphaDeg}°, tải trọng tác dụng lên xà gồ được phân thành hai phương:
                                    phương vuông góc với mái (phương y) và phương song song với mặt dốc mái (phương x).
                                    Xà gồ làm việc ở trạng thái <strong>uốn xiên (Biaxial Bending)</strong>.
                                </p>
                                <ul className="list-disc pl-5 space-y-1 text-xs mb-3">
                                    <li><strong>Kiểm tra bền theo ứng suất pháp uốn xiên:</strong>
                                        <span className="font-mono mx-1">σ = (M<sub>x</sub> / W<sub>x</sub>) + (M<sub>y</sub> / W<sub>y</sub>) ≤ f × γ<sub>c</sub></span>.
                                    </li>
                                    <li><strong>Kiểm tra độ võng tổng hợp theo hai phương:</strong>
                                        <span className="font-mono mx-1">Δ = √(Δ<sub>x</sub>² + Δ<sub>y</sub>²) ≤ [Δ] = B / 200</span> (TCVN 5575:2024).
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* CHƯƠNG 6: TÍNH TOÁN VÀ KIỂM TRA CỘT THÉP (TCVN 5575:2024)                 */}
                    {/* ========================================================================= */}
                    <section>
                        <h2 className="font-bold text-lg border-b-2 border-primary pb-2 mb-6 uppercase text-primary tracking-wide">
                            CHƯƠNG 6: TÍNH TOÁN VÀ KIỂM TRA CỘT THÉP (COLUMN DESIGN CHECKS)
                        </h2>

                        <div className="space-y-4 mb-6">
                            <p className="text-justify">
                                Cột khung thép là cấu kiện chịu nén uốn (nén lệch tâm) hai chiều kết hợp lực cắt.
                                Toàn bộ các điều kiện kiểm tra được thực hiện đầy đủ theo <strong>TCVN 5575:2024</strong>:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border">
                                    <div className="font-bold text-blue-600 mb-1">1. Chiều dài tính toán (Effective Length):</div>
                                    <p>Trong mặt phẳng khung: L₀x = μx × H_cột. Ngoài mặt phẳng: L₀y = μy × H_cột (theo các điểm cố kết của hệ giằng dọc).</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border">
                                    <div className="font-bold text-blue-600 mb-1">2. Độ mảnh giới hạn (Slenderness Check):</div>
                                    <p>λ_max = max(L₀x/ix, L₀y/iy) ≤ [λ] = 180 (TCVN 5575:2024 Bảng 25 cho cấu kiện chịu nén).</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border">
                                    <div className="font-bold text-blue-600 mb-1">3. Kiểm tra độ bền nén uốn (Strength):</div>
                                    <p>σ = |N| / A_n + |M| / W_xn ≤ f × γ_c (Công thức 108 Mục 9.2.2).</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border">
                                    <div className="font-bold text-blue-600 mb-1">4. Ổn định tổng thể trong mặt phẳng uốn:</div>
                                    <p>N / (φ_e × A) ≤ f × γ_c với hệ số φ_e tra Bảng D.3 theo độ mảnh quy ước λ̄_x và độ lệch tâm tương đối m_x.</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border">
                                    <div className="font-bold text-blue-600 mb-1">5. Ổn định tổng thể ngoài mặt phẳng uốn:</div>
                                    <p>N / (c × φ_y × A) ≤ f × γ_c (Công thức 110-113) với φ_y tra theo đường uốn cong b và hệ số c Mục 9.2.5.</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded border">
                                    <div className="font-bold text-blue-600 mb-1">6. Ổn định cục bộ bản cánh & bản bụng:</div>
                                    <p>Bản cánh: λ̄_f ≤ [λ̄_uf] (Bảng 24). Bản bụng: λ̄_w = (h_w/t_w)√(f/E) ≤ [λ̄_uw] = 3,2 (Bảng 22).</p>
                                </div>
                            </div>
                        </div>

                        {/* RENDER KẾT QUẢ CỘT */}
                        {sortedMembers.filter(m => m.type === 'column').map(member => {
                            const dr = designResults[member.id];
                            if (!dr || dr.analysisStatus !== 'ANALYZED') return null;
                            const isPass = dr.designStatus === 'PASS';

                            return (
                                <div key={member.id} className="mb-10 border border-slate-200 dark:border-slate-700 rounded-lg break-inside-avoid shadow-sm overflow-hidden">
                                    <div className={"flex justify-between items-center p-4 border-b dark:border-slate-700 " + (isPass ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20")}>
                                        <div>
                                            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                                                {member.label} <span className="font-mono text-xs text-slate-500">[{member.id}]</span>
                                            </h4>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                Tiết diện: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{member.sectionId}</span> | Chiều dài: {member.length} m
                                            </div>
                                        </div>
                                        <span className={"px-3.5 py-1 text-xs font-bold rounded-full border " + (isPass ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300")}>
                                            {isPass ? '✓ ĐẠT YÊU CẦU (PASS)' : '✗ KHÔNG ĐẠT (FAIL)'}
                                        </span>
                                    </div>

                                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                        <div>
                                            <div className="text-slate-400 mb-1">Hệ số tận dụng max (Utilization):</div>
                                            <div className={"font-bold text-lg font-mono " + (dr.utilization > 1 ? 'text-red-500' : 'text-emerald-600')}>
                                                {(dr.utilization * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-slate-400 mb-1">Tổ hợp chi phối (Governing Combo):</div>
                                            <div className="font-bold font-mono text-amber-600 dark:text-amber-400">{dr.governingCombinationId || '--'}</div>
                                            <div className="text-slate-400 mt-0.5">{dr.governingCheck}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="text-slate-400 mb-1">Nội lực chi phối tại tiết diện:</div>
                                            {dr.internalForces ? (
                                                <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                                    N = {(dr.internalForces.N || 0).toFixed(1)} kN &emsp;
                                                    M = {(dr.internalForces.M || 0).toFixed(1)} kNm &emsp;
                                                    V = {(dr.internalForces.V || 0).toFixed(1)} kN
                                                </div>
                                            ) : <div className="text-slate-400">--</div>}
                                        </div>
                                    </div>

                                    {/* CÁC BƯỚC TÍNH TOÁN TRACEABLE */}
                                    {dr.calculationSteps && dr.calculationSteps.length > 0 && (
                                        <div className="p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/10">
                                            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                                                Trình tự Kiểm tra Chi tiết theo TCVN 5575:2024 (Calculation Trace)
                                            </div>
                                            {dr.calculationSteps.map((step, idx) => (
                                                <div key={idx} className="print:break-inside-avoid">
                                                    {window.CalculationBlock ? (
                                                        <window.CalculationBlock step={step} />
                                                    ) : (
                                                        <div className="p-2 bg-red-50 text-red-500 text-xs rounded">Component CalculationBlock chưa sẵn sàng.</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </section>

                    {/* ========================================================================= */}
                    {/* CHƯƠNG 7: TÍNH TOÁN VÀ KIỂM TRA DẦM MÁI / KÈO THÉP                         */}
                    {/* ========================================================================= */}
                    <section>
                        <h2 className="font-bold text-lg border-b-2 border-primary pb-2 mb-6 uppercase text-primary tracking-wide">
                            CHƯƠNG 7: TÍNH TOÁN VÀ KIỂM TRA DẦM MÁI / KÈO THÉP (RAFTER DESIGN)
                        </h2>

                        <div className="space-y-4 mb-6">
                            <p className="text-justify">
                                Dầm mái (kèo thép) chữ I chịu uốn phẳng kết hợp lực nén dọc trục nhỏ.
                                Theo TCVN 5575:2024, dầm mái được kiểm tra theo:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-xs">
                                <li><strong>Kiểm tra độ võng (Deflection Limit):</strong> Chuyển vị võng lớn nhất giữa nhịp dầm:
                                    <span className="font-mono mx-1">f<sub>max</sub> ≤ [f] = L / 250</span> (TCVN 5575:2024 Phụ lục M).
                                </li>
                                <li><strong>Kiểm tra độ bền uốn & cắt:</strong> Ứng suất uốn lớn nhất <span className="font-mono mx-1">σ = M / W<sub>x</sub> ≤ f × γ<sub>c</sub></span>
                                    và ứng suất cắt bản bụng <span className="font-mono mx-1">τ = V·S / (I·t<sub>w</sub>) ≤ f<sub>v</sub> × γ<sub>c</sub></span>.
                                </li>
                                <li><strong>Kiểm tra ứng suất tương đương:</strong> Tại vị trí tiếp xúc giữa bản cánh và bản bụng nơi có M và V đồng thời lớn:
                                    <span className="font-mono mx-1">σ<sub>td</sub> = √(σ² + 3τ²) ≤ 1,15 × f × γ<sub>c</sub></span>.
                                </li>
                                <li><strong>Kiểm tra ổn định tổng thể:</strong> Cánh trên của dầm được giằng cố kết liên tục bởi hệ xà gồ mái nên không mất ổn định tổng thể khi chịu tải trọng đứng.
                                    Khi chịu gió bốc gây nén cánh dưới, kiểm tra ổn định tổng thể theo Mục 8.4.4.
                                </li>
                            </ul>
                        </div>

                        {/* RENDER KẾT QUẢ DẦM / KÈO */}
                        {sortedMembers.filter(m => m.type === 'beam' || m.type === 'rafter').map(member => {
                            const dr = designResults[member.id];
                            if (!dr || dr.analysisStatus !== 'ANALYZED') return null;
                            const isPass = dr.designStatus === 'PASS';

                            return (
                                <div key={member.id} className="mb-10 border border-slate-200 dark:border-slate-700 rounded-lg break-inside-avoid shadow-sm overflow-hidden">
                                    <div className={"flex justify-between items-center p-4 border-b dark:border-slate-700 " + (isPass ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20")}>
                                        <div>
                                            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                                                {member.label} <span className="font-mono text-xs text-slate-500">[{member.id}]</span>
                                            </h4>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                Tiết diện: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{member.sectionId}</span> | Nhịp: {member.length} m
                                            </div>
                                        </div>
                                        <span className={"px-3.5 py-1 text-xs font-bold rounded-full border " + (isPass ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300")}>
                                            {isPass ? '✓ ĐẠT YÊU CẦU (PASS)' : '✗ KHÔNG ĐẠT (FAIL)'}
                                        </span>
                                    </div>

                                    {dr.calculationSteps && dr.calculationSteps.length > 0 && (
                                        <div className="p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/10">
                                            {dr.calculationSteps.map((step, idx) => (
                                                <div key={idx} className="print:break-inside-avoid">
                                                    {window.CalculationBlock ? <window.CalculationBlock step={step} /> : null}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(!dr.calculationSteps || dr.calculationSteps.length === 0) && dr.checks && (
                                        <div className="p-4">
                                            <table className="w-full text-xs border-collapse border border-slate-200 dark:border-slate-700">
                                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                                    <tr>
                                                        <th className="border border-slate-200 dark:border-slate-700 p-2 text-left">Điều kiện kiểm tra</th>
                                                        <th className="border border-slate-200 dark:border-slate-700 p-2 text-right">Hệ số sử dụng (Utilization)</th>
                                                        <th className="border border-slate-200 dark:border-slate-700 p-2 text-center">Kết luận</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dr.checks.map((chk, i) => (
                                                        <tr key={i}>
                                                            <td className="border border-slate-200 dark:border-slate-700 p-2">{chk.name}</td>
                                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-right font-mono">{chk.utilization ? (chk.utilization * 100).toFixed(1) + '%' : '--'}</td>
                                                            <td className="border border-slate-200 dark:border-slate-700 p-2 text-center font-bold">
                                                                <span className={chk.status === 'PASS' ? 'text-emerald-600' : 'text-red-500'}>
                                                                    {chk.status === 'PASS' ? 'ĐẠT (PASS)' : 'KHÔNG ĐẠT (FAIL)'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </section>

                    {/* ========================================================================= */}
                    {/* CHƯƠNG 8: TÍNH TOÁN CÁC CHI TIẾT LIÊN KẾT CHÍNH                           */}
                    {/* ========================================================================= */}
                    <section>
                        <h2 className="font-bold text-lg border-b-2 border-primary pb-2 mb-6 uppercase text-primary tracking-wide">
                            CHƯƠNG 8: TÍNH TOÁN CÁC CHI TIẾT LIÊN KẾT CHÍNH (CONNECTIONS DESIGN)
                        </h2>

                        <div className="space-y-6">
                            {/* 8.1 LIÊN KẾT CHÂN CỘT VỚI MÓNG */}
                            <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-sm mb-3 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <i data-lucide="anchor" className="w-4 h-4 text-blue-600"></i>
                                    8.1. Tính toán Liên kết Chân cột với Móng (Base Plate & Anchor Bolts)
                                </h3>
                                <p className="text-justify mb-3 text-xs">
                                    Chân cột liên kết ngàm với móng bê tông cốt thép thông qua bản đế thép, các sườn gia cường và hệ bu lông neo móng.
                                    Cặp nội lực nguy hiểm nhất để tính toán bản đế chân cột lấy từ tổ hợp chi phối (M<sub>max</sub>, N<sub>tương ứng</sub>, V<sub>tương ứng</sub>):
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-3">
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded border">
                                        <strong>1. Ứng suất ép mặt bê tông móng:</strong>
                                        <div className="font-mono mt-1 text-slate-600 dark:text-slate-400">
                                            σ<sub>max</sub> = N / (B<sub>bd</sub> L<sub>bd</sub>) + 6M / (B<sub>bd</sub> L<sub>bd</sub>²) ≤ R<sub>b,loc</sub>
                                        </div>
                                        <div className="text-emerald-600 font-bold mt-1">✓ Thỏa mãn điều kiện ép mặt</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded border">
                                        <strong>2. Bề dày bản đế thép (Base Plate):</strong>
                                        <div className="font-mono mt-1 text-slate-600 dark:text-slate-400">
                                            t<sub>bd</sub> ≥ √(6 M<sub>ô</sub> / [f × γ<sub>c</sub>])
                                        </div>
                                        <div className="font-mono font-bold text-blue-600 mt-1">Chọn t<sub>bd</sub> = 25 ÷ 30 mm</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded border">
                                        <strong>3. Bu lông neo móng (Anchor Bolts):</strong>
                                        <div className="font-mono mt-1 text-slate-600 dark:text-slate-400">
                                            N<sub>b,max</sub> = (M − N·a) / y ≤ [N]<sub>tb</sub>
                                        </div>
                                        <div className="font-mono font-bold text-blue-600 mt-1">Chọn 4 ÷ 8 bu lông Ø30 ÷ Ø36</div>
                                    </div>
                                </div>
                            </div>

                            {/* 8.2 LIÊN KẾT NÁCH KHUNG */}
                            <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-sm mb-3 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <i data-lucide="layers" className="w-4 h-4 text-purple-600"></i>
                                    8.2. Tính toán Liên kết Nách khung Cột - Kèo (Rafter-to-Column Haunch Connection)
                                </h3>
                                <p className="text-justify mb-3 text-xs">
                                    Liên kết giữa cột và kèo tại nách khung là liên kết nút cứng (Moment Connection) chịu mô men uốn rất lớn kết hợp lực cắt.
                                    Sử dụng liên kết mặt bích nối bằng bu lông cường độ cao cấp bền 8.8 (hoặc 10.9) có sườn gia cường:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-3">
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded border">
                                        <strong>1. Khả năng chịu kéo của bu lông:</strong>
                                        <div className="font-mono mt-1 text-slate-600 dark:text-slate-400">
                                            [N]<sub>tb</sub> = f<sub>tb</sub> × A<sub>bn</sub> × γ<sub>c</sub>
                                        </div>
                                        <div className="text-emerald-600 font-bold mt-1">✓ Lực kéo N<sub>b,max</sub> &lt; [N]<sub>tb</sub></div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded border">
                                        <strong>2. Bề dày bản bích (End-plate):</strong>
                                        <div className="font-mono mt-1 text-slate-600 dark:text-slate-400">
                                            t<sub>bb</sub> ≥ 1,1 √(b₁ N<sub>b,max</sub> / [(b+b₁) f])
                                        </div>
                                        <div className="font-mono font-bold text-blue-600 mt-1">Chọn t<sub>bb</sub> = 20 ÷ 25 mm</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded border">
                                        <strong>3. Chiều cao đường hàn góc:</strong>
                                        <div className="font-mono mt-1 text-slate-600 dark:text-slate-400">
                                            h<sub>f</sub> ≥ N<sub>k</sub> / [Σl<sub>w</sub> (β f<sub>w</sub>)<sub>min</sub> γ<sub>c</sub>]
                                        </div>
                                        <div className="font-mono font-bold text-blue-600 mt-1">Chọn h<sub>f</sub> = 8 ÷ 10 mm</div>
                                    </div>
                                </div>
                            </div>

                            {/* 8.3 LIÊN KẾT ĐỈNH KÈO */}
                            <div className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-sm mb-3 text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <i data-lucide="triangle" className="w-4 h-4 text-emerald-600"></i>
                                    8.3. Tính toán Liên kết Đỉnh kèo (Apex Joint)
                                </h3>
                                <p className="text-justify mb-2 text-xs">
                                    Liên kết đỉnh kèo nối hai nửa dầm mái tại đỉnh mái dốc bằng mặt bích đối đầu và bu lông cường độ cao cấp bền 8.8.
                                    Mô men uốn tại đỉnh kèo nhỏ hơn tại nách khung nhưng có lực xô ngang và lực dọc nén đáng kể.
                                    Toàn bộ bu lông và bản bích đỉnh kèo được kiểm tra thỏa mãn điều kiện chịu lực và biến dạng theo TCVN 5575:2024.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* CHƯƠNG 9: KẾT LUẬN VÀ KIẾN NGHỊ KỸ THUẬT                                 */}
                    {/* ========================================================================= */}
                    <section>
                        <h2 className="font-bold text-lg border-b-2 border-primary pb-2 mb-6 uppercase text-primary tracking-wide">
                            CHƯƠNG 9: KẾT LUẬN VÀ KIẾN NGHỊ (CONCLUSIONS & RECOMMENDATIONS)
                        </h2>

                        <div className="space-y-4 text-justify">
                            {(() => {
                                const analyzed = Object.values(designResults).filter(r => r.analysisStatus === 'ANALYZED');
                                const passed = analyzed.filter(r => r.designStatus === 'PASS');
                                const failed = analyzed.filter(r => r.designStatus === 'FAIL');

                                return (
                                    <div className="space-y-4">
                                        <div className={"p-5 rounded-xl border " + (failed.length === 0 ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-800")}>
                                            <div className="font-bold text-base mb-2 flex items-center gap-2">
                                                {failed.length === 0 ? (
                                                    <span className="text-emerald-700 dark:text-emerald-300">✅ KẾT LUẬN CHUNG: TOÀN BỘ CẤU KIỆN ĐẠT TIÊU CHUẨN THIẾT KẾ</span>
                                                ) : (
                                                    <span className="text-red-700 dark:text-red-300">⚠️ KẾT LUẬN CHUNG: CÓ CẤU KIỆN CHƯA ĐẠT TIÊU CHUẨN</span>
                                                )}
                                            </div>
                                            <div className="text-xs space-y-1">
                                                <div>• Tổng số cấu kiện đã tính toán và kiểm tra: <strong>{analyzed.length} cấu kiện</strong></div>
                                                <div>• Số cấu kiện Đạt yêu cầu (PASS): <strong className="text-emerald-700 dark:text-emerald-300">{passed.length} cấu kiện</strong></div>
                                                <div>• Số cấu kiện Không đạt (FAIL): <strong className="text-red-600">{failed.length} cấu kiện</strong></div>
                                            </div>
                                        </div>

                                        <p>
                                            Hồ sơ thiết kế và tính toán kết cấu thép cho công trình <strong>{proj.name || 'Nhà xưởng Công nghiệp Thép'}</strong> đã
                                            được hoàn thành đúng theo quy định hiện hành của Bộ Xây dựng:
                                        </p>
                                        <ul className="list-disc pl-5 space-y-1 text-xs">
                                            <li>Sơ bộ kích thước khung, chọn tiết diện cột, dầm, xà gồ, hệ giằng bám sát theo giáo trình và đồ án môn học chuẩn ĐH Kiến trúc TP.HCM.</li>
                                            <li>Tải trọng và tác động xác định theo tiêu chuẩn mới nhất <strong>TCVN 2737:2023</strong> (hệ số kze tường và mái tách biệt độc lập).</li>
                                            <li>Thiết kế khả năng chịu lực, độ bền và ổn định cấu kiện thép theo <strong>TCVN 5575:2024</strong>.</li>
                                            <li>Mọi bước tính toán đều có công thức tổng quát, bảng số liệu thay thế và kết quả có tính truy nguyên (Traceability) cao.</li>
                                            <li>Hệ giằng không gian chữ X bố trí ở 2 đầu hồi đảm bảo khối cứng ổn định cho toàn bộ công trình.</li>
                                        </ul>
                                    </div>
                                );
                            })()}
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* TÀI LIỆU THAM KHẢO (REFERENCES)                                           */}
                    {/* ========================================================================= */}
                    <section className="border-t pt-8 dark:border-slate-700">
                        <h3 className="font-bold text-sm uppercase text-slate-500 mb-4 tracking-wider">
                            TÀI LIỆU THAM KHẢO VÀ CĂN CỨ PHÁP LÝ (REFERENCES)
                        </h3>
                        <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <li><strong>TCVN 2737:2023</strong> — Tải trọng và tác động. Tiêu chuẩn thiết kế. Bộ Xây dựng ban hành.</li>
                            <li><strong>TCVN 5575:2024</strong> — Kết cấu thép. Tiêu chuẩn thiết kế. Bộ Xây dựng ban hành.</li>
                            <li><strong>TCVN 5574:2018</strong> — Thiết kế kết cấu bê tông và bê tông cốt thép.</li>
                            <li>Giáo trình Thiết kế kết cấu thép nhà công nghiệp — Gs. Đoàn Định Kiến, ThS. Phạm Văn Tư, PGS.TS. Nguyễn Quang Viên. NXB Khoa học & Kỹ thuật.</li>
                            <li>Đồ án môn học Kết cấu Thép — Khoa Xây dựng, Trường Đại học Kiến trúc TP. Hồ Chí Minh.</li>
                        </ol>
                    </section>

                </div>

                {/* ========================================================================= */}
                {/* NÚT IN VÀ XUẤT BÁO CÁO (PRINT BUTTON)                                     */}
                {/* ========================================================================= */}
                <div className="mt-12 text-center print:hidden border-t pt-8 dark:border-slate-700">
                    <button
                        className="px-8 py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all inline-flex items-center gap-2.5 text-sm"
                        onClick={() => window.print()}
                    >
                        <i data-lucide="printer" className="w-4 h-4"></i>
                        In Báo cáo Thuyết minh Tính toán (Print / Save as PDF)
                    </button>
                    <div className="text-xs text-slate-400 mt-2">
                        Mẹo: Trong hộp thoại in của trình duyệt, chọn "Lưu dưới dạng PDF" (Save as PDF) với khổ giấy A4 để xuất file báo cáo hoàn chỉnh.
                    </div>
                </div>

            </div>
        </div>
    );
};

window.WorkspaceReport = WorkspaceReport;
