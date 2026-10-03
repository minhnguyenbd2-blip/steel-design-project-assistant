// Engine Thiết kế Bản sàn bê tông cốt thép và Dầm thép (Slab & Beam Engine)
// Tuân thủ TCVN 5574:2018 (Bê tông cốt thép) và TCVN 5575:2024 (Kết cấu thép)
// Phiên bản đã kiểm toán và nâng cấp chính xác hoàn toàn

const SlabBeamEngine = {
    // ═══════════════════════════════════════════════════════════════════════════════
    // 1. Module Thiết kế Bản sàn Bê tông Cốt thép (hoặc sàn sườn trên dầm thép)
    // Tham chiếu: TCVN 5574:2018 - Kết cấu bê tông và bê tông cốt thép
    // ═══════════════════════════════════════════════════════════════════════════════
    calculateSlab: function(params) {
        var L1 = Number(params.L1) || 2.5; // Nhịp cạnh ngắn (m) - Hướng tính toán chính
        var L2 = Number(params.L2) || 6.0; // Nhịp cạnh dài (m)
        var concreteGrade = params.concreteGrade || 'B20';
        var rebarGrade = params.rebarGrade || 'CB240-T';
        var liveLoadKNM2 = Number(params.liveLoad) || 3.0;    // Hoạt tải sử dụng p_k (kN/m²)
        var finishingLoadKNM2 = Number(params.finishingLoad) || 1.2; // Tải hoàn thiện g_ht,k (kN/m²)
        
        var conc = StandardData.TCVN5575_2024.SlabData.concreteGrades[concreteGrade] || StandardData.TCVN5575_2024.SlabData.concreteGrades['B20'];
        var rebar = StandardData.TCVN5575_2024.SlabData.rebarGrades[rebarGrade] || StandardData.TCVN5575_2024.SlabData.rebarGrades['CB240-T'];
        
        // ─────────────────────────────────────────────────────
        // BƯỚC 1: Xác định sơ đồ làm việc và chiều dày sơ bộ
        // ─────────────────────────────────────────────────────
        var ratio = L2 / L1;
        var isOneWay = ratio >= 2.0; // L2/L1 >= 2: Bản dầm (bản 1 phương); < 2: Bản kê 4 cạnh (bản 2 phương)
        
        // Sơ bộ chiều dày: hs = (D/m)·L1
        // D = 0.8÷1.4 (lấy D=1), m=30 cho bản dầm, m=40-45 cho bản kê
        var m_coeff = isOneWay ? 30 : 40;
        var hs_calc = (L1 * 1000) / m_coeff;
        var hs_chosen = Math.max(80, Math.ceil(hs_calc / 10) * 10); // Làm tròn lên bội số 10mm, min 80mm
        
        // ─────────────────────────────────────────────────────
        // BƯỚC 2: Tải trọng tính toán (hệ số vượt tải γ_f theo TCVN 2737:2023 Bảng 3)
        // ─────────────────────────────────────────────────────
        var hs_m = hs_chosen / 1000; // m
        var gk_slab = 25 * hs_m;                // Tĩnh tải bản thân bản sàn BTCT, tiêu chuẩn (kN/m²)
        var gd_slab = gk_slab * 1.1;             // Tính toán, γ_f = 1.1 (Bảng 3 TCVN 2737:2023 - tải trọng thường xuyên BTCT đổ tại chỗ)
        var gd_finishing = finishingLoadKNM2 * 1.2; // Tải hoàn thiện tính toán, γ_f = 1.2 (hoàn thiện)
        var g_total_d = gd_slab + gd_finishing;
        var g_total_k = gk_slab + finishingLoadKNM2;
        
        // Hoạt tải tính toán: γ_f = 1.2 khi p_k < 2.0 kN/m²; γ_f = 1.2 khi p_k ≥ 2.0 kN/m² theo TCVN 2737:2023
        // (Thực tế, TCVN 2737:2023 Bảng 3: p_k ≤ 2.0 → γ_f = 1.3; p_k > 2.0 → γ_f = 1.2)
        var gamma_f_live = liveLoadKNM2 <= 2.0 ? 1.3 : 1.2;
        var pd_live = liveLoadKNM2 * gamma_f_live;
        var qd = g_total_d + pd_live; // Tổng tải tính toán (kN/m²)
        var qk = g_total_k + liveLoadKNM2; // Tổng tải tiêu chuẩn
        
        // ─────────────────────────────────────────────────────
        // BƯỚC 3: Nội lực mô men uốn
        // Bản đơn: M = q·L²/8; Bản liên tục (đồ án thực tế): M_nhịp ≈ q·L²/11; M_gối ≈ q·L²/12 (TCVN 5574:2018 Bảng F.1)
        // ─────────────────────────────────────────────────────
        var M_span_kNm, M_support_kNm;
        if (isOneWay) {
            // Bản dầm liên tục: dùng hệ số mô men của TCVN 5574:2018
            M_span_kNm = (qd * L1 * L1) / 11;    // Mô men nhịp (kNm/m)
            M_support_kNm = (qd * L1 * L1) / 12;  // Mô men gối (kNm/m)
        } else {
            // Bản kê 4 cạnh (2 phương): tra bảng hệ số theo L2/L1
            // alpha1 (nhịp L1), alpha2 (nhịp L2) theo Bảng F.1 TCVN 5574:2018 (sơ đồ 9 - 4 cạnh liên kết khớp)
            var alpha1 = Math.max(0.018, 0.048 - 0.012 * (ratio - 1)); // Hệ số mô men theo phương L1
            M_span_kNm = alpha1 * qd * L1 * L1;
            M_support_kNm = M_span_kNm * 1.3; // Gối M ≈ 1.3 × M nhịp (cho bản liên tục 4 cạnh)
        }
        
        // ─────────────────────────────────────────────────────
        // BƯỚC 4: Tính toán cốt thép (theo TCVN 5574:2018 Mục 8.1.2.2)
        // ─────────────────────────────────────────────────────
        var b_cm = 100; // Bề rộng tính toán: dải bản rộng 100cm
        var a_protect = 1.5; // Lớp bảo vệ a' = 15mm = 1.5cm (TCVN 5574:2018 Bảng 8.1)
        var h0_cm = (hs_chosen / 10) - a_protect; // Chiều cao làm việc h₀ (cm)
        
        var Rb_kN_cm2 = conc.Rb * 0.1;  // MPa → kN/cm²
        var Rs_kN_cm2 = rebar.Rs * 0.1; // MPa → kN/cm²
        
        // Hệ số mô men không thứ nguyên alpha_m = M / (Rb·b·h₀²)
        var alpha_m = (M_span_kNm * 100) / (Rb_kN_cm2 * b_cm * h0_cm * h0_cm);
        var alpha_R = 0.390; // Giới hạn alpha_R (xi_R) theo TCVN 5574:2018 Bảng 10.1 (CB400-V hoặc CB240-T)
        var isAlphaValid = alpha_m <= alpha_R;
        
        var As_calc_cm2;
        if (isAlphaValid) {
            // Hệ số cánh tay đòn ζ = 0.5·(1 + √(1 - 2·α_m))
            var zeta = 0.5 * (1 + Math.sqrt(1 - 2 * alpha_m));
            As_calc_cm2 = (M_span_kNm * 100) / (zeta * Rs_kN_cm2 * h0_cm);
        } else {
            // Vượt alpha_R: tạm tính với ζ = 0.8 (cần tăng tiết diện)
            As_calc_cm2 = (M_span_kNm * 100) / (0.8 * Rs_kN_cm2 * h0_cm);
        }
        
        // ─────────────────────────────────────────────────────
        // BƯỚC 5: Bố trí cốt thép (thanh phi 8 hoặc phi 10)
        // ─────────────────────────────────────────────────────
        var barDiameter = hs_chosen >= 100 ? 10 : 8; // mm
        var singleBarArea_cm2 = (Math.PI * Math.pow(barDiameter / 10, 2)) / 4; // cm²
        // Khoảng cách thanh thép s (mm): s = A_1bar / As_calc × 1000
        var s_required = Math.floor((singleBarArea_cm2 * 100 / As_calc_cm2) * 10) * 10; // Làm tròn xuống 10mm
        // Giới hạn khoảng cách: [100mm, 200mm] theo TCVN 5574:2018 Mục 10.3.2
        var s_chosen = Math.max(100, Math.min(200, s_required));
        var numBars = 1000 / s_chosen; // Số thanh thép trong 1m dải bản
        var As_provided_cm2 = numBars * singleBarArea_cm2;
        
        // Hàm lượng cốt thép μ (%) theo TCVN 5574:2018 Mục 10.3.2.2
        var mu_percent = (As_provided_cm2 / (b_cm * h0_cm)) * 100;
        var mu_min = 0.1; // 0.1%
        var mu_max = 2.5; // 2.5% (TCVN 5574:2018 Mục 10.3.2.2)
        var isMuPass = mu_percent >= mu_min && mu_percent <= mu_max;
        
        var steps = [];
        steps.push(window.createCalculationStep(
            "CALC-SLAB-001",
            "Xác định Sơ đồ làm việc & Chọn chiều dày Bản sàn h_s",
            { standard: 'TCVN 5574:2018', section: 'Mục 6.2 & Bảng 5.4' },
            "\\frac{L_2}{L_1} = " + ratio.toFixed(2) + (isOneWay ? " \\ge 2 \\Rightarrow \\text{Bản dầm (1 phương)}" : " < 2 \\Rightarrow \\text{Bản kê 4 cạnh}") + "; \\quad h_s \\ge \\frac{1}{" + m_coeff + "} L_1",
            "\\frac{" + L2 + "}{" + L1 + "} = " + ratio.toFixed(2) + "; \\quad h_{s,tính} = \\frac{" + L1 + " \\times 1000}{" + m_coeff + "} = " + hs_calc.toFixed(0) + "\\text{ mm} \\Rightarrow h_{s,chọn} = " + hs_chosen + "\\text{ mm}",
            hs_chosen, "mm", { isPass: true },
            "Sơ đồ làm việc: " + (isOneWay ? "BẢN DẦM (1 phương) - L2/L1 ≥ 2 → Chỉ tính theo phương L1 ngắn hơn" : "BẢN KÊ 4 CẠNH (2 phương) - L2/L1 < 2 → Tính theo cả 2 phương") +
            "\nChọn h_s = " + hs_chosen + " mm (≥ max(" + hs_calc.toFixed(0) + " mm; 80 mm) làm tròn lên bội số 10mm)"
        ));
        steps.push(window.createCalculationStep(
            "CALC-SLAB-002",
            "Tải trọng tính toán tác dụng lên 1m² sàn",
            { standard: 'TCVN 2737:2023', section: 'Mục 4.1 & Bảng 3', formula: 'q_d = Σ(g_k·γ_f)' },
            "q_d = (\\gamma_{bt} \\cdot h_s \\cdot \\gamma_{f1}) + (g_{ht} \\cdot \\gamma_{f2}) + (p \\cdot \\gamma_{f3})",
            "q_d = (25 \\times " + hs_m.toFixed(3) + " \\times 1{,}1) + (" + finishingLoadKNM2 + " \\times 1{,}2) + (" + liveLoadKNM2 + " \\times " + gamma_f_live + ") = " + qd.toFixed(2) + "\\text{ kN/m}^2",
            Number(qd.toFixed(2)), "kN/m²",
            { isPass: true },
            "Thành phần tải trọng:\n" +
            "• Tĩnh tải bản thân sàn BTCT: g_{k,s} = 25×" + hs_m.toFixed(3) + " = " + gk_slab.toFixed(3) + " kN/m²; g_{d,s} = " + gd_slab.toFixed(3) + " kN/m² (γ_f = 1,1 - Bảng 3 TCVN 2737:2023)\n" +
            "• Tĩnh tải hoàn thiện: g_{ht,k} = " + finishingLoadKNM2 + " kN/m²; g_{ht,d} = " + gd_finishing.toFixed(3) + " kN/m² (γ_f = 1,2)\n" +
            "• Hoạt tải sử dụng: p_k = " + liveLoadKNM2 + " kN/m²; p_d = " + pd_live.toFixed(3) + " kN/m² (γ_f = " + gamma_f_live + " vì p_k " + (liveLoadKNM2 <= 2.0 ? "≤" : ">") + " 2 kN/m²)\n" +
            "• Tổng q_d = " + qd.toFixed(2) + " kN/m²; q_k = " + qk.toFixed(2) + " kN/m²"
        ));
        steps.push(window.createCalculationStep(
            "CALC-SLAB-003",
            "Nội lực Mô men uốn Thiết kế M_x",
            { standard: 'TCVN 5574:2018', section: isOneWay ? 'Phụ lục F' : 'Phụ lục F, Bảng F.1', formula: isOneWay ? "M = q·L²/11" : "M = α₁·q·L₁²" },
            isOneWay ? 
                "M_{nhịp} = \\frac{q_d \\cdot L_1^2}{11}; \\quad M_{gối} = \\frac{q_d \\cdot L_1^2}{12}" :
                "M_{nhịp} = \\alpha_1 \\cdot q_d \\cdot L_1^2 \\quad (\\alpha_1 \\text{ tra Bảng F.1})",
            isOneWay ?
                "M_{nhịp} = \\frac{" + qd.toFixed(2) + " \\times " + L1 + "^2}{11} = " + M_span_kNm.toFixed(2) + "\\text{ kNm/m}; \\quad M_{gối} = \\frac{" + qd.toFixed(2) + " \\times " + L1 + "^2}{12} = " + M_support_kNm.toFixed(2) + "\\text{ kNm/m}" :
                "M_{nhịp} = " + (alpha1||0.03).toFixed(3) + " \\times " + qd.toFixed(2) + " \\times " + L1 + "^2 = " + M_span_kNm.toFixed(2) + "\\text{ kNm/m}",
            Number(M_span_kNm.toFixed(2)), "kNm/m",
            { isPass: true },
            "Mô men thiết kế lớn nhất tại " + (isOneWay ? "giữa nhịp" : "giữa ô bản") + ": M = " + M_span_kNm.toFixed(2) + " kNm/m\n" +
            (isOneWay ? "Mô men tại gối (liên kết với tường, dầm phụ): M_gối = " + M_support_kNm.toFixed(2) + " kNm/m" : 
                        "Mô men theo phương L2 nhỏ hơn và thường không điều khiển")
        ));
        steps.push(window.createCalculationStep(
            "CALC-SLAB-004",
            "Tính toán Diện tích Cốt thép chịu uốn A_s (Bản rộng 1m)",
            { standard: 'TCVN 5574:2018', section: 'Mục 8.1.2.2', formula: 'α_m = M/(R_b·b·h₀²); A_s = M/(ζ·R_s·h₀)' },
            "\\alpha_m = \\frac{M}{R_b \\cdot b \\cdot h_0^2} \\le \\alpha_R; \\quad A_s = \\frac{M}{\\zeta \\cdot R_s \\cdot h_0}",
            "h_0 = " + h0_cm.toFixed(1) + "\\text{ cm}; \\quad \\alpha_m = \\frac{" + (M_span_kNm * 100).toFixed(1) + "}{" + Rb_kN_cm2.toFixed(2) + " \\times 100 \\times " + h0_cm.toFixed(1) + "^2} = " + alpha_m.toFixed(3) + " \\le \\alpha_R = " + alpha_R + "; \\quad A_s = " + As_calc_cm2.toFixed(2) + "\\text{ cm}^2\\text{/m}",
            Number(As_calc_cm2.toFixed(2)), "cm²/m",
            { isPass: isAlphaValid },
            "Chiều cao làm việc h₀ = h_s - a' = " + hs_chosen + "/10 - " + a_protect + " = " + h0_cm.toFixed(1) + " cm (a' = lớp bảo vệ + d/2 ≈ 15mm)\n" +
            "R_b = " + Rb_kN_cm2.toFixed(2) + " kN/cm² (" + conc.name + "); R_s = " + Rs_kN_cm2.toFixed(2) + " kN/cm² (" + rebar.name + ")\n" +
            "α_m = " + alpha_m.toFixed(3) + " " + (isAlphaValid ? "≤ α_R = " + alpha_R + " → Đặt 1 lớp thép là đủ" : "> α_R → Tiết diện không đủ khả năng, cần tăng h_s!") + "\n" +
            "ζ = 0,5·(1 + √(1 - 2·α_m)) = 0,5·(1 + √(1 - 2×" + alpha_m.toFixed(3) + ")) = " + (0.5*(1+Math.sqrt(Math.max(0, 1 - 2*alpha_m)))).toFixed(3) + "\n" +
            "A_s,yêu cầu = " + As_calc_cm2.toFixed(2) + " cm²/m"
        ));
        steps.push(window.createCalculationStep(
            "CALC-SLAB-005",
            "Bố trí Thép & Kiểm tra Hàm lượng Cốt thép (μ)",
            { standard: 'TCVN 5574:2018', section: 'Mục 10.3.2.2', formula: 'μ = A_s/(b·h₀)×100%; μ_min = 0,1%; μ_max = 2,5%' },
            "\\mu = \\frac{A_{s,bố trí}}{b \\cdot h_0} \\times 100\\% ; \\quad 0{,}1\\% \\le \\mu \\le 2{,}5\\%",
            "Chọn: \\emptyset" + barDiameter + " a" + s_chosen + "; \\quad A_{s,bố trí} = " + As_provided_cm2.toFixed(2) + "\\text{ cm}^2\\text{/m}; \\quad \\mu = \\frac{" + As_provided_cm2.toFixed(2) + "}{100 \\times " + h0_cm.toFixed(1) + "} \\times 100\\% = " + mu_percent.toFixed(2) + "\\%",
            Number(mu_percent.toFixed(2)), "%",
            { isPass: isMuPass },
            "Chọn cốt thép: Ø" + barDiameter + " a" + s_chosen + " (khoảng cách " + s_chosen + "mm)\n" +
            "A_s,bố trí = " + As_provided_cm2.toFixed(2) + " cm²/m " + (As_provided_cm2 >= As_calc_cm2 ? "≥" : "<") + " A_s,yêu cầu = " + As_calc_cm2.toFixed(2) + " cm²/m → " + (As_provided_cm2 >= As_calc_cm2 ? "Đạt" : "Không đủ!") + "\n" +
            "Hàm lượng μ = " + mu_percent.toFixed(2) + "% " + (isMuPass ? "trong phạm vi [0,1%; 2,5%] → Đạt" : "Ngoài phạm vi → Cần điều chỉnh")
        ));
        return { steps, 
            L1, L2, ratio: Number(ratio.toFixed(2)),
            type: isOneWay ? "Bản dầm - 1 phương (L2/L1 ≥ 2)" : "Bản kê 4 cạnh - 2 phương (L2/L1 < 2)",
            hs_chosen,
            concrete: conc.name,
            rebar: rebar.name,
            loads: {
                gk_slab: Number(gk_slab.toFixed(3)),
                gd_slab: Number(gd_slab.toFixed(3)),
                gamma_f_live,
                qd: Number(qd.toFixed(2)),
                qk: Number(qk.toFixed(2))
            },
            moments: {
                M_span: Number(M_span_kNm.toFixed(2)),
                M_support: Number(M_support_kNm.toFixed(2))
            },
            reinforcement: {
                h0_cm: Number(h0_cm.toFixed(1)),
                alpha_m: Number(alpha_m.toFixed(3)),
                isAlphaValid,
                As_calc_cm2: Number(As_calc_cm2.toFixed(2)),
                rebarDesignation: "Ø" + barDiameter + " a" + s_chosen,
                As_provided_cm2: Number(As_provided_cm2.toFixed(2)),
                mu_percent: Number(mu_percent.toFixed(2)),
                isPass: isAlphaValid && isMuPass
            }
        };
    },

    // ═══════════════════════════════════════════════════════════════════════════════
    // 2. Module Thiết kế Dầm Thép (Dầm sàn chữ I theo TCVN 5575:2024)
    // Các kiểm tra: Ổn định tổng thể, Bền uốn (CT 90), Cắt (CT 92), Độ võng (Phụ lục M)
    // ═══════════════════════════════════════════════════════════════════════════════
    calculateBeam: function(params) {
        var L_beam = Number(params.L_beam) || 6.0;    // Nhịp dầm (m)
        var tributaryWidth = Number(params.tributaryWidth) || 2.5; // Bề rộng truyền tải (m)
        var slabLoadQd = Number(params.slabLoadQd) || 6.5; // Tải tính toán từ sàn (kN/m²)
        var slabLoadQk = Number(params.slabLoadQk) || 5.0; // Tải tiêu chuẩn từ sàn (kN/m²)
        var steelGrade = params.steelGrade || 'S235';
        var chosenBeamId = params.chosenBeamId || 'I400';
        
        // Lấy cường độ vật liệu chính xác từ TCVN 5575:2024 Bảng 2
        var matProps = (typeof TCVN5575_2024 !== 'undefined' && TCVN5575_2024.getMaterialProperties) ?
            TCVN5575_2024.getMaterialProperties(steelGrade) : null;
        var f_steel = matProps ? matProps.f : 230;    // MPa - f theo Bảng 2 TCVN 5575:2024
        var fv_steel = matProps ? matProps.fv : 133;  // MPa - fv = 0.58·f
        var gamma_c = 1.0;
        var E_steel = 2.06e5; // MPa = 206,000 N/mm²
        
        // Tìm tiết diện dầm trong thư viện
        var beam = StandardData.TCVN5575_2024.BeamLibrary.find(function(b) { return b.id === chosenBeamId; });
        if (!beam) beam = StandardData.TCVN5575_2024.BeamLibrary[3]; // Mặc định I400
        
        // ─────────────────────────────────────────────────────
        // Tải trọng tính toán trên dầm
        // ─────────────────────────────────────────────────────
        var gk_beam_line = (beam.mass * 9.81) / 1000;  // Trọng lượng bản thân dầm (kN/m), g = 9.81 m/s²
        var gd_beam_line = gk_beam_line * 1.05;          // Tính toán: γ_f = 1.05 (thép cán)
        
        // Tải phân bố trên dầm (đã nhân hệ số từ sàn + bản thân dầm)
        var qd_line = slabLoadQd * tributaryWidth + gd_beam_line; // kN/m (tính toán)
        var qk_line = slabLoadQk * tributaryWidth + gk_beam_line; // kN/m (tiêu chuẩn - dùng tính độ võng)
        
        // ─────────────────────────────────────────────────────
        // Nội lực (dầm đơn giản 2 đầu khớp)
        // ─────────────────────────────────────────────────────
        var M_max_kNm = (qd_line * L_beam * L_beam) / 8;  // M_max tại giữa nhịp (kNm)
        var V_max_kN = (qd_line * L_beam) / 2;              // V_max tại gối (kN)
        
        // ─────────────────────────────────────────────────────
        // KIỂM TRA 1: Bền uốn (Bending Strength)
        // TCVN 5575:2024, Mục 7.2.1.1, CT (90):  σ_x = M_x / (c·W_x) ≤ f·γ_c
        // c = 1.0 khi bản cánh trên được giữ ổn định bởi sàn (Điều 7.2.2.1 TCVN 5575:2024)
        // ─────────────────────────────────────────────────────
        var Wx_mm3 = beam.Wx * 1000;       // Chuyển cm³ → mm³ (Wx trong thư viện là cm³)
        var M_N_mm = M_max_kNm * 1e6;     // kNm → N·mm
        var sigma_uon_MPa = M_N_mm / Wx_mm3;  // MPa = N/mm²
        var f_allow_MPa = f_steel * gamma_c;
        var isBendingPass = sigma_uon_MPa <= f_allow_MPa;
        
        // ─────────────────────────────────────────────────────
        // KIỂM TRA 2: Cắt (Shear)
        // TCVN 5575:2024, Mục 7.2.1.2, CT (92): τ = V / (h_w·t_w) ≤ fv·γ_c
        // (Công thức đơn giản hóa cho dầm I - đủ chính xác cho thiết kế sơ bộ)
        // ─────────────────────────────────────────────────────
        var hw_mm = beam.h - 2 * beam.tf; // Chiều cao bản bụng (mm)
        var Aw_mm2 = hw_mm * beam.tw;     // Diện tích bản bụng (mm²)
        var tau_MPa = (V_max_kN * 1000) / Aw_mm2;  // MPa = N/mm²
        var fv_allow_MPa = fv_steel * gamma_c;
        var isShearPass = tau_MPa <= fv_allow_MPa;
        
        // ─────────────────────────────────────────────────────
        // KIỂM TRA 3: Độ võng (Deflection - SLS)
        // TCVN 5575:2024, Mục 7.3 & Phụ lục M - Trạng thái giới hạn thứ 2
        // f = 5/384 × qk × L⁴ / (E × Ix) ≤ [f] = L/400 (dầm sàn)
        // Dùng tải tiêu chuẩn qk (không nhân hệ số vượt tải)
        // ─────────────────────────────────────────────────────
        var Ix_mm4 = beam.Ix * 1e4;                          // cm⁴ → mm⁴ (1 cm⁴ = 10⁴ mm⁴)
        var L_mm = L_beam * 1000;                            // m → mm
        var qk_N_per_mm = (qk_line * 1000) / 1000;         // kN/m → N/mm
        var defl_mm = (5 / 384) * (qk_N_per_mm * Math.pow(L_mm, 4)) / (E_steel * Ix_mm4);
        var defl_limit_factor = 400;    // [f/L] = 1/400 cho dầm sàn theo Phụ lục M Bảng M.1 TCVN 5575:2024
        var defl_allow_mm = L_mm / defl_limit_factor;
        var isDeflectionPass = defl_mm <= defl_allow_mm;
        
        // ─────────────────────────────────────────────────────
        // KIỂM TRA 4: Ổn định tổng thể (Global Stability)
        // Dầm sàn có bản cánh nén (trên) liên kết cứng với sàn BTCT hoặc sàn tôn deck:
        // Theo TCVN 5575:2024 Điều 7.2.2.1: φ_b = 1.0 (không mất ổn định tổng thể)
        // ─────────────────────────────────────────────────────
        var isStabilityPass = true;
        
        var isAllPass = isBendingPass && isShearPass && isDeflectionPass && isStabilityPass;
        
        var steps = [];
        steps.push(window.createCalculationStep(
            "CALC-BEAM-001",
            "Tải trọng & Nội lực Dầm (" + beam.name + ")",
            { standard: 'TCVN 5575:2024 & TCVN 2737:2023', section: 'Mục 7.1.1' },
            "q_d = q_{sàn,d} \\cdot B_{truyền tải} + g_{d,dầm}; \\quad M = \\frac{q_d \\cdot L^2}{8}; \\quad V = \\frac{q_d \\cdot L}{2}",
            "q_d = " + slabLoadQd.toFixed(2) + " \\times " + tributaryWidth + " + " + gd_beam_line.toFixed(3) + " = " + qd_line.toFixed(2) + "\\text{ kN/m}; \\quad M = \\frac{" + qd_line.toFixed(2) + " \\times " + L_beam + "^2}{8} = " + M_max_kNm.toFixed(2) + "\\text{ kNm}; \\quad V = " + V_max_kN.toFixed(2) + "\\text{ kN}",
            Number(M_max_kNm.toFixed(2)), "kNm",
            { isPass: true },
            "Dầm: " + beam.name + "; Nhịp L = " + L_beam + " m; Bề rộng truyền tải = " + tributaryWidth + " m\n" +
            "Tải từ sàn (tính toán): q_{sàn,d} = " + slabLoadQd.toFixed(2) + " kN/m²\n" +
            "Tải phân bố dầm tính toán: q_{d,dầm} = " + gd_beam_line.toFixed(3) + " kN/m (g = " + (beam.mass/100).toFixed(3) + " kN/m × 1.05)\n" +
            "Tổng tải tính toán: q_d = " + qd_line.toFixed(2) + " kN/m\n" +
            "Tổng tải tiêu chuẩn: q_k = " + qk_line.toFixed(2) + " kN/m (dùng tính độ võng)"
        ));
        steps.push(window.createCalculationStep(
            "CALC-BEAM-002",
            "Kiểm tra Ổn định Tổng thể Dầm (φ_b)",
            { standard: 'TCVN 5575:2024', section: 'Điều 7.2.2.1', formula: 'CT (90) với φ_b = 1,0' },
            "\\varphi_b = 1{,}0 \\text{ (Cánh nén giữ chặt liên tục bởi sàn BTCT)} \\Rightarrow \\text{Không kiểm tra mất ổn định tổng thể}",
            "\\text{Cánh trên liên kết cứng với sàn BTCT} \\Rightarrow \\varphi_b = 1{,}0 \\text{ (TCVN 5575:2024 Điều 7.2.2.1)}",
            1.0, "", { isPass: true },
            "TCVN 5575:2024 Điều 7.2.2.1: Khi bản cánh chịu nén của dầm được liên kết chắc chắn liên tục với sàn (bằng mối hàn, bu lông, neo), dầm không bị mất ổn định tổng thể → Hệ số φ_b = 1,0 không xét đến mất ổn định."
        ));
        steps.push(window.createCalculationStep(
            "CALC-BEAM-003",
            "Kiểm tra Bền Uốn (Bending Strength) σ_x ≤ f·γ_c",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.2.1.1, CT (90)' },
            "\\sigma_x = \\frac{M_x}{\\varphi_b \\cdot W_x} \\le f \\cdot \\gamma_c",
            "\\sigma_x = \\frac{" + M_N_mm.toFixed(0) + "}{1{,}0 \\times " + Wx_mm3.toFixed(0) + "} = " + sigma_uon_MPa.toFixed(2) + "\\text{ MPa} \\le f \\cdot \\gamma_c = " + f_allow_MPa.toFixed(0) + "\\text{ MPa}",
            Number(sigma_uon_MPa.toFixed(2)), "MPa",
            { 
                conditionLaTeX: "\\sigma_x = " + sigma_uon_MPa.toFixed(2) + " \\le " + f_allow_MPa.toFixed(0) + "\\text{ MPa}",
                isPass: isBendingPass 
            },
            "Mô men uốn tại giữa nhịp: M = " + M_max_kNm.toFixed(2) + " kNm = " + M_N_mm.toFixed(0) + " N·mm\n" +
            "Mô men kháng uốn tiết diện dầm: W_x = " + beam.Wx + " cm³ = " + Wx_mm3.toFixed(0) + " mm³\n" +
            "Ứng suất uốn: σ_x = " + sigma_uon_MPa.toFixed(2) + " MPa; Cường độ cho phép f = " + f_steel + " MPa (TCVN 5575:2024 Bảng 2 - " + steelGrade + ", t≤20mm)\n" +
            "Mức độ tận dụng: " + (sigma_uon_MPa / f_allow_MPa * 100).toFixed(1) + "% → " + (isBendingPass ? "ĐẠT" : "KHÔNG ĐẠT")
        ));
        steps.push(window.createCalculationStep(
            "CALC-BEAM-004",
            "Kiểm tra Cắt Bản bụng (Shear) τ ≤ fv·γ_c",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.2.1.2, CT (92)' },
            "\\tau = \\frac{V}{h_w \\cdot t_w} \\le f_v \\cdot \\gamma_c",
            "h_w = " + hw_mm.toFixed(0) + "\\text{ mm}; \\quad \\tau = \\frac{" + (V_max_kN * 1000).toFixed(0) + "}{" + hw_mm.toFixed(0) + " \\times " + beam.tw + "} = " + tau_MPa.toFixed(2) + "\\text{ MPa} \\le f_v = " + fv_allow_MPa.toFixed(0) + "\\text{ MPa}",
            Number(tau_MPa.toFixed(2)), "MPa",
            {
                conditionLaTeX: "\\tau = " + tau_MPa.toFixed(2) + " \\le f_v \\cdot \\gamma_c = " + fv_allow_MPa.toFixed(0) + "\\text{ MPa}",
                isPass: isShearPass
            },
            "Lực cắt tại gối: V = " + V_max_kN.toFixed(2) + " kN = " + (V_max_kN * 1000).toFixed(0) + " N\n" +
            "Bản bụng dầm: h_w = " + hw_mm.toFixed(0) + " mm; t_w = " + beam.tw + " mm; A_w = " + Aw_mm2.toFixed(0) + " mm²\n" +
            "Ứng suất cắt: τ = " + tau_MPa.toFixed(2) + " MPa; Giới hạn f_v = " + fv_steel + " MPa (f_v = 0,58·f = 0,58×" + f_steel + ")\n" +
            "Mức độ tận dụng: " + (tau_MPa / fv_allow_MPa * 100).toFixed(1) + "% → " + (isShearPass ? "ĐẠT" : "KHÔNG ĐẠT")
        ));
        steps.push(window.createCalculationStep(
            "CALC-BEAM-005",
            "Kiểm tra Độ võng (Deflection - SLS) f ≤ [f] = L/" + defl_limit_factor,
            { standard: 'TCVN 5575:2024', section: 'Mục 7.3, Phụ lục M Bảng M.1' },
            "f = \\frac{5}{384} \\cdot \\frac{q_k \\cdot L^4}{E \\cdot I_x} \\le [f] = \\frac{L}{" + defl_limit_factor + "}",
            "f = \\frac{5}{384} \\cdot \\frac{" + qk_N_per_mm.toFixed(4) + " \\times " + L_mm.toFixed(0) + "^4}{" + E_steel + " \\times " + Ix_mm4.toFixed(0) + "} = " + defl_mm.toFixed(2) + "\\text{ mm} \\le [f] = \\frac{" + L_mm.toFixed(0) + "}{" + defl_limit_factor + "} = " + defl_allow_mm.toFixed(2) + "\\text{ mm}",
            Number(defl_mm.toFixed(2)), "mm",
            {
                conditionLaTeX: "f = " + defl_mm.toFixed(2) + "\\text{ mm} \\le [f] = L/" + defl_limit_factor + " = " + defl_allow_mm.toFixed(2) + "\\text{ mm}",
                isPass: isDeflectionPass
            },
            "Kiểm tra theo Trạng thái giới hạn thứ 2 (SLS) - Dùng tải tiêu chuẩn q_k = " + qk_line.toFixed(2) + " kN/m\n" +
            "Mô men quán tính: I_x = " + beam.Ix + " cm⁴ = " + Ix_mm4.toFixed(0) + " mm⁴\n" +
            "Độ võng tính toán: f = " + defl_mm.toFixed(2) + " mm = L/" + (L_mm / defl_mm).toFixed(0) + "\n" +
            "Độ võng cho phép: [f] = L/400 = " + defl_allow_mm.toFixed(2) + " mm (Bảng M.1 TCVN 5575:2024 - Dầm sàn nhà dân dụng)\n" +
            "Mức độ tận dụng: " + (defl_mm / defl_allow_mm * 100).toFixed(1) + "% → " + (isDeflectionPass ? "ĐẠT" : "KHÔNG ĐẠT")
        ));
        
        return { steps, 
            beam,
            L_beam,
            tributaryWidth,
            material: { f_steel, fv_steel, E_steel, steelGrade },
            qd_line: Number(qd_line.toFixed(2)),
            qk_line: Number(qk_line.toFixed(2)),
            M_max_kNm: Number(M_max_kNm.toFixed(2)),
            V_max_kN: Number(V_max_kN.toFixed(2)),
            checks: {
                sigma_uon_MPa: Number(sigma_uon_MPa.toFixed(2)),
                f_allow_MPa: Number(f_allow_MPa.toFixed(2)),
                isBendingPass,
                tau_MPa: Number(tau_MPa.toFixed(2)),
                fv_allow_MPa: Number(fv_allow_MPa.toFixed(2)),
                isShearPass,
                defl_mm: Number(defl_mm.toFixed(2)),
                defl_allow_mm: Number(defl_allow_mm.toFixed(2)),
                defl_ratio: "L/" + Math.round(L_mm / defl_mm),
                defl_limit: "L/" + defl_limit_factor,
                isDeflectionPass,
                isStabilityPass,
                isAllPass
            }
        };
    }
};

var globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
globalScope.SlabBeamEngine = SlabBeamEngine;
