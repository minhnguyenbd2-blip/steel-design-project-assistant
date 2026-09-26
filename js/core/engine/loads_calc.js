// Gravity Load Calculation Engine

function calculateGravityLoads(inputs, roofComponents) {
    const steps = [];
    
    // TĨNH TẢI (Dead Load)
    let gk = 0;
    const compStrs = [];
    if(roofComponents && roofComponents.length > 0) {
        roofComponents.forEach(c => {
            gk += c.value;
            compStrs.push(c.value.toFixed(2));
        });
    } else {
        gk = 0.15; // fallback
        compStrs.push("0.15");
    }

    const gamma_g = 1.05; // Theo TCVN 2737:2023, Bảng 1 (Giả định vật liệu nhẹ)
    const B = inputs.B; // Bước cột
    
    const gd = gk * gamma_g; 
    const q_DL = gd * B;

    steps.push(createCalculationStep(
        "CALC-GRAV-001",
        "Tĩnh tải mái (Dead Load)",
        { standard: 'TCVN 2737:2023', section: 'Bảng 1' },
        "q_{DL} = (\\sum g_{k,i}) \\times \\gamma_G \\times B",
        `q_{DL} = (${compStrs.join(' + ')}) \\times ${gamma_g} \\times ${B}`,
        Number(q_DL.toFixed(2)),
        "kN/m",
        null,
        "Đã phân rã các lớp cấu tạo mái theo đúng dữ liệu đầu vào. Hệ số độ tin cậy gamma_G = 1.05 (Kết cấu thép/nhẹ)."
    ));

    // HOẠT TẢI (Live Load)
    // Theo TCVN 2737:2023 Bảng 4, Khu vực H (Mái không sử dụng)
    const pk = 0.3; // kN/m2 (Giá trị tiêu chuẩn)
    const gamma_q = 1.3; // Hệ số độ tin cậy
    const pd = pk * gamma_q;
    const q_LL = pd * B;

    steps.push(createCalculationStep(
        "CALC-GRAV-002",
        "Hoạt tải mái (Live Load)",
        { standard: 'TCVN 2737:2023', section: 'Bảng 4 (Khu vực H)' },
        "q_{LL} = p_k \\times \\gamma_Q \\times B",
        `q_{LL} = ${pk} \\times ${gamma_q} \\times ${B}`,
        Number(q_LL.toFixed(2)),
        "kN/m",
        null,
        "Mái không sử dụng để tập trung người."
    ));

    return {
        steps,
        success: true,
        q_DL: q_DL,
        q_LL: q_LL
    };
}

window.calculateGravityLoads = calculateGravityLoads;
