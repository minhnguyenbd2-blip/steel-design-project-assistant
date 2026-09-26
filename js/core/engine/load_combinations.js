// Load Combination Engine (TCVN 2737:2023)

function calculateLoadCombinations(gravityResult, windResult) {
    const steps = [];
    
    // Thu thập kết quả tải phân bố từ bước trước
    const q_DL = gravityResult.q_DL || 0;
    const q_LL = gravityResult.q_LL || 0;
    
    // Wind result cung cấp nội lực Push/Pull cho cột và mái. 
    // Trích xuất step để minh họa. Trong thực tế solver FEA sẽ giải.
    let q_W_push = 0;
    if (windResult.loadCases && windResult.loadCases['+X']) {
        const zoneD = windResult.loadCases['+X'].surfaces.find(s => s.zone === 'D');
        if (zoneD) {
            q_W_push = zoneD.frameLineLoad || 0;
        }
    }

    const psi_t_ll = 1.0; 
    const psi_t_wind = 0.9;
    
    // CB1: DL + 1.0 LL
    const q_TH1 = q_DL + psi_t_ll * q_LL;
    
    steps.push(createCalculationStep(
        "CALC-COMB-001",
        "Tổ hợp cơ bản 1 (THCB1)",
        { standard: 'TCVN 2737:2023', section: '4.3.3' },
        "q_{TH1} = q_{DL} + \\psi_{t1} q_{LL}",
        `q_{TH1} = ${q_DL.toFixed(2)} + ${psi_t_ll.toFixed(2)} \\times ${q_LL.toFixed(2)}`,
        Number(q_TH1.toFixed(2)),
        "kN/m",
        null,
        "Hệ số tổ hợp = 1.0 (Một hoạt tải). Tải phân bố tổng cộng trên dầm mái."
    ));

    // CB2: DL + 0.9 LL + 0.9 Wind
    const q_TH2_gravity = q_DL + 0.9 * q_LL;
    const q_TH2_wind = psi_t_wind * q_W_push;

    steps.push(createCalculationStep(
        "CALC-COMB-002",
        "Tổ hợp cơ bản 2 (THCB2)",
        { standard: 'TCVN 2737:2023', section: '4.3.4' },
        "\\text{Đứng: } q_{TH2,v} = q_{DL} + 0.9 q_{LL} \\\\ \\text{Ngang: } q_{TH2,h} = 0.9 q_{W,push}",
        `q_{TH2,v} = ${q_DL.toFixed(2)} + 0.9 \\times ${q_LL.toFixed(2)} = ${q_TH2_gravity.toFixed(2)} \\\\ q_{TH2,h} = 0.9 \\times ${q_W_push.toFixed(2)} = ${q_TH2_wind.toFixed(2)}`,
        null,
        "kN/m",
        null,
        "Hệ số tổ hợp = 0.9 (Hai hoạt tải trở lên)."
    ));

    return {
        steps,
        success: true
    };
}

window.calculateLoadCombinations = calculateLoadCombinations;
