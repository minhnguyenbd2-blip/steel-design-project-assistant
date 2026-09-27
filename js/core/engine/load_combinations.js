// Load Combination & Structural Frame Solver Engine (TCVN 2737:2023 Điều 4.3 & TCVN 5575:2024)
// Phân chia rõ ràng: Tổ hợp cơ bản 1 (1 hoạt tải) và Tổ hợp cơ bản 2 (từ 2 hoạt tải trở lên)
// Tích hợp giải nội lực khung ngang (Portal Frame Solver) chân ngàm/khớp theo phương pháp Kleinlogel

function solveGablePortalFrame(L, H, f, q_DL, q_LL, windLoads) {
    // L: Nhịp khung (m), H: Chiều cao cột (m), f: Độ dốc mái (m)
    const k = 1.0; // Tỷ số độ cứng tương đối giữa dầm xà và cột k = (Ix/s) / (Ic/H)
    
    // 1. Tác dụng tải trọng đứng phân bố đều trên mái (Tĩnh tải DL hoặc Hoạt tải LL)
    function getVerticalForces(q) {
        const V_base = (q * L) / 2;
        // Lực xô ngang chân cột:
        const thrust = (q * Math.pow(L, 2)) / (16 * H) * (1 / (1 + 0.5 * k));
        // Mô men uốn tại chân cột:
        const M_base = - (q * Math.pow(L, 2)) / 32 * (1 / (1 + k));
        // Mô men tại nách khung (đỉnh cột):
        const M_knee = M_base + thrust * H;
        // Mô men tại đỉnh mái:
        const M_apex = (q * Math.pow(L, 2)) / 8 - thrust * (H + f) + M_base;
        
        return {
            N: Number(V_base.toFixed(2)),
            Mx: Number(Math.abs(M_base).toFixed(2)),
            Vx: Number(thrust.toFixed(2)),
            M_knee: Number(Math.abs(M_knee).toFixed(2)),
            M_apex: Number(Math.abs(M_apex).toFixed(2))
        };
    }
    
    // 2. Tác dụng tải trọng gió ngang trên khung (q_push đón gió, q_pull hút gió, q_r1 và q_r2 trên mái)
    function getWindForces(q_push, q_pull, q_r1, q_r2) {
        const V_tot = (q_push + Math.abs(q_pull)) * H / 2;
        const M_base_windward = (q_push * Math.pow(H, 2)) / 8 + V_tot * (H / 4);
        const M_base_leeward = (Math.abs(q_pull) * Math.pow(H, 2)) / 8 - V_tot * (H / 4);
        
        const overturning_M = (q_push + Math.abs(q_pull)) * H * (H / 2);
        const N_overturning = overturning_M / L;
        // Tải trọng bốc mái (giá trị âm) làm giảm lực dọc nén cột:
        const N_suction = (q_r1 + q_r2) * (L / 4);
        
        const N_windward = Number((N_suction - N_overturning).toFixed(2));
        const N_leeward = Number((N_suction + N_overturning).toFixed(2));
        
        const M_knee_windward = (q_push * Math.pow(H, 2)) / 2 - Math.abs(M_base_windward);
        const M_knee_leeward = (Math.abs(q_pull) * Math.pow(H, 2)) / 2 - Math.abs(M_base_leeward);
        
        return {
            windward: {
                N: N_windward,
                Mx: Number(M_base_windward.toFixed(2)),
                Vx: Number((q_push * H / 2).toFixed(2)),
                M_knee: Number(Math.abs(M_knee_windward).toFixed(2))
            },
            leeward: {
                N: N_leeward,
                Mx: Number(M_base_leeward.toFixed(2)),
                Vx: Number((Math.abs(q_pull) * H / 2).toFixed(2)),
                M_knee: Number(Math.abs(M_knee_leeward).toFixed(2))
            }
        };
    }
    
    const dlForces = getVerticalForces(q_DL);
    const llForces = getVerticalForces(q_LL);
    const windForces = getWindForces(
        windLoads.q_push || 0,
        windLoads.q_pull || 0,
        windLoads.q_roof_windward || 0,
        windLoads.q_roof_leeward || 0
    );
    
    return { dlForces, llForces, windForces };
}

function calculateLoadCombinations(gravityResult, windResult, geomInput = null) {
    const steps = [];
    
    const q_DL = gravityResult.q_DL || 0;
    const q_LL = gravityResult.q_LL || 0;
    
    // Hình học khung ngang
    const L = (geomInput && geomInput.L) || (windResult && windResult.geom && windResult.geom.L) || 25;
    const H = (geomInput && geomInput.H_col) || (windResult && windResult.geom && windResult.geom.H_col) || 8;
    const H_rf = (geomInput && geomInput.H_rf) || (windResult && windResult.geom && windResult.geom.H_rf) || 9.25;
    const f = Math.max(0.1, H_rf - H);
    
    // Trích xuất tải trọng gió tác dụng lên khung
    let q_W_push = 0;
    let q_W_pull = 0;
    let q_W_roof_w = 0;
    let q_W_roof_l = 0;
    
    // Tải trọng gió tiêu chuẩn (characteristic) để tính chuyển vị (SLS)
    let q_W_push_k = 0;
    let q_W_pull_k = 0;
    
    if (windResult && windResult.loadCases && windResult.loadCases['+X']) {
        const surfaces = windResult.loadCases['+X'].surfaces;
        const zoneD = surfaces.find(s => s.zone === 'D');
        const zoneE = surfaces.find(s => s.zone === 'E');
        const zoneG = surfaces.find(s => s.zone === 'G');
        const zoneH = surfaces.find(s => s.zone === 'H');
        const zoneI = surfaces.find(s => s.zone === 'I');
        if (zoneD) {
            q_W_push = zoneD.frameLineLoad_d || 0;
            q_W_push_k = zoneD.frameLineLoad_k || 0;
        }
        if (zoneE) {
            q_W_pull = zoneE.frameLineLoad_d || 0;
            q_W_pull_k = zoneE.frameLineLoad_k || 0;
        }
        if (zoneG || zoneH) q_W_roof_w = (zoneG ? zoneG.frameLineLoad_d : zoneH.frameLineLoad_d) || 0;
        if (zoneI) q_W_roof_l = zoneI.frameLineLoad_d || 0;
    }

    // Trường hợp gió mái đẩy (+X_DUONG)
    let q_W_roof_push = 0;
    if (windResult && windResult.loadCases && windResult.loadCases['+X_DUONG']) {
        const surfacesPush = windResult.loadCases['+X_DUONG'].surfaces;
        const zoneGPush = surfacesPush.find(s => s.zone === 'G');
        const zoneHPush = surfacesPush.find(s => s.zone === 'H');
        if (zoneGPush || zoneHPush) q_W_roof_push = (zoneGPush ? zoneGPush.frameLineLoad_d : zoneHPush.frameLineLoad_d) || 0;
    }
    
    const windLoads = {
        q_push: q_W_push,
        q_pull: q_W_pull,
        q_roof_windward: q_W_roof_w,
        q_roof_leeward: q_W_roof_l
    };

    const windLoadsPush = {
        q_push: q_W_push,
        q_pull: q_W_pull,
        q_roof_windward: q_W_roof_push,
        q_roof_leeward: q_W_roof_push
    };
    
    // Giải nội lực các trường hợp tải đơn lẻ
    const frameAnalysis = solveGablePortalFrame(L, H, f, q_DL, q_LL, windLoads);
    const { dlForces, llForces, windForces } = frameAnalysis;
    
    // Nội lực tĩnh tải bé nhất có lợi (0.9 x DL_char) - tính gián tiếp từ dlForces (vốn dùng 1.05 DL_char)
    const factor_DL_min = 0.9 / 1.05;
    const dlMinForces = {
        N: Number((dlForces.N * factor_DL_min).toFixed(2)),
        Mx: Number((dlForces.Mx * factor_DL_min).toFixed(2)),
        Vx: Number((dlForces.Vx * factor_DL_min).toFixed(2)),
        M_knee: Number((dlForces.M_knee * factor_DL_min).toFixed(2))
    };

    const frameAnalysisPush = solveGablePortalFrame(L, H, f, q_DL, q_LL, windLoadsPush);

    // ================= 1. TỔ HỢP CƠ BẢN 1 (THCB1): TĨNH TẢI + 1 HOẠT TẢI CHÍNH =================
    // THCB 1A: Tĩnh tải + 1.0 Hoạt tải mái (DL + 1.0 LL)
    const q_TH1A = Number((q_DL + 1.0 * q_LL).toFixed(2));
    const forces_TH1A = {
        id: "CB1A",
        name: "THCB 1A (Tĩnh tải + Hoạt tải mái)",
        source: "TCVN 2737:2023 Solver",
        N: Number((dlForces.N + 1.0 * llForces.N).toFixed(2)),
        Mx: Number((dlForces.Mx + 1.0 * llForces.Mx).toFixed(2)),
        Vx: Number((dlForces.Vx + 1.0 * llForces.Vx).toFixed(2)),
        M_knee: Number((dlForces.M_knee + 1.0 * llForces.M_knee).toFixed(2)),
        M_apex: Number((dlForces.M_apex + 1.0 * llForces.M_apex).toFixed(2))
    };
    
    steps.push(createCalculationStep(
        "CALC-COMB-001",
        "Tổ hợp cơ bản 1A (THCB 1A): Tĩnh tải + Hoạt tải mái",
        { standard: 'TCVN 2737:2023', section: 'Điều 4.3.3' },
        "q_{TH1A} = q_{DL} + \\psi_{t1} \\cdot q_{LL}; \\quad S_{TH1A} = S_{DL} + 1,0 \\cdot S_{LL}",
        `q_{TH1A} = ${q_DL.toFixed(2)} + 1,0 \\times ${q_LL.toFixed(2)} = ${q_TH1A}\\text{ kN/m}; \\quad N = ${forces_TH1A.N}\\text{ kN}, M_x = ${forces_TH1A.Mx}\\text{ kNm}, V_x = ${forces_TH1A.Vx}\\text{ kN}`,
        q_TH1A,
        "kN/m",
        { isPass: true },
        "Ý NGHĨA KÝ HIỆU & HỆ SỐ TỔ HỢP:\n" +
        "• q_{DL}: Tĩnh tải dầm mái tính toán; q_{LL}: Hoạt tải sửa chữa mái tính toán\n" +
        "• ψ_{t1} = 1,0: Hệ số tổ hợp khi chỉ có 1 hoạt tải tạm thời (TCVN 2737:2023 Điều 4.3.3)\n" +
        `• Nội lực chân cột: N = ${forces_TH1A.N} kN, Mx = ${forces_TH1A.Mx} kNm, Vx = ${forces_TH1A.Vx} kN`
    ));

    // THCB 1B_Giotrai: Tĩnh tải + 1.0 Gió trái (+X)
    const q_TH1B_horiz = Number((1.0 * q_W_push).toFixed(2));
    const q_TH1B_vert = Number((q_DL + 1.0 * q_W_roof_w).toFixed(2));
    const forces_TH1B_Left = {
        id: "CB1B_Left",
        name: "THCB 1B (Tĩnh tải + Gió trái +X)",
        source: "TCVN 2737:2023 Solver",
        N: Number((dlForces.N + 1.0 * windForces.windward.N).toFixed(2)),
        Mx: Number((dlForces.Mx + 1.0 * windForces.windward.Mx).toFixed(2)),
        Vx: Number((dlForces.Vx + 1.0 * windForces.windward.Vx).toFixed(2)),
        M_knee: Number((dlForces.M_knee + 1.0 * windForces.windward.M_knee).toFixed(2))
    };
    
    // THCB 1B_Giophai: Tĩnh tải + 1.0 Gió phải (-X) (đối xứng)
    const forces_TH1B_Right = {
        id: "CB1B_Right",
        name: "THCB 1B (Tĩnh tải + Gió phải -X)",
        source: "TCVN 2737:2023 Solver",
        N: Number((dlForces.N + 1.0 * windForces.leeward.N).toFixed(2)),
        Mx: Number((dlForces.Mx + 1.0 * windForces.leeward.Mx).toFixed(2)),
        Vx: Number((dlForces.Vx + 1.0 * windForces.leeward.Vx).toFixed(2)),
        M_knee: Number((dlForces.M_knee + 1.0 * windForces.leeward.M_knee).toFixed(2))
    };

    // THCB 1B_Bocmai: Tĩnh tải bất lợi nhỏ (0.9 DL) + Gió bốc mái (kiểm tra nhổ neo/kéo)
    const forces_TH1B_Uplift = {
        id: "CB1B_Uplift",
        name: "THCB 1B (0,9 Tĩnh tải + Gió bốc nhổ chân cột)",
        source: "TCVN 2737:2023 Solver",
        N: Number((dlMinForces.N + 1.0 * Math.min(windForces.windward.N, windForces.leeward.N)).toFixed(2)),
        Mx: Number((dlMinForces.Mx + 1.0 * windForces.windward.Mx).toFixed(2)),
        Vx: Number((dlMinForces.Vx + 1.0 * windForces.windward.Vx).toFixed(2))
    };

    steps.push(createCalculationStep(
        "CALC-COMB-002",
        "Tổ hợp cơ bản 1B (THCB 1B): Tĩnh tải + Tải trọng gió chính",
        { standard: 'TCVN 2737:2023', section: 'Điều 4.3.3' },
        "S_{TH1B} = S_{DL} + 1,0 \\cdot S_{W}",
        `N = ${forces_TH1B_Left.N}\\text{ kN}, M_x = ${forces_TH1B_Left.Mx}\\text{ kNm}, V_x = ${forces_TH1B_Left.Vx}\\text{ kN}`,
        forces_TH1B_Left.Mx,
        "kNm",
        { isPass: true },
        "Ý NGHĨA KÝ HIỆU & NGUYÊN TẮC TỔ HỢP:\n" +
        "• ψ_t = 1,0: Tải trọng gió là hoạt tải chính duy nhất\n" +
        `• Gió trái (+X): N = ${forces_TH1B_Left.N} kN, Mx = ${forces_TH1B_Left.Mx} kNm, Vx = ${forces_TH1B_Left.Vx} kN\n` +
        `• Gió phải (-X): N = ${forces_TH1B_Right.N} kN, Mx = ${forces_TH1B_Right.Mx} kNm, Vx = ${forces_TH1B_Right.Vx} kN\n` +
        `• Kiểm tra nhổ bu lông móng (0,9 DL_char + Wind Uplift): N = ${forces_TH1B_Uplift.N} kN`
    ));

    // ================= 2. TỔ HỢP CƠ BẢN 2 (THCB2): TĨNH TẢI + TỪ 2 HOẠT TẢI TRỞ LÊN =================
    // DL + 0.9 LL + 0.9 Wind
    const q_TH2_horiz = Number((0.9 * q_W_push).toFixed(2));
    const q_TH2_vert = Number((q_DL + 0.9 * q_LL + 0.9 * q_W_roof_w).toFixed(2));
    
    const forces_TH2_Left = {
        id: "CB2_Left",
        name: "THCB 2 (Tĩnh tải + 0,9 Hoạt tải mái + 0,9 Gió trái)",
        source: "TCVN 2737:2023 Solver",
        N: Number((dlForces.N + 0.9 * llForces.N + 0.9 * windForces.windward.N).toFixed(2)),
        Mx: Number((dlForces.Mx + 0.9 * llForces.Mx + 0.9 * windForces.windward.Mx).toFixed(2)),
        Vx: Number((dlForces.Vx + 0.9 * llForces.Vx + 0.9 * windForces.windward.Vx).toFixed(2)),
        M_knee: Number((dlForces.M_knee + 0.9 * llForces.M_knee + 0.9 * windForces.windward.M_knee).toFixed(2))
    };
    
    const forces_TH2_Right = {
        id: "CB2_Right",
        name: "THCB 2 (Tĩnh tải + 0,9 Hoạt tải mái + 0,9 Gió phải)",
        source: "TCVN 2737:2023 Solver",
        N: Number((dlForces.N + 0.9 * llForces.N + 0.9 * windForces.leeward.N).toFixed(2)),
        Mx: Number((dlForces.Mx + 0.9 * llForces.Mx + 0.9 * windForces.leeward.Mx).toFixed(2)),
        Vx: Number((dlForces.Vx + 0.9 * llForces.Vx + 0.9 * windForces.leeward.Vx).toFixed(2)),
        M_knee: Number((dlForces.M_knee + 0.9 * llForces.M_knee + 0.9 * windForces.leeward.M_knee).toFixed(2))
    };

    // THCB 1B_Gioduong: Tĩnh tải + Gió mái đẩy (+X_DUONG)
    const forces_TH1B_Push = {
        id: "CB1B_Push",
        name: "THCB 1B (Tĩnh tải + Gió mái đẩy +X)",
        source: "TCVN 2737:2023 Solver",
        N: Number((dlForces.N + 1.0 * frameAnalysisPush.windForces.leeward.N).toFixed(2)),
        Mx: Number((dlForces.Mx + 1.0 * frameAnalysisPush.windForces.windward.Mx).toFixed(2)),
        Vx: Number((dlForces.Vx + 1.0 * frameAnalysisPush.windForces.windward.Vx).toFixed(2)),
        M_knee: Number((dlForces.M_knee + 1.0 * frameAnalysisPush.windForces.windward.M_knee).toFixed(2))
    };

    steps.push(createCalculationStep(
        "CALC-COMB-003",
        "Tổ hợp cơ bản 2 (THCB 2): Tĩnh tải + 0,9 Hoạt tải mái + 0,9 Tải trọng gió",
        { standard: 'TCVN 2737:2023', section: 'Điều 4.3.4' },
        "S_{TH2} = S_{DL} + 0,9 \\cdot S_{LL} + 0,9 \\cdot S_{W}",
        `N = ${forces_TH2_Left.N}\\text{ kN}, M_x = ${forces_TH2_Left.Mx}\\text{ kNm}, V_x = ${forces_TH2_Left.Vx}\\text{ kN}`,
        forces_TH2_Left.Mx,
        "kNm",
        { isPass: true },
        "Ý NGHĨA KÝ HIỆU & HỆ SỐ TỔ HỢP:\n" +
        "• ψ = 0,9: Hệ số giảm trừ tổ hợp khi có từ 2 hoạt tải trở lên cùng xuất hiện đồng thời (TCVN 2737:2023 Điều 4.3.4)\n" +
        `• THCB 2 (Gió trái): N = ${forces_TH2_Left.N} kN, Mx = ${forces_TH2_Left.Mx} kNm, Vx = ${forces_TH2_Left.Vx} kN\n` +
        `• THCB 2 (Gió phải): N = ${forces_TH2_Right.N} kN, Mx = ${forces_TH2_Right.Mx} kNm, Vx = ${forces_TH2_Right.Vx} kN`
    ));

    // Kiểm tra chuyển vị ngang đỉnh cột theo TCVN 5575:2024 Mục 13 & Bảng E.1
    const drift_H_mm = H * 1000;
    const drift_limit = drift_H_mm / 150; // mm
    const Ic_default = 5.7e8; // mm4 (ước lượng theo tiết diện cột I600)
    const E_modulus = 2.06e5; // MPa
    // Tính chuyển vị SLS dựa trên tải trọng gió TIÊU CHUẨN (q_W_push_k, q_W_pull_k) thay vì tải tính toán
    const V_horiz_N_k = (q_W_push_k + Math.abs(q_W_pull_k)) * H * 1000 / 2;
    const u_sway_mm = (V_horiz_N_k * Math.pow(H * 1000, 3)) / (3 * E_modulus * Ic_default * (1 + 2 * 1.0));
    const isDriftPass = u_sway_mm <= drift_limit;

    steps.push(createCalculationStep(
        "CALC-COMB-004",
        "Kiểm tra chuyển vị ngang đỉnh cột (Sway Drift) theo TCVN 5575:2024",
        { standard: 'TCVN 5575:2024', section: 'Mục 13 & Bảng E.1' },
        "u \\le [u] = \\frac{H}{150}",
        `u = ${u_sway_mm.toFixed(1)}\\text{ mm} \\le [u] = \\frac{${drift_H_mm}}{150} = ${drift_limit.toFixed(1)}\\text{ mm}`,
        Number(u_sway_mm.toFixed(1)),
        "mm",
        {
            conditionLaTeX: `u = ${u_sway_mm.toFixed(1)}\\text{ mm} \\le [u] = ${drift_limit.toFixed(1)}\\text{ mm}`,
            isPass: isDriftPass
        },
        "Ý NGHĨA & TIÊU CHUẨN KIỂM TRA ĐIỀU KIỆN SỬ DỤNG (SLS):\n" +
        "• u: Chuyển vị ngang đàn hồi tại nách khung do tải gió ngang\n" +
        "• [u] = H / 150: Giới hạn chuyển vị ngang cho nhà công nghiệp 1 tầng bao che nhẹ (TCVN 5575:2024 Bảng E.1)"
    ));

    const frameForces = [
        forces_TH1A,
        forces_TH1B_Left,
        forces_TH1B_Right,
        forces_TH1B_Push,
        forces_TH1B_Uplift,
        forces_TH2_Left,
        forces_TH2_Right
    ];

    // Xác định các trường hợp bao bất lợi nhất cho chân cột
    const maxM_case = [...frameForces].sort((a, b) => Math.abs(b.Mx) - Math.abs(a.Mx))[0];
    const maxN_case = [...frameForces].sort((a, b) => b.N - a.N)[0];
    const minN_case = [...frameForces].sort((a, b) => a.N - b.N)[0];

    const governingForces = {
        columnBase: {
            maxM: maxM_case,
            maxN: maxN_case,
            minN: minN_case
        }
    };

    return {
        steps,
        success: true,
        combos: {
            TH1A: q_TH1A,
            TH1B: { horiz: q_TH1B_horiz, vert: q_TH1B_vert },
            TH2: { horiz: q_TH2_horiz, vert: q_TH2_vert }
        },
        frameAnalysis,
        frameForces,
        governingForces
    };
}

var globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
globalScope.solveGablePortalFrame = solveGablePortalFrame;
globalScope.calculateLoadCombinations = calculateLoadCombinations;
