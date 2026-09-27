// Load Combination Engine (TCVN 2737:2023, Điều 4.3)
// Phân chia rõ ràng: Tổ hợp cơ bản 1 (1 hoạt tải) và Tổ hợp cơ bản 2 (từ 2 hoạt tải trở lên)

function calculateLoadCombinations(gravityResult, windResult) {
    const steps = [];
    
    const q_DL = gravityResult.q_DL || 0;
    const q_LL = gravityResult.q_LL || 0;
    
    // Tải trọng gió trên cột và dầm mái từ kết quả tính toán gió
    let q_W_push = 0;
    let q_W_pull = 0;
    let q_W_roof_suction = 0;
    
    if (windResult && windResult.loadCases && windResult.loadCases['+X']) {
        const surfaces = windResult.loadCases['+X'].surfaces;
        const zoneD = surfaces.find(s => s.zone === 'D');
        const zoneE = surfaces.find(s => s.zone === 'E');
        const zoneH = surfaces.find(s => s.zone === 'H');
        if (zoneD) q_W_push = zoneD.frameLineLoad_d || 0;
        if (zoneE) q_W_pull = zoneE.frameLineLoad_d || 0;
        if (zoneH) q_W_roof_suction = zoneH.frameLineLoad_d || 0;
    }

    // ================= 1. TỔ HỢP CƠ BẢN 1 (THCB1): TĨNH TẢI + 1 HOẠT TẢI CHÍNH =================
    // Trường hợp 1A: Tĩnh tải + Hoạt tải mái (DL + 1.0 LL)
    const q_TH1A = Number((q_DL + 1.0 * q_LL).toFixed(2));
    steps.push(createCalculationStep(
        "CALC-COMB-001",
        "Tổ hợp cơ bản 1A (THCB 1A): Tĩnh tải + Hoạt tải mái",
        { standard: 'TCVN 2737:2023', section: 'Điều 4.3.3' },
        "q_{TH1A} = q_{DL} + \\psi_{t1} \\cdot q_{LL}",
        `q_{TH1A} = ${q_DL.toFixed(2)} + 1,0 \\times ${q_LL.toFixed(2)} = ${q_TH1A}\\text{ kN/m}`,
        q_TH1A,
        "kN/m",
        { isPass: true },
        "Ý NGHĨA KÝ HIỆU & HỆ SỐ TỔ HỢP:\n" +
        "• q_{DL}: Tĩnh tải dầm mái tính toán (kN/m)\n" +
        "• q_{LL}: Hoạt tải sửa chữa mái tính toán (kN/m)\n" +
        "• ψ_{t1} = 1,0: Hệ số tổ hợp khi chỉ có 1 hoạt tải tạm thời (TCVN 2737:2023 Điều 4.3.3)"
    ));

    // Trường hợp 1B: Tĩnh tải + Tải trọng gió (DL + 1.0 Wind)
    const q_TH1B_horiz = Number((1.0 * q_W_push).toFixed(2));
    const q_TH1B_vert = Number((q_DL + 1.0 * q_W_roof_suction).toFixed(2));
    steps.push(createCalculationStep(
        "CALC-COMB-002",
        "Tổ hợp cơ bản 1B (THCB 1B): Tĩnh tải + Tải trọng gió chính",
        { standard: 'TCVN 2737:2023', section: 'Điều 4.3.3' },
        "q_{ngang} = 1,0 \\cdot q_{W,push}; \\quad q_{dung} = q_{DL} + 1,0 \\cdot q_{W,roof}",
        `q_{ngang} = 1,0 \\times ${q_W_push.toFixed(2)} = ${q_TH1B_horiz}\\text{ kN/m}; \\quad q_{dung} = ${q_DL.toFixed(2)} + 1,0 \\times (${q_W_roof_suction.toFixed(2)}) = ${q_TH1B_vert}\\text{ kN/m}`,
        q_TH1B_horiz,
        "kN/m",
        { isPass: true },
        "Ý NGHĨA KÝ HIỆU & NGUYÊN TẮC TỔ HỢP:\n" +
        "• q_{W,push}: Tải trọng gió đẩy tác dụng vào cột đón gió (kN/m)\n" +
        "• q_{W,roof}: Tải trọng gió tác dụng lên dầm mái (kN/m) (dấu âm thể hiện lực bốc mái)\n" +
        "• ψ_{t} = 1,0: Tải trọng gió là hoạt tải chính duy nhất"
    ));

    // ================= 2. TỔ HỢP CƠ BẢN 2 (THCB2): TĨNH TẢI + TỪ 2 HOẠT TẢI TRỞ LÊN =================
    // DL + 0.9 LL + 0.9 Wind
    const q_TH2_horiz = Number((0.9 * q_W_push).toFixed(2));
    const q_TH2_vert = Number((q_DL + 0.9 * q_LL + 0.9 * q_W_roof_suction).toFixed(2));
    steps.push(createCalculationStep(
        "CALC-COMB-003",
        "Tổ hợp cơ bản 2 (THCB 2): Tĩnh tải + 0,9 Hoạt tải mái + 0,9 Tải trọng gió",
        { standard: 'TCVN 2737:2023', section: 'Điều 4.3.4' },
        "q_{ngang} = 0,9 \\cdot q_{W,push}; \\quad q_{dung} = q_{DL} + 0,9 \\cdot q_{LL} + 0,9 \\cdot q_{W,roof}",
        `q_{ngang} = 0,9 \\times ${q_W_push.toFixed(2)} = ${q_TH2_horiz}\\text{ kN/m}; \\quad q_{dung} = ${q_DL.toFixed(2)} + 0,9 \\times ${q_LL.toFixed(2)} + 0,9 \\times (${q_W_roof_suction.toFixed(2)}) = ${q_TH2_vert}\\text{ kN/m}`,
        q_TH2_vert,
        "kN/m",
        { isPass: true },
        "Ý NGHĨA KÝ HIỆU & HỆ SỐ TỔ HỢP:\n" +
        "• ψ = 0,9: Hệ số giảm trừ tổ hợp khi có từ 2 hoạt tải trở lên cùng xuất hiện đồng thời (TCVN 2737:2023 Điều 4.3.4)"
    ));

    return {
        steps,
        success: true,
        combos: {
            TH1A: q_TH1A,
            TH1B: { horiz: q_TH1B_horiz, vert: q_TH1B_vert },
            TH2: { horiz: q_TH2_horiz, vert: q_TH2_vert }
        }
    };
}

window.calculateLoadCombinations = calculateLoadCombinations;
