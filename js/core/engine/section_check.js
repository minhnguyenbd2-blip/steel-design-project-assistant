// Section Checking Engine (TCVN 5575:2024)
// Kiểm tra khả năng chịu lực của cấu kiện Cột thép chịu nén uốn theo TCVN 5575:2024
// Đầy đủ: Độ bền nén uốn (108), Cắt bản bụng, Ổn định trong MP (D.3), Ổn định ngoài MP (110-113), Ổn định cục bộ (Bảng 22, 24), Độ mảnh (Bảng 25)

function checkSectionCapacity(section, N_kN, M_kNm, V_kN, materialProps, L0x_m, L0y_m) {
    const steps = [];
    let isAllPass = true;
    let failureReason = "";

    const isTension = N_kN < 0;
    const isPureBending = N_kN === 0;
    const isCompression = N_kN > 0;

    const N_abs = Math.abs(N_kN) * 1000; // Đổi kN -> N (giá trị độ lớn)
    const N_signed = Number(N_kN) * 1000;
    const M = Math.abs(M_kNm) * 1e6; // Đổi kNm -> N.mm
    const V = Math.abs(V_kN) * 1000; // Đổi kN -> N

    const L0x = L0x_m * 1000; // mm
    const L0y = L0y_m * 1000; // mm

    const { f, fv, gamma_c, E } = materialProps;
    const f_allow = f * gamma_c;
    const fv_allow = fv * gamma_c;

    // ================= 1. KIỂM TRA ĐỘ MẢNH CỘT (TCVN 5575:2024) =================
    // Bảng 25 cho nén ([λ] = 180), Bảng 26 cho kéo ([λ] = 300)
    const lambda_x = L0x / section.ix;
    const lambda_y = L0y / section.iy;
    const lambda_max = Math.max(lambda_x, lambda_y);
    const lambda_limit = isTension ? 300 : 180;
    const isPassSlenderness = lambda_max <= lambda_limit;
    if (!isPassSlenderness) {
        isAllPass = false;
        failureReason = `Vượt quá độ mảnh giới hạn cho phép (λ_max = ${lambda_max.toFixed(1)} > [λ] = ${lambda_limit})`;
    }

    steps.push(createCalculationStep(
        "CALC-SEC-000",
        `Kiểm tra độ mảnh của cột (${isTension ? 'Cấu kiện chịu kéo - Bảng 26' : 'Cấu kiện chịu nén - Bảng 25'})`,
        { standard: 'TCVN 5575:2024', section: 'Mục 10.3', table: isTension ? 'Bảng 26' : 'Bảng 25' },
        `\\lambda = \\frac{L_0}{i} \\le [\\lambda] = ${lambda_limit}`,
        `\\lambda_x = \\frac{${L0x.toFixed(0)}}{${section.ix.toFixed(1)}} = ${lambda_x.toFixed(1)}; \\quad \\lambda_y = \\frac{${L0y.toFixed(0)}}{${section.iy.toFixed(1)}} = ${lambda_y.toFixed(1)} \\implies \\lambda_{max} = ${lambda_max.toFixed(1)} \\le ${lambda_limit}`,
        Number(lambda_max.toFixed(1)),
        "",
        {
            conditionLaTeX: `\\lambda_{max} = ${lambda_max.toFixed(1)} \\le [\\lambda] = ${lambda_limit}`,
            isPass: isPassSlenderness
        },
        "Ý NGHĨA KÝ HIỆU:\n" +
        `• L_{0x} = ${L0x_m} m, L_{0y} = ${L0y_m} m: Chiều dài tính toán trong và ngoài mặt phẳng khung\n` +
        `• i_x = ${section.ix.toFixed(1)} mm, i_y = ${section.iy.toFixed(1)} mm: Bán kính quán tính của tiết diện\n` +
        `• [λ] = ${lambda_limit}: Giới hạn độ mảnh lớn nhất (${isTension ? 'TCVN 5575:2024 Bảng 26 cho cấu kiện chịu kéo' : 'TCVN 5575:2024 Bảng 25 cho cột chịu nén'})`
    ));
    
    // ================= 2. KIỂM TRA ĐỘ BỀN (TCVN 5575:2024 Mục 9.1 & 9.2) =================
    const sigma = (N_abs / section.A) + (M / section.Wx);
    const isPassSigma = sigma <= f_allow;
    if (!isPassSigma) {
        isAllPass = false;
        if (!failureReason) failureReason = `Không đạt điều kiện bền ${isTension ? 'kéo uốn' : 'nén uốn'} (σ > f·γc)`;
    }

    steps.push(createCalculationStep(
        "CALC-SEC-001",
        `Kiểm tra ứng suất pháp bền (${isTension ? 'Kéo uốn - Mục 9.1 CT 104' : 'Nén uốn - Mục 9.2.2 CT 108'})`,
        { standard: 'TCVN 5575:2024', section: isTension ? 'Mục 9.1' : 'Mục 9.2.2', formula: isTension ? 'Công thức (104)' : 'Công thức (108)' },
        "\\sigma = \\frac{|N|}{A_n} + \\frac{M}{W_{xn}} \\le f \\cdot \\gamma_c",
        `\\sigma = \\frac{${N_abs.toFixed(0)}}{${section.A.toFixed(1)}} + \\frac{${M.toFixed(0)}}{${section.Wx.toFixed(1)}} = ${sigma.toFixed(2)}\\text{ MPa}`,
        Number(sigma.toFixed(2)),
        "MPa",
        {
            conditionLaTeX: `\\sigma = ${sigma.toFixed(2)} \\le f \\gamma_c = ${f_allow.toFixed(2)}\\text{ MPa}`,
            isPass: isPassSigma
        },
        "Ý NGHĨA KÝ HIỆU:\n" +
        `• N = ${N_kN} kN: Lực dọc tính toán (${isTension ? 'Kéo do bốc gió nhổ móng' : (isCompression ? 'Nén' : 'Uốn thuần túy')})\n` +
        `• M = ${M_kNm} kNm: Mô men uốn tính toán trong mặt phẳng khung (N.mm)\n` +
        "• A: Diện tích tiết diện ngang của cột (mm²)\n" +
        "• W_x: Mô men kháng uốn của tiết diện đối với trục uốn chính x-x (mm³)\n" +
        "• f: Cường độ tính toán chịu kéo/nén của thép (f = " + f + " MPa)\n" +
        "• γ_c = " + gamma_c + ": Hệ số điều kiện làm việc của kết cấu"
    ));

    // ================= 3. KIỂM TRA ỨNG SUẤT TIẾP (Cắt bản bụng) =================
    const Aw = section.hw * section.tw;
    const tau = V / Aw; 
    const isPassTau = tau <= fv_allow;
    if (!isPassTau) {
        isAllPass = false;
        if (!failureReason) failureReason = "Không đạt điều kiện bền cắt (τ > fv·γc)";
    }

    steps.push(createCalculationStep(
        "CALC-SEC-002",
        "Kiểm tra ứng suất tiếp (Cắt bản bụng)",
        { standard: 'TCVN 5575:2024', section: 'Mục 9.2.2' },
        "\\tau = \\frac{V}{A_w} \\le f_v \\cdot \\gamma_c",
        `\\tau = \\frac{${V.toFixed(0)}}{${Aw.toFixed(1)}} = ${tau.toFixed(2)}\\text{ MPa}`,
        Number(tau.toFixed(2)),
        "MPa",
        {
            conditionLaTeX: `\\tau = ${tau.toFixed(2)} \\le f_v \\gamma_c = ${fv_allow.toFixed(2)}\\text{ MPa}`,
            isPass: isPassTau
        },
        "Ý NGHĨA KÝ HIỆU:\n" +
        "• V: Lực cắt tính toán lớn nhất (N)\n" +
        "• A_w = h_w × t_w: Diện tích tiết diện bản bụng chịu cắt (mm²)\n" +
        "• f_v: Cường độ tính toán chịu cắt của thép (fv = " + fv + " MPa)"
    ));

    // ================= 4. ỔN ĐỊNH TỔNG THỂ TRONG MẶT PHẲNG UỐN (In-plane) =================
    const lambda_bar_x = lambda_x * Math.sqrt(f / E);
    const lambda_bar_y = lambda_y * Math.sqrt(f / E);

    const Wc = section.Wx; 
    const e_x = N_abs === 0 ? 0 : (M / N_abs); 
    const m_x = N_abs === 0 ? 999.0 : (e_x * section.A / Wc);

    let sigma_in_plane = 0;
    let isPassInPlane = true;
    let phi_e = 1.0;

    if (isCompression) {
        const phi_e_res = StandardData.TCVN5575_2024.PhiE.getPhiE(lambda_bar_x, m_x);
        phi_e = phi_e_res.value;
        sigma_in_plane = N_abs / (phi_e * section.A);
        isPassInPlane = sigma_in_plane <= f_allow;
        if (!isPassInPlane) {
            isAllPass = false;
            if (!failureReason) failureReason = "Mất ổn định tổng thể trong mặt phẳng khung (σ_in > f·γc)";
        }
        
        steps.push(createCalculationStep(
            "CALC-SEC-003",
            "Ổn định tổng thể trong mặt phẳng uốn (In-plane Buckling)",
            { standard: 'TCVN 5575:2024', section: 'Mục 9.2.3', table: 'Bảng D.3' },
            "\\frac{N}{\\varphi_e A} \\le f \\cdot \\gamma_c",
            `\\frac{${N_abs.toFixed(0)}}{${phi_e.toFixed(3)} \\times ${section.A.toFixed(1)}} = ${sigma_in_plane.toFixed(2)}\\text{ MPa}`,
            Number(sigma_in_plane.toFixed(2)),
            "MPa",
            {
                conditionLaTeX: `\\sigma_{in} = ${sigma_in_plane.toFixed(2)} \\le f \\gamma_c = ${f_allow.toFixed(2)}\\text{ MPa}`,
                isPass: isPassInPlane
            },
            "Ý NGHĨA KÝ HIỆU & HỆ SỐ TRA BẢNG:\n" +
            `• m_x = (e_x · A) / W_c = ${m_x.toFixed(2)}: Độ lệch tâm quy ước trong mặt phẳng uốn\n` +
            `• λ̄_x = λ_x · √(f/E) = ${lambda_bar_x.toFixed(2)}: Độ mảnh quy ước của cột trong mặt phẳng khung\n` +
            `• φ_e = ${phi_e.toFixed(3)}: Hệ số uốn dọc lệch tâm tra từ Phụ lục D, Bảng D.3 TCVN 5575:2024`
        ));
    } else {
        // Cột chịu kéo uốn hoặc uốn thuần túy: Theo TCVN 5575:2024 Mục 9.1
        steps.push(createCalculationStep(
            "CALC-SEC-003",
            `Ổn định tổng thể trong mặt phẳng uốn (${isTension ? 'Cấu kiện chịu kéo uốn' : 'Uốn thuần túy'})`,
            { standard: 'TCVN 5575:2024', section: 'Mục 9.1' },
            "\\text{Không xét uốn dọc do tác dụng lực kéo hoặc không có lực nén dọc trục}",
            isTension ? 
                `N = ${N_kN}\\text{ kN} < 0 \\implies \\text{Cấu kiện chịu kéo ổn định uốn dọc}` :
                `N = 0\\text{ kN} \\implies \\text{Cấu kiện uốn thuần túy không chịu lực nén dọc trục}`,
            0,
            "MPa",
            { isPass: true },
            "Ý NGHĨA & TIÊU CHUẨN:\n" +
            (isTension ?
                `• N = ${N_kN} kN < 0: Cột chịu lực kéo do bốc gió/nhổ móng. Theo TCVN 5575:2024 Mục 9.1, cấu kiện chịu kéo uốn được ổn định bởi lực kéo dọc trục, không bị mất ổn định uốn dọc nén.` :
                "• N = 0 kN: Cấu kiện chịu uốn thuần túy, không có lực nén dọc trục gây mất ổn định uốn dọc.")
        ));
    }

    // ================= 5. ỔN ĐỊNH TỔNG THỂ NGOÀI MẶT PHẲNG UỐN (Out-of-plane) =================
    let sigma_out_plane = 0;
    let isPassOutPlane = true;
    let phi_y = 1.0;
    let c_factor = 1.0;

    if (isCompression) {
        // Tính chính xác phi_y theo TCVN 5575:2024 Công thức (7) & (8) và Bảng 7 (Đường uốn cong b)
        const phi_y_raw = (typeof TCVN5575_2024 !== 'undefined' && TCVN5575_2024.getPhi) ?
            TCVN5575_2024.getPhi(lambda_bar_y, 'b') :
            (lambda_bar_y > 2.5 ? 7.6 / (lambda_bar_y * lambda_bar_y) : 1 - 0.073 - 0.053 * lambda_bar_y * lambda_bar_y);
        const phi_y_val = (typeof phi_y_raw === 'object' && phi_y_raw !== null && phi_y_raw.phi !== undefined) ? phi_y_raw.phi : Number(phi_y_raw);
        phi_y = Number(Math.max(0.01, Math.min(1.0, phi_y_val)).toFixed(4));
        
        // Tính hệ số c theo Mục 9.2.5 Công thức (111) - (113) & Bảng 22
        const c_res = StandardData.TCVN5575_2024.C_Factor.getC(m_x, lambda_bar_y, phi_y, 1.0);
        c_factor = c_res.value;

        sigma_out_plane = N_abs / (c_factor * phi_y * section.A);
        isPassOutPlane = sigma_out_plane <= f_allow;
        if (!isPassOutPlane) {
            isAllPass = false;
            if (!failureReason) failureReason = "Mất ổn định tổng thể ngoài mặt phẳng khung (σ_out > f·γc)";
        }
        
        steps.push(createCalculationStep(
            "CALC-SEC-004",
            "Ổn định tổng thể ngoài mặt phẳng uốn (Out-of-plane Buckling)",
            { standard: 'TCVN 5575:2024', section: 'Mục 9.2.4 & 9.2.5', formula: 'Công thức (110)-(113)' },
            "\\frac{N}{c \\cdot \\varphi_y \\cdot A} \\le f \\cdot \\gamma_c",
            `\\frac{${N_abs.toFixed(0)}}{${c_factor.toFixed(3)} \\times ${phi_y.toFixed(3)} \\times ${section.A.toFixed(1)}} = ${sigma_out_plane.toFixed(2)}\\text{ MPa}`,
            Number(sigma_out_plane.toFixed(2)),
            "MPa",
            {
                conditionLaTeX: `\\sigma_{out} = ${sigma_out_plane.toFixed(2)} \\le f \\gamma_c = ${f_allow.toFixed(2)}\\text{ MPa}`,
                isPass: isPassOutPlane
            },
            "Ý NGHĨA KÝ HIỆU & HỆ SỐ TRA BẢNG:\n" +
            `• λ̄_y = λ_y · √(f/E) = ${lambda_bar_y.toFixed(2)}: Độ mảnh quy ước ngoài mặt phẳng khung\n` +
            `• φ_y = ${phi_y.toFixed(3)}: Hệ số uốn dọc ngoài mặt phẳng theo CT (7) & (8) và Bảng 7 TCVN 5575:2024\n` +
            `• c = ${c_factor.toFixed(3)}: Hệ số xét đến ảnh hưởng của mô men uốn ngoài mặt phẳng theo Mục 9.2.5 (${c_res.formula})`
        ));
    } else {
        steps.push(createCalculationStep(
            "CALC-SEC-004",
            `Ổn định tổng thể ngoài mặt phẳng uốn (${isTension ? 'Cấu kiện chịu kéo uốn' : 'Uốn thuần túy'})`,
            { standard: 'TCVN 5575:2024', section: 'Mục 9.1' },
            "\\text{Không xét uốn dọc do tác dụng lực kéo hoặc không có lực nén dọc trục}",
            isTension ?
                `N = ${N_kN}\\text{ kN} < 0 \\implies \\text{Cấu kiện chịu kéo ổn định uốn dọc ngoài mặt phẳng}` :
                `N = 0\\text{ kN} \\implies \\text{Cấu kiện uốn thuần túy không chịu lực nén dọc trục}`,
            0,
            "MPa",
            { isPass: true },
            "Ý NGHĨA & TIÊU CHUẨN:\n" +
            (isTension ?
                `• N = ${N_kN} kN < 0: Không xảy ra hiện tượng mất ổn định uốn dọc nén ngoài mặt phẳng theo TCVN 5575:2024 Mục 9.1.` :
                "• N = 0 kN: Cấu kiện chịu uốn thuần túy, không có lực nén dọc trục gây mất ổn định uốn dọc.")
        ));
    }

    // ================= 6. ỔN ĐỊNH CỤC BỘ BẢN CÁNH & BẢN BỤNG =================
    const bef = (section.b - section.tw) / 2;
    const lambda_f = bef / section.tf;
    const lambda_bar_f = lambda_f * Math.sqrt(f / E);
    
    let lambda_bar_uf = 0.5;
    if (m_x > 0.1 && m_x <= 5.0) lambda_bar_uf = 0.5 - 0.028 * (m_x - 0.1); 
    else if (m_x > 5.0) lambda_bar_uf = 0.36; 

    const hasCompressionFlange = isCompression || (isPureBending && M > 0);
    const isPassLocalFlange = lambda_bar_f <= lambda_bar_uf;
    if (!isPassLocalFlange && hasCompressionFlange) {
        isAllPass = false;
        if (!failureReason) failureReason = "Mất ổn định cục bộ Bản cánh (λ̄_f > [λ̄_uf])";
    }

    steps.push(createCalculationStep(
        "CALC-SEC-005",
        "Ổn định cục bộ phần vươn bản cánh nén",
        { standard: 'TCVN 5575:2024', section: 'Mục 9.4.7', table: 'Bảng 24' },
        "\\bar{\\lambda}_f = \\frac{b_{ef}}{t_f} \\sqrt{\\frac{f}{E}} \\le [\\bar{\\lambda}_{uf}]",
        `\\bar{\\lambda}_f = ${lambda_bar_f.toFixed(3)} \\le [\\bar{\\lambda}_{uf}] = ${lambda_bar_uf.toFixed(2)}`,
        Number(lambda_bar_f.toFixed(3)), "",
        { isPass: isPassLocalFlange },
        "Ý NGHĨA KÝ HIỆU:\n" +
        "• b_ef: Độ vươn tự do của bản cánh (b_ef = (b - tw)/2)\n" +
        "• t_f: Chiều dày bản cánh; [λ̄_uf]: Giới hạn độ mảnh quy ước bản cánh theo Bảng 24"
    ));

    const lambda_w = section.hw / section.tw;
    const lambda_bar_w = lambda_w * Math.sqrt(f / E);
    let lambda_bar_uw = 3.2; 
    
    const isPassLocalWeb = lambda_bar_w <= lambda_bar_uw;
    if (!isPassLocalWeb && hasCompressionFlange) {
        isAllPass = false;
        if (!failureReason) failureReason = "Mất ổn định cục bộ Bản bụng (λ̄_w > [λ̄_uw])";
    }

    steps.push(createCalculationStep(
        "CALC-SEC-006",
        "Ổn định cục bộ bản bụng cột",
        { standard: 'TCVN 5575:2024', section: 'Mục 9.4.2', table: 'Bảng 22' },
        "\\bar{\\lambda}_w = \\frac{h_w}{t_w} \\sqrt{\\frac{f}{E}} \\le [\\bar{\\lambda}_{uw}]",
        `\\bar{\\lambda}_w = ${lambda_bar_w.toFixed(3)} \\le [\\bar{\\lambda}_{uw}] = ${lambda_bar_uw.toFixed(2)}`,
        Number(lambda_bar_w.toFixed(3)), "",
        { isPass: isPassLocalWeb },
        "Ý NGHĨA KÝ HIỆU:\n" +
        "• h_w: Chiều cao thông thủy của bản bụng; t_w: Chiều dày bản bụng\n" +
        "• [λ̄_uw] = 3,2: Giới hạn độ mảnh quy ước bản bụng cột nén lệch tâm theo Bảng 22"
    ));

    // Hệ số tận dụng khả năng chịu lực (Utilization Ratios)
    const util_strength = Number((sigma / f_allow).toFixed(3));
    const util_shear = Number((tau / fv_allow).toFixed(3));
    const util_in_plane = isCompression ? Number((sigma_in_plane / f_allow).toFixed(3)) : 0;
    const util_out_plane = isCompression ? Number((sigma_out_plane / f_allow).toFixed(3)) : 0;
    const util_slenderness = Number((lambda_max / lambda_limit).toFixed(3));
    const util_max = Math.max(util_strength, util_shear, util_in_plane, util_out_plane, util_slenderness);

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
            max: util_max
        },
        slenderness: {
            lambda_x: Number(lambda_x.toFixed(1)),
            lambda_y: Number(lambda_y.toFixed(1)),
            lambda_max: Number(lambda_max.toFixed(1)),
            limit: lambda_limit,
            isPass: isPassSlenderness
        }
    };
}

var globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
globalScope.checkSectionCapacity = checkSectionCapacity;
