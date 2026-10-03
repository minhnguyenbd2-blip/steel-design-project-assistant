// Section Checking Engine (TCVN 5575:2024)
// Kiểm tra khả năng chịu lực của cấu kiện Cột thép chịu nén uốn theo TCVN 5575:2024
// Đầy đủ: Độ bền nén uốn (CT 108), Cắt bản bụng, Ổn định trong MP (D.3), Ổn định ngoài MP (110-113), Ổn định cục bộ (Bảng 22, 24), Độ mảnh (Bảng 25)

function checkSectionCapacity(section, N_kN, M_kNm, V_kN, materialProps, L0x_m, L0y_m) {
    var steps = [];
    var isAllPass = true;
    var failureReason = "";

    var isTension = N_kN < 0;
    var isPureBending = N_kN === 0;
    var isCompression = N_kN > 0;

    var N_abs = Math.abs(N_kN) * 1000; // kN -> N
    var M = Math.abs(M_kNm) * 1e6;    // kNm -> N.mm
    var V = Math.abs(V_kN) * 1000;    // kN -> N

    var L0x = L0x_m * 1000; // m -> mm
    var L0y = L0y_m * 1000; // m -> mm

    // Sử dụng cường độ chính xác từ TCVN 5575:2024 nếu có
    var f, fv, gamma_c, E;
    if (materialProps) {
        f = materialProps.f || 230;
        fv = materialProps.fv || 133;
        gamma_c = materialProps.gamma_c || 1.0;
        E = materialProps.E || 2.06e5;
    } else {
        f = 230; fv = 133; gamma_c = 1.0; E = 2.06e5;
    }
    var f_allow = f * gamma_c;      // = f (khi gamma_c = 1)
    var fv_allow = fv * gamma_c;    // = fv

    // ─────────────────────────────────────────────────────────────────────────────
    // BƯỚC 1: KIỂM TRA ĐỘ MẢNH (Slenderness Check)
    // TCVN 5575:2024, Mục 10.3.1, Bảng 25 (nén), Bảng 26 (kéo)
    // ─────────────────────────────────────────────────────────────────────────────
    var lambda_x = L0x / section.ix;
    var lambda_y = L0y / section.iy;
    var lambda_max = Math.max(lambda_x, lambda_y);
    var lambda_limit = isTension ? 300 : 180; // Bảng 25 (nén, cột khung), Bảng 26 (kéo)
    var isPassSlenderness = lambda_max <= lambda_limit;
    if (!isPassSlenderness) {
        isAllPass = false;
        failureReason = "Vượt quá giới hạn độ mảnh (λ_max = " + lambda_max.toFixed(1) + " > [λ] = " + lambda_limit + ")";
    }

    // Độ mảnh quy ước (lambda_bar) cần cho tất cả các bước ổn định sau
    var lambda_bar_x = lambda_x * Math.sqrt(f / E);
    var lambda_bar_y = lambda_y * Math.sqrt(f / E);

    steps.push(createCalculationStep(
        "CALC-SEC-000",
        "Kiểm tra Độ mảnh (" + (isTension ? 'Cấu kiện chịu Kéo - Bảng 26' : 'Cấu kiện chịu Nén - Bảng 25') + ")",
        { standard: 'TCVN 5575:2024', section: 'Mục 10.3.1', table: isTension ? 'Bảng 26' : 'Bảng 25' },
        "\\lambda = \\frac{L_0}{i} \\le [\\lambda] = " + lambda_limit,
        "\\lambda_x = \\frac{" + L0x.toFixed(0) + "}{" + section.ix.toFixed(1) + "} = " + lambda_x.toFixed(1) + "; \\quad \\lambda_y = \\frac{" + L0y.toFixed(0) + "}{" + section.iy.toFixed(1) + "} = " + lambda_y.toFixed(1) + " \\Rightarrow \\lambda_{max} = " + lambda_max.toFixed(1),
        Number(lambda_max.toFixed(1)),
        "",
        {
            conditionLaTeX: "\\lambda_{max} = " + lambda_max.toFixed(1) + " \\le [\\lambda] = " + lambda_limit,
            isPass: isPassSlenderness
        },
        "Ý NGHĨA KÝ HIỆU:\n" +
        "• L_{0x} = " + L0x_m.toFixed(2) + " m = " + L0x.toFixed(0) + " mm: Chiều dài tính toán trong mặt phẳng khung = L_cột × μ_x\n" +
        "• L_{0y} = " + L0y_m.toFixed(2) + " m = " + L0y.toFixed(0) + " mm: Chiều dài tính toán ngoài mặt phẳng khung = L_cột × μ_y\n" +
        "• i_x = " + section.ix.toFixed(1) + " mm, i_y = " + section.iy.toFixed(1) + " mm: Bán kính quán tính của tiết diện (i = √(I/A))\n" +
        "• [λ] = " + lambda_limit + ": Giới hạn độ mảnh lớn nhất theo " + (isTension ? 'TCVN 5575:2024 Bảng 26 (kéo)' : 'TCVN 5575:2024 Bảng 25 (nén, cột khung chính nhà công nghiệp 1 tầng)')+
        "\n• λ̄_x = λ_x·√(f/E) = " + lambda_bar_x.toFixed(3) + "; λ̄_y = λ_y·√(f/E) = " + lambda_bar_y.toFixed(3) + " (Độ mảnh quy ước - dùng cho các bước kiểm tra ổn định tiếp theo)"
    ));
    
    // ─────────────────────────────────────────────────────────────────────────────
    // BƯỚC 2: KIỂM TRA ĐỘ BỀN TIẾT DIỆN (Cross-section Strength)
    // TCVN 5575:2024, Mục 9.2.1 - Công thức (108): N/A_n + M_x/W_xn ≤ f·γ_c
    // ─────────────────────────────────────────────────────────────────────────────
    // Lưu ý: Với tiết diện I đối xứng, A_n ≈ A (bỏ qua lỗ bu lông) và W_xn ≈ W_x
    // Đây là kiểm tra điều kiện bền tiết diện (không phải ổn định)
    var sigma = (N_abs / section.A) + (M / section.Wx);
    var isPassSigma = sigma <= f_allow;
    if (!isPassSigma) {
        isAllPass = false;
        if (!failureReason) failureReason = "Không đạt độ bền tiết diện " + (isTension ? 'kéo uốn' : 'nén uốn') + " (σ > f·γ_c)";
    }

    steps.push(createCalculationStep(
        "CALC-SEC-001",
        "Kiểm tra Bền Tiết diện " + (isTension ? 'Kéo uốn (CT 104)' : 'Nén uốn (CT 108)'),
        { standard: 'TCVN 5575:2024', section: isTension ? 'Mục 9.1.1, CT 104' : 'Mục 9.2.1, CT 108', formula: isTension ? 'CT (104)' : 'CT (108)' },
        "\\sigma = \\frac{|N|}{A_n} + \\frac{M_x}{W_{xn}} \\le f \\cdot \\gamma_c",
        "\\sigma = \\frac{" + N_abs.toFixed(0) + "}{" + section.A.toFixed(1) + "} + \\frac{" + M.toFixed(0) + "}{" + section.Wx.toFixed(1) + "} = " + sigma.toFixed(2) + "\\text{ N/mm}^2",
        Number(sigma.toFixed(2)),
        "MPa",
        {
            conditionLaTeX: "\\sigma = " + sigma.toFixed(2) + " \\le f \\cdot \\gamma_c = " + f_allow.toFixed(1) + "\\text{ MPa}",
            isPass: isPassSigma
        },
        "CÔNG THỨC & Ý NGHĨA KÝ HIỆU:\n" +
        "• N = " + N_kN.toFixed(1) + " kN = " + N_abs.toFixed(0) + " N: Lực dọc tính toán lớn nhất (" + (isTension ? 'Kéo (N<0)' : isCompression ? 'Nén (N>0)' : 'Không có lực dọc') + ")\n" +
        "• M_x = " + M_kNm.toFixed(2) + " kNm = " + M.toFixed(0) + " N·mm: Mô men uốn tính toán trong mặt phẳng khung\n" +
        "• A_n = " + section.A.toFixed(1) + " mm²: Diện tích tiết diện ngang tính toán (A_n ≈ A = 2·b·t_f + h_w·t_w)\n" +
        "• W_{xn} = " + section.Wx.toFixed(1) + " mm³: Mô men kháng uốn tính toán (W_xn ≈ W_x = I_x / (h/2))\n" +
        "• f = " + f + " MPa: Cường độ tính toán chịu kéo/nén của thép " + (materialProps ? (materialProps.steelGrade || 'S235') : 'S235') + " theo TCVN 5575:2024 Bảng 2\n" +
        "• γ_c = " + gamma_c + ": Hệ số điều kiện làm việc của kết cấu (Bảng 4 TCVN 5575:2024)"
    ));

    // ─────────────────────────────────────────────────────────────────────────────
    // BƯỚC 3: KIỂM TRA CẮT BẢN BỤNG (Web Shear)
    // TCVN 5575:2024, Mục 9.2.2 - τ = V / A_w ≤ fv·γ_c
    // A_w = h_w × t_w (diện tích bản bụng, bỏ qua đóng góp của bản cánh)
    // ─────────────────────────────────────────────────────────────────────────────
    var Aw = section.hw * section.tw;   // mm²
    var tau = V / Aw;                    // N/mm² = MPa
    var isPassTau = tau <= fv_allow;
    if (!isPassTau) {
        isAllPass = false;
        if (!failureReason) failureReason = "Không đạt điều kiện bền cắt bản bụng (τ > fv·γ_c)";
    }

    steps.push(createCalculationStep(
        "CALC-SEC-002",
        "Kiểm tra Cắt Bản bụng (Web Shear)",
        { standard: 'TCVN 5575:2024', section: 'Mục 9.2.2, CT (109)' },
        "\\tau = \\frac{V}{A_w} = \\frac{V}{h_w \\cdot t_w} \\le f_v \\cdot \\gamma_c",
        "\\tau = \\frac{" + V.toFixed(0) + "}{" + section.hw.toFixed(1) + " \\times " + section.tw.toFixed(1) + "} = \\frac{" + V.toFixed(0) + "}{" + Aw.toFixed(1) + "} = " + tau.toFixed(2) + "\\text{ MPa}",
        Number(tau.toFixed(2)),
        "MPa",
        {
            conditionLaTeX: "\\tau = " + tau.toFixed(2) + " \\le f_v \\cdot \\gamma_c = " + fv_allow.toFixed(1) + "\\text{ MPa}",
            isPass: isPassTau
        },
        "Ý NGHĨA KÝ HIỆU:\n" +
        "• V = " + V_kN.toFixed(1) + " kN = " + V.toFixed(0) + " N: Lực cắt tính toán lớn nhất (tại gối tựa)\n" +
        "• h_w = " + section.hw.toFixed(1) + " mm: Chiều cao thông thủy bản bụng (h_w = h - 2·t_f = " + section.h + " - 2×" + section.tf + ")\n" +
        "• t_w = " + section.tw.toFixed(1) + " mm: Chiều dày bản bụng\n" +
        "• A_w = h_w × t_w = " + Aw.toFixed(1) + " mm²: Diện tích bản bụng chịu cắt\n" +
        "• f_v = " + fv + " MPa: Cường độ tính toán chịu cắt (f_v = 0,58·f theo Mục 6.1.3 TCVN 5575:2024)"
    ));

    // ─────────────────────────────────────────────────────────────────────────────
    // BƯỚC 4: ỔN ĐỊNH TỔNG THỂ TRONG MẶT PHẲNG (In-plane Buckling)
    // TCVN 5575:2024, Mục 9.2.3 - N / (φ_e·A) ≤ f·γ_c
    // φ_e = f(λ̄_x, m_x) tra Bảng D.3 (Phụ lục D)
    // ─────────────────────────────────────────────────────────────────────────────
    // Độ lệch tâm quy ước m_x = (e_x·A) / W_c (e_x = M/N, với N > 0 - nén)
    var Wc = section.Wx;  // W cánh nén = Wx (tiết diện đối xứng)
    var e_x_mm = (N_abs > 0) ? (M / N_abs) : 0;  // e_x = M_x / N (mm)
    var m_x = (N_abs > 0) ? (e_x_mm * section.A / Wc) : 999.0; // m_x = e_x·A/W_c

    var sigma_in_plane = 0;
    var isPassInPlane = true;
    var phi_e = 1.0;

    if (isCompression) {
        var phi_e_res = StandardData.TCVN5575_2024.PhiE.getPhiE(lambda_bar_x, m_x);
        phi_e = phi_e_res.value;
        sigma_in_plane = N_abs / (phi_e * section.A);
        isPassInPlane = sigma_in_plane <= f_allow;
        if (!isPassInPlane) {
            isAllPass = false;
            if (!failureReason) failureReason = "Mất ổn định tổng thể trong mặt phẳng khung (σ_in > f·γ_c)";
        }
        
        steps.push(createCalculationStep(
            "CALC-SEC-003",
            "Ổn định Tổng thể Trong mặt phẳng uốn (In-plane Buckling)",
            { standard: 'TCVN 5575:2024', section: 'Mục 9.2.3', table: 'Bảng D.3 (Phụ lục D)', formula: 'CT (107)' },
            "\\frac{N}{\\varphi_e \\cdot A} \\le f \\cdot \\gamma_c",
            "\\frac{" + N_abs.toFixed(0) + "}{" + phi_e.toFixed(3) + " \\times " + section.A.toFixed(1) + "} = " + sigma_in_plane.toFixed(2) + "\\text{ MPa}",
            Number(sigma_in_plane.toFixed(2)),
            "MPa",
            {
                conditionLaTeX: "\\sigma_{in} = " + sigma_in_plane.toFixed(2) + " \\le f \\cdot \\gamma_c = " + f_allow.toFixed(1) + "\\text{ MPa}",
                isPass: isPassInPlane
            },
            "Ý NGHĨA KÝ HIỆU & HỆ SỐ TRA BẢNG:\n" +
            "• e_x = M_x / N = " + e_x_mm.toFixed(1) + " mm: Độ lệch tâm trong mặt phẳng uốn\n" +
            "• m_x = e_x · A / W_c = " + e_x_mm.toFixed(1) + " × " + section.A.toFixed(1) + " / " + Wc.toFixed(1) + " = " + m_x.toFixed(2) + ": Độ lệch tâm quy ước\n" +
            "• λ̄_x = λ_x·√(f/E) = " + lambda_x.toFixed(1) + "·√(" + f + "/" + E/1000 + "×10³) = " + lambda_bar_x.toFixed(3) + ": Độ mảnh quy ước trong MP khung\n" +
            "• φ_e = " + phi_e.toFixed(3) + ": Hệ số uốn dọc lệch tâm, tra Bảng D.3 TCVN 5575:2024 với (λ̄_x=" + lambda_bar_x.toFixed(2) + ", m_x=" + m_x.toFixed(2) + ") bằng nội suy 2 chiều song tuyến"
        ));
    } else {
        steps.push(createCalculationStep(
            "CALC-SEC-003",
            "Ổn định Tổng thể Trong mặt phẳng (" + (isTension ? 'Cấu kiện Kéo uốn' : 'Uốn thuần túy') + ")",
            { standard: 'TCVN 5575:2024', section: 'Mục 9.1' },
            "\\text{Cấu kiện chịu kéo hoặc uốn thuần túy: Không xét mất ổn định uốn dọc nén}",
            isTension ? 
                "N = " + N_kN.toFixed(1) + "\\text{ kN} < 0 \\Rightarrow \\text{Kéo uốn: Tự nhiên ổn định về phía nén}" :
                "N = 0\\text{ kN} \\Rightarrow \\text{Uốn thuần túy: Kiểm tra ổn định tổng thể dầm (CT 90)}",
            0, "MPa", { isPass: true },
            "Lý do: " + (isTension ? 
                "Lực dọc N < 0 (kéo) → Không xảy ra mất ổn định uốn dọc trong mặt phẳng (TCVN 5575:2024 Mục 9.1)." :
                "N = 0 kN: Không có lực nén dọc gây mất ổn định uốn dọc trong mặt phẳng.")
        ));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // BƯỚC 5: ỔN ĐỊNH TỔNG THỂ NGOÀI MẶT PHẲNG (Out-of-plane Buckling)
    // TCVN 5575:2024, Mục 9.2.4 & 9.2.5 - N / (c·φ_y·A) ≤ f·γ_c
    // φ_y = hệ số ổn định theo Bảng 7 (đường cong b), c = hệ số ảnh hưởng mô men uốn CT 111-113
    // ─────────────────────────────────────────────────────────────────────────────
    var sigma_out_plane = 0;
    var isPassOutPlane = true;
    var phi_y = 1.0;
    var c_factor = 1.0;

    if (isCompression) {
        // phi_y theo TCVN 5575:2024 Mục 7.1.2.1 (đường cong b cho I tổ hợp đối xứng)
        var phi_y_raw = (typeof TCVN5575_2024 !== 'undefined' && TCVN5575_2024.getPhi) ?
            TCVN5575_2024.getPhi(lambda_bar_y, 'b') :
            (lambda_bar_y < 0.6 ? 1.0 : Math.max(0.01, 7.6 / (lambda_bar_y * lambda_bar_y)));
        phi_y = Number(Math.max(0.01, Math.min(1.0, Number(phi_y_raw))).toFixed(4));
        
        // Hệ số c theo Mục 9.2.5, CT 111-113 (phụ thuộc m_x và phi_y)
        var c_res = StandardData.TCVN5575_2024.C_Factor.getC(m_x, lambda_bar_y, phi_y, 1.0);
        c_factor = c_res.value;

        sigma_out_plane = N_abs / (c_factor * phi_y * section.A);
        isPassOutPlane = sigma_out_plane <= f_allow;
        if (!isPassOutPlane) {
            isAllPass = false;
            if (!failureReason) failureReason = "Mất ổn định tổng thể ngoài mặt phẳng khung (σ_out > f·γ_c)";
        }
        
        steps.push(createCalculationStep(
            "CALC-SEC-004",
            "Ổn định Tổng thể Ngoài mặt phẳng uốn (Out-of-plane Buckling)",
            { standard: 'TCVN 5575:2024', section: 'Mục 9.2.4 & 9.2.5', table: 'Bảng 7 (φ_y)', formula: 'CT (110)-(113)' },
            "\\frac{N}{c \\cdot \\varphi_y \\cdot A} \\le f \\cdot \\gamma_c",
            "\\frac{" + N_abs.toFixed(0) + "}{" + c_factor.toFixed(3) + " \\times " + phi_y.toFixed(3) + " \\times " + section.A.toFixed(1) + "} = " + sigma_out_plane.toFixed(2) + "\\text{ MPa}",
            Number(sigma_out_plane.toFixed(2)),
            "MPa",
            {
                conditionLaTeX: "\\sigma_{out} = " + sigma_out_plane.toFixed(2) + " \\le f \\cdot \\gamma_c = " + f_allow.toFixed(1) + "\\text{ MPa}",
                isPass: isPassOutPlane
            },
            "Ý NGHĨA KÝ HIỆU & HỆ SỐ TRA BẢNG:\n" +
            "• λ̄_y = λ_y·√(f/E) = " + lambda_y.toFixed(1) + "·√(" + f + "/" + (E/1000).toFixed(0) + "×10³) = " + lambda_bar_y.toFixed(3) + ": Độ mảnh quy ước ngoài MP khung\n" +
            "• φ_y = " + phi_y.toFixed(3) + ": Hệ số ổn định nén đúng tâm ngoài MP theo CT (7)&(8) và Bảng 7 TCVN 5575:2024 (đường cong b - I tổ hợp đối xứng)\n" +
            "• m_x = " + m_x.toFixed(2) + ": Độ lệch tâm quy ước (đã tính ở Bước 4)\n" +
            "• c = " + c_factor.toFixed(3) + ": Hệ số xét ảnh hưởng của mô men uốn ngoài MP theo Mục 9.2.5, " + c_res.formula + " TCVN 5575:2024"
        ));
    } else {
        steps.push(createCalculationStep(
            "CALC-SEC-004",
            "Ổn định Tổng thể Ngoài mặt phẳng (" + (isTension ? 'Cấu kiện Kéo uốn' : 'Uốn thuần túy') + ")",
            { standard: 'TCVN 5575:2024', section: 'Mục 9.1' },
            "\\text{Không xét ổn định uốn dọc nén khi N ≤ 0}",
            isTension ? 
                "N = " + N_kN.toFixed(1) + "\\text{ kN} < 0 \\Rightarrow \\text{Kéo uốn ngoài MP: Tự ổn định}" :
                "N = 0\\text{ kN} \\Rightarrow \\text{Không có lực nén gây mất ổn định ngoài MP}",
            0, "MPa", { isPass: true },
            "Lý do: N ≤ 0 → Không xảy ra mất ổn định uốn dọc nén ngoài mặt phẳng khung."
        ));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // BƯỚC 6: ỔN ĐỊNH CỤC BỘ BẢN CÁNH (Local Buckling - Flange)
    // TCVN 5575:2024, Mục 9.4.7, Bảng 24
    // [λ̄_uf] phụ thuộc m_x (độ lệch tâm quy ước): m_x ≤ 1: 0.36+0.10m_x; m_x > 1: 0.60-0.12m_x (nhưng ≥ 0.36)
    // ─────────────────────────────────────────────────────────────────────────────
    var bef = (section.b - section.tw) / 2;   // Độ vươn tự do bản cánh (mm)
    var lambda_f = bef / section.tf;           // Độ mảnh hình học bản cánh
    var lambda_bar_f = lambda_f * Math.sqrt(f / E); // Độ mảnh quy ước

    // Giới hạn [λ̄_uf] theo Bảng 24 TCVN 5575:2024 (xét ảnh hưởng lệch tâm m_x)
    var lambda_bar_uf;
    if (m_x <= 1.0) {
        lambda_bar_uf = 0.36 + 0.10 * m_x;   // Tăng dần từ 0.36 đến 0.46 khi m_x từ 0 đến 1
    } else if (m_x > 1.0 && m_x <= 4.0) {
        lambda_bar_uf = 0.60 - 0.12 * (m_x - 1.0) / 3.0 * 2;  // Giảm dần theo m_x
        lambda_bar_uf = Math.max(0.36, lambda_bar_uf);
    } else {
        lambda_bar_uf = 0.36;   // Giới hạn tối thiểu khi m_x lớn
    }
    
    var hasCompressionFlange = isCompression || (isPureBending && M > 0);
    var isPassLocalFlange = !hasCompressionFlange || (lambda_bar_f <= lambda_bar_uf);
    if (!isPassLocalFlange) {
        isAllPass = false;
        if (!failureReason) failureReason = "Mất ổn định cục bộ bản cánh nén (λ̄_f > [λ̄_uf])";
    }

    steps.push(createCalculationStep(
        "CALC-SEC-005",
        "Ổn định cục bộ phần vươn Bản cánh nén",
        { standard: 'TCVN 5575:2024', section: 'Mục 9.4.7', table: 'Bảng 24' },
        "\\bar{\\lambda}_f = \\frac{b_{ef}}{t_f} \\sqrt{\\frac{f}{E}} \\le [\\bar{\\lambda}_{uf}]",
        "b_{ef} = \\frac{b - t_w}{2} = \\frac{" + section.b + " - " + section.tw + "}{2} = " + bef.toFixed(1) + "\\text{ mm}; \\quad \\bar{\\lambda}_f = \\frac{" + bef.toFixed(1) + "}{" + section.tf + "} \\sqrt{\\frac{" + f + "}{" + E + "}} = " + lambda_bar_f.toFixed(3),
        Number(lambda_bar_f.toFixed(3)), "",
        { isPass: isPassLocalFlange },
        "Ý NGHĨA KÝ HIỆU:\n" +
        "• b_ef = " + bef.toFixed(1) + " mm: Độ vươn tự do bản cánh (b_ef = (b - t_w)/2)\n" +
        "• t_f = " + section.tf + " mm: Chiều dày bản cánh\n" +
        "• [λ̄_uf] = " + lambda_bar_uf.toFixed(2) + ": Giới hạn quy ước bản cánh nén theo Bảng 24 TCVN 5575:2024 (phụ thuộc m_x = " + m_x.toFixed(2) + ")\n" +
        "• Giá trị λ̄_f = " + lambda_bar_f.toFixed(3) + " " + (isPassLocalFlange ? "≤" : ">") + " [λ̄_uf] = " + lambda_bar_uf.toFixed(2) + " → " + (isPassLocalFlange ? "Đạt" : "Không đạt - Cần tăng chiều dày bản cánh")
    ));

    // ─────────────────────────────────────────────────────────────────────────────
    // BƯỚC 7: ỔN ĐỊNH CỤC BỘ BẢN BỤNG (Local Buckling - Web)
    // TCVN 5575:2024, Mục 9.4.2, Bảng 22
    // [λ̄_uw] = 2.3 + 0.9·m_x (khi m_x ≤ 2,0) hoặc 3.8 - 0.15·m_x (khi m_x > 2,0; ≤ 3,5 tối đa)
    // ─────────────────────────────────────────────────────────────────────────────
    var lambda_w = section.hw / section.tw;
    var lambda_bar_w = lambda_w * Math.sqrt(f / E);

    // Bảng 22 TCVN 5575:2024 - [λ̄_uw] phụ thuộc m_x (cột nén lệch tâm)
    var lambda_bar_uw;
    if (m_x <= 2.0) {
        lambda_bar_uw = 2.3 + 0.9 * m_x;   // Từ 2.3 (m_x=0 - nén đúng tâm) đến 4.1 (m_x=2)
    } else {
        lambda_bar_uw = 3.8 - 0.15 * (m_x - 2.0);  // Giảm nhẹ khi m_x > 2
        lambda_bar_uw = Math.max(2.5, Math.min(4.0, lambda_bar_uw)); // Giới hạn trong [2.5, 4.0]
    }

    var isPassLocalWeb = !hasCompressionFlange || (lambda_bar_w <= lambda_bar_uw);
    if (!isPassLocalWeb) {
        isAllPass = false;
        if (!failureReason) failureReason = "Mất ổn định cục bộ bản bụng cột (λ̄_w > [λ̄_uw])";
    }

    steps.push(createCalculationStep(
        "CALC-SEC-006",
        "Ổn định cục bộ Bản bụng cột",
        { standard: 'TCVN 5575:2024', section: 'Mục 9.4.2', table: 'Bảng 22' },
        "\\bar{\\lambda}_w = \\frac{h_w}{t_w} \\sqrt{\\frac{f}{E}} \\le [\\bar{\\lambda}_{uw}]",
        "\\bar{\\lambda}_w = \\frac{" + section.hw.toFixed(1) + "}{" + section.tw + "} \\sqrt{\\frac{" + f + "}{" + E + "}} = " + lambda_bar_w.toFixed(3) + " \\le [\\bar{\\lambda}_{uw}] = " + lambda_bar_uw.toFixed(2),
        Number(lambda_bar_w.toFixed(3)), "",
        { isPass: isPassLocalWeb },
        "Ý NGHĨA KÝ HIỆU:\n" +
        "• h_w = " + section.hw.toFixed(1) + " mm: Chiều cao thông thủy bản bụng\n" +
        "• t_w = " + section.tw + " mm: Chiều dày bản bụng\n" +
        "• λ_w = h_w/t_w = " + lambda_w.toFixed(1) + ": Độ mảnh hình học bản bụng\n" +
        "• [λ̄_uw] = " + lambda_bar_uw.toFixed(2) + ": Giới hạn độ mảnh quy ước bản bụng theo Bảng 22 TCVN 5575:2024 (phụ thuộc m_x = " + m_x.toFixed(2) + ")\n" +
        "• Khi m_x = " + m_x.toFixed(2) + " " + (m_x <= 2.0 ? "≤ 2: [λ̄_uw] = 2,3 + 0,9·m_x" : "> 2: [λ̄_uw] = 3,8 - 0,15·(m_x-2)") + " = " + lambda_bar_uw.toFixed(2)
    ));

    // ─────────────────────────────────────────────────────────────────────────────
    // TỈ LỆ TẬN DỤNG KHẢ NĂNG CHỊU LỰC (Utilization Ratios)
    // ─────────────────────────────────────────────────────────────────────────────
    var util_strength = Number((sigma / f_allow).toFixed(3));
    var util_shear = Number((tau / fv_allow).toFixed(3));
    var util_in_plane = isCompression ? Number((sigma_in_plane / f_allow).toFixed(3)) : 0;
    var util_out_plane = isCompression ? Number((sigma_out_plane / f_allow).toFixed(3)) : 0;
    var util_slenderness = Number((lambda_max / lambda_limit).toFixed(3));
    var util_local_flange = Number((lambda_bar_f / lambda_bar_uf).toFixed(3));
    var util_local_web = Number((lambda_bar_w / lambda_bar_uw).toFixed(3));
    var util_max = Math.max(util_strength, util_shear, util_in_plane, util_out_plane, util_slenderness);

    return {
        steps,
        success: true,
        isAllPass,
        failureReason,
        isTension,
        isCompression,
        utilization: {
            strength: util_strength,
            shear: util_shear,
            inPlane: util_in_plane,
            outPlane: util_out_plane,
            slenderness: util_slenderness,
            localFlange: util_local_flange,
            localWeb: util_local_web,
            max: util_max
        },
        slenderness: {
            lambda_x: Number(lambda_x.toFixed(1)),
            lambda_y: Number(lambda_y.toFixed(1)),
            lambda_max: Number(lambda_max.toFixed(1)),
            limit: lambda_limit,
            isPass: isPassSlenderness
        },
        internalForces: {
            N_kN, M_kNm, V_kN,
            e_x_mm: Number(e_x_mm.toFixed(1)),
            m_x: Number(m_x.toFixed(3))
        }
    };
}

var globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
globalScope.checkSectionCapacity = checkSectionCapacity;
