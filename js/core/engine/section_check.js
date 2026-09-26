// Section Checking Engine (TCVN 5575:2024)

function checkSectionCapacity(section, N_kN, M_kNm, V_kN, materialProps, L0x_m, L0y_m) {
    const steps = [];
    let isAllPass = true;
    let failureReason = "";

    const N = Math.abs(N_kN) * 1000; // N
    const M = Math.abs(M_kNm) * 1e6; // N.mm
    const V = Math.abs(V_kN) * 1000; // N

    const L0x = L0x_m * 1000; 
    const L0y = L0y_m * 1000; 

    const { f, fv, gamma_c, E } = materialProps;
    
    // 1. STRENGTH CHECK - 9.2.2
    const sigma = (N / section.A) + (M / section.Wx);
    const isPassSigma = sigma <= f * gamma_c;
    if (!isPassSigma) {
        isAllPass = false;
        failureReason = "Không đạt Bền (Nén Uốn)";
    }

    steps.push(createCalculationStep(
        "CALC-SEC-001",
        "Kiểm tra ứng suất pháp (Nén uốn trong mặt phẳng)",
        { standard: 'TCVN 5575:2024', section: '9.2.2', formula: '(108)' },
        "\\sigma = \\frac{N}{A} + \\frac{M}{W_x}",
        `\\sigma = \\frac{${N.toFixed(0)}}{${section.A.toFixed(1)}} + \\frac{${M.toFixed(0)}}{${section.Wx.toFixed(1)}}`,
        Number(sigma.toFixed(2)),
        "N/mm^2",
        {
            conditionLaTeX: `\\sigma \\le f \\gamma_c \\rightarrow ${sigma.toFixed(2)} \\le ${(f*gamma_c).toFixed(2)}`,
            isPass: isPassSigma
        }
    ));

    const Aw = section.hw * section.tw;
    const tau = V / Aw; 
    const isPassTau = tau <= fv * gamma_c;
    if (!isPassTau) {
        isAllPass = false;
        if(!failureReason) failureReason = "Không đạt Cắt";
    }

    steps.push(createCalculationStep(
        "CALC-SEC-002",
        "Kiểm tra ứng suất tiếp (Cắt)",
        { standard: 'TCVN 5575:2024', section: '9.2.3' }, // Có thể là 9.2.4 bản cũ, nhưng cần tra lại. Cắt thường 9.2.3
        "\\tau = \\frac{V}{A_w}",
        `\\tau = \\frac{${V.toFixed(0)}}{${Aw.toFixed(1)}}`,
        Number(tau.toFixed(2)),
        "N/mm^2",
        {
            conditionLaTeX: `\\tau \\le f_v \\gamma_c \\rightarrow ${tau.toFixed(2)} \\le ${(fv*gamma_c).toFixed(2)}`,
            isPass: isPassTau
        }
    ));

    // 2. GLOBAL STABILITY
    const lambda_x = L0x / section.ix;
    const lambda_y = L0y / section.iy;
    
    const lambda_bar_x = lambda_x * Math.sqrt(f / E);
    const lambda_bar_y = lambda_y * Math.sqrt(f / E);

    const Wc = section.Wx; 
    const e_x = N === 0 ? 0 : (M / N); 
    const m_x = N === 0 ? 0 : (e_x * section.A / Wc);

    // 2.1 In-plane stability
    const phi_e_res = StandardData.TCVN5575_2024.PhiE.getPhiE(lambda_bar_x, m_x);
    const phi_e = phi_e_res.value;

    let sigma_in_plane = 0;
    let isPassInPlane = true;
    if (N > 0) {
        sigma_in_plane = N / (phi_e * section.A);
        isPassInPlane = sigma_in_plane <= f * gamma_c;
        if (!isPassInPlane) {
            isAllPass = false;
            if(!failureReason) failureReason = "Không đạt Ổn định Trong Mặt Phẳng";
        }
        
        steps.push(createCalculationStep(
            "CALC-SEC-003",
            "Ổn định tổng thể trong mặt phẳng uốn (In-plane)",
            { standard: 'TCVN 5575:2024', section: '9.2.3', table: 'Bảng D.3' },
            "\\frac{N}{\\varphi_e A} \\le f \\gamma_c",
            `\\frac{${N.toFixed(0)}}{${phi_e.toFixed(3)} \\times ${section.A.toFixed(1)}}`,
            Number(sigma_in_plane.toFixed(2)),
            "N/mm^2",
            {
                conditionLaTeX: `\\sigma_{in} \\le f \\gamma_c \\rightarrow ${sigma_in_plane.toFixed(2)} \\le ${(f*gamma_c).toFixed(2)}`,
                isPass: isPassInPlane
            },
            `m_x = ${m_x.toFixed(2)}, \\bar{\\lambda}_x = ${lambda_bar_x.toFixed(2)}. ${phi_e_res.log}. Status: ${phi_e_res.status}`
        ));
    }

    // 2.2 Out-of-plane stability - TCVN 5575:2024 9.2.4
    let phi_y = 1.0;
    if (lambda_bar_y > 2.5) {
        phi_y = 7.6 / (lambda_bar_y * lambda_bar_y);
    } else {
        phi_y = 1 - 0.073 - 0.053 * lambda_bar_y * lambda_bar_y; 
    }
    
    const c_res = StandardData.TCVN5575_2024.C_Factor.getC(m_x);
    const c_factor = c_res.value;

    let sigma_out_plane = 0;
    let isPassOutPlane = true;
    if (N > 0) {
        sigma_out_plane = N / (c_factor * phi_y * section.A);
        isPassOutPlane = sigma_out_plane <= f * gamma_c;
        if (!isPassOutPlane) {
            isAllPass = false;
            if(!failureReason) failureReason = "Không đạt Ổn định Ngoài Mặt Phẳng";
        }
        
        steps.push(createCalculationStep(
            "CALC-SEC-004",
            "Ổn định tổng thể ngoài mặt phẳng uốn (Out-of-plane)",
            { standard: 'TCVN 5575:2024', section: '9.2.4', formula: '(110)' },
            "\\frac{N}{c \\varphi_y A} \\le f \\gamma_c",
            `\\frac{${N.toFixed(0)}}{${c_factor.toFixed(2)} \\times ${phi_y.toFixed(3)} \\times ${section.A.toFixed(1)}}`,
            Number(sigma_out_plane.toFixed(2)),
            "N/mm^2",
            {
                conditionLaTeX: `\\sigma_{out} \\le f \\gamma_c \\rightarrow ${sigma_out_plane.toFixed(2)} \\le ${(f*gamma_c).toFixed(2)}`,
                isPass: isPassOutPlane
            },
            `\\bar{\\lambda}_y = ${lambda_bar_y.toFixed(2)}. ${c_res.log}. Status: ${c_res.status}`
        ));
    }

    // 3. LOCAL BUCKLING 
    const bef = (section.b - section.tw) / 2;
    const lambda_f = bef / section.tf;
    const lambda_bar_f = lambda_f * Math.sqrt(f / E);
    
    let lambda_bar_uf = 0.5;
    if (m_x > 0.1 && m_x <= 5.0) lambda_bar_uf = 0.5 - 0.028 * (m_x - 0.1); 
    else if (m_x > 5.0) lambda_bar_uf = 0.36; 

    const isPassLocalFlange = lambda_bar_f <= lambda_bar_uf;
    if (!isPassLocalFlange) {
        isAllPass = false;
        if(!failureReason) failureReason = "Mất ổn định cục bộ Bản cánh";
    }

    steps.push(createCalculationStep(
        "CALC-SEC-005",
        "Độ mảnh quy ước phần vươn cánh",
        { standard: 'TCVN 5575:2024', section: '9.4.7', table: 'Bảng 24' },
        "\\bar{\\lambda}_f \\le [\\bar{\\lambda}_{uf}]",
        `\\bar{\\lambda}_f = ${lambda_bar_f.toFixed(3)} \\le ${lambda_bar_uf.toFixed(2)}`,
        null, "",
        { isPass: isPassLocalFlange },
        `Trạng thái: NEEDS VERIFICATION (Đang dùng xấp xỉ cho Bảng 24).`
    ));

    const lambda_w = section.hw / section.tw;
    const lambda_bar_w = lambda_w * Math.sqrt(f / E);
    let lambda_bar_uw = 3.2; 
    
    const isPassLocalWeb = lambda_bar_w <= lambda_bar_uw;
    if (!isPassLocalWeb) {
        isAllPass = false;
        if(!failureReason) failureReason = "Mất ổn định cục bộ Bản bụng";
    }

    steps.push(createCalculationStep(
        "CALC-SEC-006",
        "Độ mảnh quy ước bản bụng",
        { standard: 'TCVN 5575:2024', section: '9.4.2', table: 'Bảng 22' },
        "\\bar{\\lambda}_w \\le [\\bar{\\lambda}_{uw}]",
        `\\bar{\\lambda}_w = ${lambda_bar_w.toFixed(3)} \\le ${lambda_bar_uw.toFixed(2)}`,
        null, "",
        { isPass: isPassLocalWeb },
        `Trạng thái: NEEDS VERIFICATION (Đang dùng xấp xỉ cho Bảng 22).`
    ));

    return { steps, success: true, isAllPass, failureReason };
}

window.checkSectionCapacity = checkSectionCapacity;
