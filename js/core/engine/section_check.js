// Section Checking Engine (TCVN 5575:2024)
// Kiểm tra khả năng chịu lực của cấu kiện Cột thép chịu nén uốn theo TCVN 5575:2024

function checkSectionCapacity(section, N_kN, M_kNm, V_kN, materialProps, L0x_m, L0y_m) {
    const steps = [];
    let isAllPass = true;
    let failureReason = "";

    const N = Math.abs(N_kN) * 1000; // Đổi kN -> N
    const M = Math.abs(M_kNm) * 1e6; // Đổi kNm -> N.mm
    const V = Math.abs(V_kN) * 1000; // Đổi kN -> N

    const L0x = L0x_m * 1000; // mm
    const L0y = L0y_m * 1000; // mm

    const { f, fv, gamma_c, E } = materialProps;
    
    // ================= 1. KIỂM TRA ĐỘ BỀN (Nén uốn trong mặt phẳng) - Điều 9.2.2 =================
    const sigma = (N / section.A) + (M / section.Wx);
    const f_allow = f * gamma_c;
    const isPassSigma = sigma <= f_allow;
    if (!isPassSigma) {
        isAllPass = false;
        failureReason = "Không đạt điều kiện bền nén uốn (σ > f·γc)";
    }

    steps.push(createCalculationStep(
        "CALC-SEC-001",
        "Kiểm tra ứng suất pháp bền (Nén uốn trong mặt phẳng)",
        { standard: 'TCVN 5575:2024', section: 'Mục 9.2.2', formula: 'Công thức (108)' },
        "\\sigma = \\frac{N}{A} + \\frac{M}{W_x} \\le f \\cdot \\gamma_c",
        `\\sigma = \\frac{${N.toFixed(0)}}{${section.A.toFixed(1)}} + \\frac{${M.toFixed(0)}}{${section.Wx.toFixed(1)}} = ${sigma.toFixed(2)}\\text{ MPa}`,
        Number(sigma.toFixed(2)),
        "MPa",
        {
            conditionLaTeX: `\\sigma = ${sigma.toFixed(2)} \\le f \\gamma_c = ${f_allow.toFixed(2)}\\text{ MPa}`,
            isPass: isPassSigma
        },
        "Ý NGHĨA KÝ HIỆU:\n" +
        "• N: Lực dọc tính toán lớn nhất trong cột (N)\n" +
        "• M: Mô men uốn tính toán lớn nhất trong mặt phẳng khung (N.mm)\n" +
        "• A: Diện tích tiết diện ngang của cột (mm²)\n" +
        "• W_x: Mô men kháng uốn của tiết diện đối với trục uốn chính x-x (mm³)\n" +
        "• f: Cường độ tính toán chịu kéo/nén của thép (f = " + f + " MPa)\n" +
        "• γ_c = " + gamma_c + ": Hệ số điều kiện làm việc của kết cấu"
    ));

    // ================= 2. KIỂM TRA ỨNG SUẤT TIẾP (Cắt) =================
    const Aw = section.hw * section.tw;
    const tau = V / Aw; 
    const fv_allow = fv * gamma_c;
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

    // ================= 3. ỔN ĐỊNH TỔNG THỂ TRONG MẶT PHẲNG UỐN (In-plane) =================
    const lambda_x = L0x / section.ix;
    const lambda_y = L0y / section.iy;
    
    const lambda_bar_x = lambda_x * Math.sqrt(f / E);
    const lambda_bar_y = lambda_y * Math.sqrt(f / E);

    const Wc = section.Wx; 
    const e_x = N === 0 ? 0 : (M / N); 
    const m_x = N === 0 ? 0 : (e_x * section.A / Wc);

    const phi_e_res = StandardData.TCVN5575_2024.PhiE.getPhiE(lambda_bar_x, m_x);
    const phi_e = phi_e_res.value;

    let sigma_in_plane = 0;
    let isPassInPlane = true;
    if (N > 0) {
        sigma_in_plane = N / (phi_e * section.A);
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
            `\\frac{${N.toFixed(0)}}{${phi_e.toFixed(3)} \\times ${section.A.toFixed(1)}} = ${sigma_in_plane.toFixed(2)}\\text{ MPa}`,
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
    }

    // ================= 4. ỔN ĐỊNH TỔNG THỂ NGOÀI MẶT PHẲNG UỐN (Out-of-plane) =================
    let phi_y = 1.0;
    if (lambda_bar_y > 2.5) {
        phi_y = 7.6 / (lambda_bar_y * lambda_bar_y);
    } else {
        phi_y = 1 - 0.073 - 0.053 * lambda_bar_y * lambda_bar_y; 
    }
    phi_y = Math.max(0.1, Math.min(1.0, phi_y));
    
    const c_res = StandardData.TCVN5575_2024.C_Factor.getC(m_x);
    const c_factor = c_res.value;

    let sigma_out_plane = 0;
    let isPassOutPlane = true;
    if (N > 0) {
        sigma_out_plane = N / (c_factor * phi_y * section.A);
        isPassOutPlane = sigma_out_plane <= f_allow;
        if (!isPassOutPlane) {
            isAllPass = false;
            if (!failureReason) failureReason = "Mất ổn định tổng thể ngoài mặt phẳng khung (σ_out > f·γc)";
        }
        
        steps.push(createCalculationStep(
            "CALC-SEC-004",
            "Ổn định tổng thể ngoài mặt phẳng uốn (Out-of-plane Buckling)",
            { standard: 'TCVN 5575:2024', section: 'Mục 9.2.4', formula: 'Công thức (110)' },
            "\\frac{N}{c \\cdot \\varphi_y \\cdot A} \\le f \\cdot \\gamma_c",
            `\\frac{${N.toFixed(0)}}{${c_factor.toFixed(2)} \\times ${phi_y.toFixed(3)} \\times ${section.A.toFixed(1)}} = ${sigma_out_plane.toFixed(2)}\\text{ MPa}`,
            Number(sigma_out_plane.toFixed(2)),
            "MPa",
            {
                conditionLaTeX: `\\sigma_{out} = ${sigma_out_plane.toFixed(2)} \\le f \\gamma_c = ${f_allow.toFixed(2)}\\text{ MPa}`,
                isPass: isPassOutPlane
            },
            "Ý NGHĨA KÝ HIỆU & HỆ SỐ TRA BẢNG:\n" +
            `• λ̄_y = λ_y · √(f/E) = ${lambda_bar_y.toFixed(2)}: Độ mảnh quy ước ngoài mặt phẳng khung (chiều dài tính toán L_{0y} = ${L0y_m} m)\n` +
            `• φ_y = ${phi_y.toFixed(3)}: Hệ số uốn dọc ngoài mặt phẳng\n` +
            `• c = ${c_factor.toFixed(2)}: Hệ số xét đến ảnh hưởng của mô men uốn ngoài mặt phẳng theo Bảng D.5`
        ));
    }

    // ================= 5. ỔN ĐỊNH CỤC BỘ BẢN CÁNH & BẢN BỤNG =================
    const bef = (section.b - section.tw) / 2;
    const lambda_f = bef / section.tf;
    const lambda_bar_f = lambda_f * Math.sqrt(f / E);
    
    let lambda_bar_uf = 0.5;
    if (m_x > 0.1 && m_x <= 5.0) lambda_bar_uf = 0.5 - 0.028 * (m_x - 0.1); 
    else if (m_x > 5.0) lambda_bar_uf = 0.36; 

    const isPassLocalFlange = lambda_bar_f <= lambda_bar_uf;
    if (!isPassLocalFlange) {
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
    if (!isPassLocalWeb) {
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

    return { steps, success: true, isAllPass, failureReason };
}

window.checkSectionCapacity = checkSectionCapacity;
