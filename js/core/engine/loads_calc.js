// Gravity Load Calculation Engine
// Tuân thủ TCVN 2737:2023 (Tải trọng thường xuyên & tạm thời trên mái) và Đồ án mẫu

function calculateGravityLoads(inputs, roofComponents) {
    const steps = [];
    
    // 1. TĨNH TẢI MÁI (Dead Load)
    let gk_sum = 0;
    const compStrs = [];
    if (roofComponents && roofComponents.length > 0) {
        roofComponents.forEach(c => {
            gk_sum += Number(c.value) || 0;
            compStrs.push(`${c.name}: ${Number(c.value).toFixed(4)} kN/m²`);
        });
    } else {
        gk_sum = 0.1514;
        compStrs.push("Tổng tải mặc định: 0.1514 kN/m²");
    }

    const gamma_g = 1.05; // Hệ số độ tin cậy tải trọng kết cấu thép & tôn nhẹ (TCVN 2737:2023 Bảng 1)
    const B = Number(inputs.B) || 6.0; // Bước cột khung (m)
    const L = Number(inputs.L) || 24.0;
    const H_col = Number(inputs.H_column) || 8.0;
    const H_rf = Number(inputs.H_roof) || 9.25;
    
    const roofRise = Math.max(0.1, H_rf - H_col);
    const alphaRad = Math.atan(roofRise / (L / 2));
    const cosA = Math.cos(alphaRad);
    
    // Tải trọng tính toán trên mét vuông mái dốc
    const gd_slope = gk_sum * gamma_g; 
    // Quy về tải trọng phân bố đều trên diện tích hình chiếu mặt bằng: g1m = gm / cos(alpha)
    const gd_plan = gd_slope / cosA;
    const gk_plan = gk_sum / cosA;
    
    // Tải trọng phân bố đều trên 1 mét dài khung ngang
    const q_DL = Number((gd_plan * B).toFixed(2));
    const qk_DL = Number((gk_plan * B).toFixed(2));

    steps.push(createCalculationStep(
        "CALC-GRAV-001",
        "Tĩnh tải dồn lên dầm mái khung ngang (Dead Load)",
        { standard: 'TCVN 2737:2023', section: 'Mục 7 & Bảng 1' },
        "q_{DL} = \\frac{\\sum g_{k,i} \\times \\gamma_G}{\\cos\\alpha} \\times B",
        `q_{DL} = \\frac{${gk_sum.toFixed(4)} \\times ${gamma_g}}{${cosA.toFixed(4)}} \\times ${B} = ${q_DL}\\text{ kN/m}`,
        q_DL,
        "kN/m",
        { isPass: true },
        "Ý NGHĨA KÝ HIỆU:\n" +
        "• Σg_{k,i}: Tổng tĩnh tải tiêu chuẩn trên mái gồm: " + compStrs.join('; ') + "\n" +
        "• γ_G = 1,05: Hệ số độ tin cậy về tải trọng thường xuyên (TCVN 2737:2023, Bảng 1)\n" +
        "• cos(α) = " + cosA.toFixed(4) + ": Hệ số quy đổi diện tích mái dốc sang mặt bằng\n" +
        "• B = " + B + " m: Bước cột truyền tải vào khung ngang"
    ));

    // 2. HOẠT TẢI SỬA CHỮA MÁI (Live Load)
    // Theo TCVN 2737:2023 Bảng 4, Khu vực H (Mái không sử dụng, chỉ có người bảo dưỡng sửa chữa)
    const pk = 0.3; // kN/m2 (Giá trị tiêu chuẩn)
    const gamma_q = 1.3; // Hệ số độ tin cậy tải trọng tạm thời
    const pd = pk * gamma_q; // 0.39 kN/m2
    
    const q_LL = Number(((pd / cosA) * B).toFixed(2));
    const qk_LL = Number(((pk / cosA) * B).toFixed(2));

    steps.push(createCalculationStep(
        "CALC-GRAV-002",
        "Hoạt tải sửa chữa mái dồn lên dầm mái khung ngang (Live Load)",
        { standard: 'TCVN 2737:2023', section: 'Bảng 4 (Khu vực H)' },
        "q_{LL} = \\frac{p_k \\times \\gamma_Q}{\\cos\\alpha} \\times B",
        `q_{LL} = \\frac{${pk} \\times ${gamma_q}}{${cosA.toFixed(4)}} \\times ${B} = ${q_LL}\\text{ kN/m}`,
        q_LL,
        "kN/m",
        { isPass: true },
        "Ý NGHĨA KÝ HIỆU:\n" +
        "• p_k = 0,3 kN/m²: Giá trị tiêu chuẩn của hoạt tải mái không sử dụng (TCVN 2737:2023 Bảng 4)\n" +
        "• γ_Q = 1,3: Hệ số độ tin cậy của hoạt tải sửa chữa mái\n" +
        "• B = " + B + " m: Bước cột khung ngang"
    ));

    return {
        steps,
        success: true,
        q_DL,
        qk_DL,
        q_LL,
        qk_LL,
        cosA
    };
}

const _loadsScope = typeof window !== 'undefined' ? window : global;
_loadsScope.calculateGravityLoads = calculateGravityLoads;
