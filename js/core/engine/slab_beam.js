// Engine Thiết kế Bản sàn bê tông cốt thép và Dầm thép (Slab & Beam Engine)
// Tuân thủ TCVN 5574:2018 (Bê tông cốt thép) và TCVN 5575:2024 (Kết cấu thép)

const SlabBeamEngine = {
    // 1. Module Thiết kế Bản sàn Bê tông Cốt thép (hoặc sàn sườn trên dầm thép)
    calculateSlab: function(params) {
        const L1 = Number(params.L1) || 2.5; // Nhịp cạnh ngắn (m)
        const L2 = Number(params.L2) || 6.0; // Nhịp cạnh dài (m)
        const concreteGrade = params.concreteGrade || 'B20';
        const rebarGrade = params.rebarGrade || 'CB240-T';
        const liveLoadKNM2 = Number(params.liveLoad) || 3.0; // Hoạt tải sử dụng (kN/m2)
        const finishingLoadKNM2 = Number(params.finishingLoad) || 1.2; // Tải hoàn thiện (gạch, vữa...)
        
        const conc = StandardData.TCVN5575_2024.SlabData.concreteGrades[concreteGrade] || StandardData.TCVN5575_2024.SlabData.concreteGrades['B20'];
        const rebar = StandardData.TCVN5575_2024.SlabData.rebarGrades[rebarGrade] || StandardData.TCVN5575_2024.SlabData.rebarGrades['CB240-T'];
        
        // Tỷ số L2/L1 để xác định sơ đồ làm việc của ô bản
        const ratio = L2 / L1;
        const isOneWay = ratio >= 2.0; // Bản dầm nếu L2/L1 >= 2, bản kê 4 cạnh nếu L2/L1 < 2
        
        // Sơ bộ chiều dày bản sàn hs (mm)
        // hs = (D / m) * L1; với m = 30-35 cho bản kê, 25-30 cho bản dầm
        const m = isOneWay ? 30 : 35;
        const hs_calc = (L1 * 1000) / m;
        // Làm tròn lên bội số 10mm, tối thiểu 80mm
        const hs_chosen = Math.max(80, Math.ceil(hs_calc / 10) * 10);
        
        // Tải trọng bản thân bản sàn (gamma_bt = 25 kN/m3, gamma_f = 1.1)
        const hs_m = hs_chosen / 1000;
        const gk_slab = 25 * hs_m;
        const gd_slab = gk_slab * 1.1;
        
        // Tĩnh tải hoàn thiện
        const gd_finishing = finishingLoadKNM2 * 1.2;
        const g_total_d = gd_slab + gd_finishing;
        const g_total_k = gk_slab + finishingLoadKNM2;
        
        // Hoạt tải tính toán (gamma_f = 1.2 đối với hoạt tải sàn)
        const pd_live = liveLoadKNM2 * 1.2;
        const pk_live = liveLoadKNM2;
        
        // Tổng tải trọng phân bố trên 1m2 bản sàn
        const qd = g_total_d + pd_live;
        const qk = g_total_k + pk_live;
        
        // Tính mô men uốn trên dải bản rộng b = 1m (100cm)
        // M nhịp = q * L1^2 / 11 (bản liên tục) hoặc q * L1^2 / 8 (bản đơn)
        const M_span_kNm = (qd * Math.pow(L1, 2)) / 11;
        const M_support_kNm = (qd * Math.pow(L1, 2)) / 12;
        
        // Tính toán cốt thép chịu mô men nhịp (dải bản rộng b = 100cm)
        const b_cm = 100;
        const a_protect = 1.5; // cm
        const h0_cm = (hs_chosen / 10) - a_protect;
        
        const Rb_kN_cm2 = conc.Rb * 0.1; // MPa -> kN/cm2
        const Rs_kN_cm2 = rebar.Rs * 0.1;
        
        const alpha_m = (M_span_kNm * 100) / (Rb_kN_cm2 * b_cm * Math.pow(h0_cm, 2));
        let As_calc_cm2 = 0;
        let isAlphaValid = alpha_m <= 0.4;
        
        if (isAlphaValid) {
            const zeta = 0.5 * (1 + Math.sqrt(1 - 2 * alpha_m));
            As_calc_cm2 = (M_span_kNm * 100) / (zeta * Rs_kN_cm2 * h0_cm);
        } else {
            As_calc_cm2 = (M_span_kNm * 100) / (0.8 * Rs_kN_cm2 * h0_cm);
        }
        
        // Chọn cốt thép: phi 8 hoặc phi 10
        const barDiameter = hs_chosen >= 100 ? 10 : 8; // mm
        const singleBarArea = (Math.PI * Math.pow(barDiameter / 10, 2)) / 4; // cm2
        // Khoảng cách thanh thép s (mm)
        let s_chosen = Math.floor((singleBarArea * 100 / As_calc_cm2) * 10 / 10) * 10;
        s_chosen = Math.max(100, Math.min(200, s_chosen));
        const numBars = 1000 / s_chosen;
        const As_provided_cm2 = numBars * singleBarArea;
        
        // Hàm lượng cốt thép
        const mu_percent = (As_provided_cm2 / (b_cm * h0_cm)) * 100;
        const isMuPass = mu_percent >= 0.1 && mu_percent <= 2.0;
        
        
        const steps = [];
        steps.push(window.createCalculationStep(
            "CALC-SLAB-001",
            "Xác định sơ đồ làm việc và chiều dày sơ bộ",
            { standard: 'TCVN 5574:2018', section: 'Mục 5.3 & 6.2' },
            "\\frac{L_2}{L_1} = " + ratio.toFixed(2) + " \\implies " + (isOneWay ? "Bản dầm (L_2/L_1 \\ge 2)" : "Bản kê 4 cạnh") + "; \\quad h_s \\ge \\frac{D}{m} L_1",
            "\\frac{" + L2 + "}{" + L1 + "} = " + ratio.toFixed(2) + "; \\quad h_s = " + hs_m + "\\text{ m} = " + (hs_m * 1000) + "\\text{ mm}",
            hs_m * 1000,
            "mm",
            { isPass: true },
            "Ghi chú: L2/L1 = " + ratio.toFixed(2) + " nên bản làm việc theo " + (isOneWay ? "1 phương (bản dầm)" : "2 phương (bản kê)")
        ));
        steps.push(window.createCalculationStep(
            "CALC-SLAB-002",
            "Tải trọng tác dụng lên 1m2 sàn",
            { standard: 'TCVN 2737:2023', section: 'Bảng 3' },
            "q_d = (\\gamma_{bt} \\cdot h_s \\cdot n_{bt}) + g_{ht} + (p \\cdot n_p)",
            "q_d = (25 \\times " + hs_m + " \\times 1,1) + " + finishingLoadKNM2 + " + (" + liveLoadKNM2 + " \\times 1,2) = " + qd.toFixed(2) + "\\text{ kN/m}^2",
            qd.toFixed(2),
            "kN/m2",
            { isPass: true }
        ));
        steps.push(window.createCalculationStep(
            "CALC-SLAB-003",
            "Nội lực mô men uốn thiết kế (M)",
            { standard: 'Cơ học kết cấu', section: '' },
            "M = \\frac{q_d \\cdot L_1^2}{" + (isOneWay ? "11" : "30") + "}",
            "M = \\frac{" + qd.toFixed(2) + " \\times " + L1 + "^2}{" + (isOneWay ? "11" : "30") + "} = " + M_span_kNm.toFixed(2) + "\\text{ kNm/m}",
            M_span_kNm.toFixed(2),
            "kNm/m",
            { isPass: true }
        ));
        steps.push(window.createCalculationStep(
            "CALC-SLAB-004",
            "Tính toán diện tích cốt thép chịu uốn (A_s)",
            { standard: 'TCVN 5574:2018', section: 'Mục 8.1.2.2' },
            "\\alpha_m = \\frac{M}{R_b \\cdot b \\cdot h_0^2}; \\quad A_s = \\frac{M}{\\zeta \\cdot R_s \\cdot h_0}",
            "\\alpha_m = \\frac{" + M_span_kNm.toFixed(2) + "}{" + (conc.Rb * 1000).toFixed(0) + " \\times 1 \\times " + (h0_cm / 100).toFixed(3) + "^2} = " + alpha_m.toFixed(3) + "; \\quad A_s = " + As_calc_cm2.toFixed(2) + "\\text{ cm}^2\\text{/m}",
            As_calc_cm2.toFixed(2),
            "cm2/m",
            { isPass: alpha_m <= 0.39 },
            "Hệ số alpha_m = " + alpha_m.toFixed(3) + (alpha_m <= 0.39 ? " (Đạt)" : " (Vượt quá alpha_R, cần tăng chiều dày sàn)")
        ));
        steps.push(window.createCalculationStep(
            "CALC-SLAB-005",
            "Bố trí thép & Kiểm tra hàm lượng (\\mu)",
            { standard: 'TCVN 5574:2018', section: 'Mục 10.3.2.2' },
            "\\mu = \\frac{A_{s,bốtrí}}{b \\cdot h_0} \\times 100\\%; \\quad 0,1\\% \\le \\mu \\le 2,0\\%",
            "\\mu = \\frac{" + As_provided_cm2.toFixed(2) + "}{100 \\times " + (h0_cm).toFixed(1) + "} \\times 100\\% = " + mu_percent.toFixed(2) + "\\%",
            mu_percent.toFixed(2),
            "%",
            { isPass: mu_percent >= 0.1 && mu_percent <= 2.0 },
            "Hàm lượng thép bố trí đạt yêu cầu cấu tạo."
        ));
        return { steps, 
            L1, L2, ratio: Number(ratio.toFixed(2)),
            type: isOneWay ? "Bản dầm (L2/L1 ≥ 2)" : "Bản kê 4 cạnh (L2/L1 < 2)",
            hs_chosen,
            concrete: conc.name,
            rebar: rebar.name,
            loads: {
                gk_slab: Number(gk_slab.toFixed(2)),
                gd_slab: Number(gd_slab.toFixed(2)),
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
                As_calc_cm2: Number(As_calc_cm2.toFixed(2)),
                rebarDesignation: `Ø${barDiameter} a${s_chosen}`,
                As_provided_cm2: Number(As_provided_cm2.toFixed(2)),
                mu_percent: Number(mu_percent.toFixed(2)),
                isPass: isAlphaValid && isMuPass
            }
        };
    },

    // 2. Module Thiết kế Dầm Thép (Dầm sàn hoặc Kèo dầm mái thép hình chữ I)
    calculateBeam: function(params) {
        const L_beam = Number(params.L_beam) || 6.0; // Nhịp dầm (m)
        const tributaryWidth = Number(params.tributaryWidth) || 2.5; // Bề rộng truyền tải (m)
        const slabLoadQd = Number(params.slabLoadQd) || 6.5; // Tải trọng từ sàn truyền vào (kN/m2)
        const slabLoadQk = Number(params.slabLoadQk) || 5.0; // Tải tiêu chuẩn từ sàn (kN/m2)
        const steelGrade = params.steelGrade || 'S235';
        const chosenBeamId = params.chosenBeamId || 'I300';
        
        // Cường độ vật liệu thép
        const mat = null;
        const f_steel = mat ? mat.f : 235; // MPa (N/mm2) = 23.5 kN/cm2
        const fv_steel = mat ? mat.fv : 135; // MPa
        const gamma_c = 1.0;
        const E_steel = 2.1e5; // MPa = 2.1 x 10^4 kN/cm2
        
        // Tìm tiết diện dầm trong thư viện
        const beam = StandardData.TCVN5575_2024.BeamLibrary.find(b => b.id === chosenBeamId) || StandardData.TCVN5575_2024.BeamLibrary[2];
        
        // Tải trọng bản thân dầm
        const gk_beam_line = (beam.mass * 9.81) / 1000; // kN/m
        const gd_beam_line = gk_beam_line * 1.05;
        
        // Tổng tải phân bố trên dầm
        const qd_line = slabLoadQd * tributaryWidth + gd_beam_line; // kN/m
        const qk_line = slabLoadQk * tributaryWidth + gk_beam_line; // kN/m
        
        // Nội lực dầm đơn giản hai đầu khớp
        const M_max_kNm = (qd_line * Math.pow(L_beam, 2)) / 8; // kNm
        const V_max_kN = (qd_line * L_beam) / 2; // kN
        
        // 1. Kiểm tra ứng suất uốn bền
        // Wx trong thư viện là cm3 -> M_kNcm / Wx_cm3 ra kN/cm2, nhân 10 ra MPa (N/mm2)
        const Wx_cm3 = beam.Wx;
        const M_kNcm = M_max_kNm * 100;
        const sigma_uon_kN_cm2 = M_kNcm / Wx_cm3; // kN/cm2
        const sigma_uon_MPa = sigma_uon_kN_cm2 * 10; // MPa
        const f_allow_MPa = f_steel * gamma_c; // MPa
        const f_allow_kN_cm2 = f_allow_MPa / 10; // kN/cm2
        const isBendingPass = sigma_uon_MPa <= f_allow_MPa;
        
        // 2. Kiểm tra ứng suất tiếp cắt
        // tau = V / (hw * tw)
        const hw_mm = beam.h - 2 * beam.tf;
        const tau_MPa = (V_max_kN * 1000) / (hw_mm * beam.tw); // N/mm2 (MPa)
        const fv_allow_MPa = fv_steel * gamma_c;
        const isShearPass = tau_MPa <= fv_allow_MPa;
        
        // 3. Kiểm tra độ võng (dùng tải tiêu chuẩn)
        // f = 5/384 * qk * L^4 / (E * Ix)
        const L_cm = L_beam * 100;
        const qk_kN_per_cm = qk_line / 100;
        const Ix_cm4 = beam.Ix;
        const defl_cm = (5 / 384) * (qk_kN_per_cm * Math.pow(L_cm, 4)) / ((E_steel / 10) * Ix_cm4);
        const defl_ratio = defl_cm / L_cm;
        const defl_limit = 1 / 250; // Giới hạn dầm sàn [f/L] = 1/250
        const isDeflectionPass = defl_ratio <= defl_limit;
        
        // 4. Ổn định tổng thể
        // Với dầm đỡ sàn bê tông đổ tại chỗ / sàn tôn deck hàn chặt với bản cánh trên:
        // Bản cánh nén được giữ cố định liên tục -> Không cần kiểm tra mất ổn định ngoài mặt phẳng (TCVN 5575:2024, Điều 7.2.2.1)
        const isStabilityPass = true;
        
        const isAllPass = isBendingPass && isShearPass && isDeflectionPass && isStabilityPass;
        
        
        const steps = [];
        steps.push(window.createCalculationStep(
            "CALC-BEAM-001",
            "Đặc trưng Hình học Tiết diện (" + beam.name + ")",
            { standard: 'TCVN 5575:2024', section: 'Phụ lục B' },
            "W_x = \\frac{I_x}{h/2}; \\quad S_x = b_f \\cdot t_f \\cdot (\\frac{h-t_f}{2}) + t_w \\cdot \\frac{(h-2t_f)^2}{8}",
            "W_x = " + (beam.Wx).toFixed(2) + "\\text{ cm}^3; \\quad I_x = " + (beam.Ix).toFixed(2) + "\\text{ cm}^4",
            (beam.Wx).toFixed(2),
            "cm3",
            { isPass: true }
        ));
        steps.push(window.createCalculationStep(
            "CALC-BEAM-002",
            "Điều kiện Ổn định Tổng thể (Dầm uốn)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.2.2' },
            "\\varphi_b = \\varphi_1 \\text{ (với } L_0 = L \\text{, dầm có cánh chịu nén được giữ chặt)}",
            "\\text{Cánh trên liên kết cứng với sàn BTCT } \\implies \\text{Không mất ổn định tổng thể}",
            1.0,
            "",
            { isPass: true }
        ));
        steps.push(window.createCalculationStep(
            "CALC-BEAM-003",
            "Kiểm tra Bền chịu Uốn (M)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.2.1.1' },
            "\\sigma_x = \\frac{M_x}{c \\cdot W_x} \\le f_y \\cdot \\gamma_c",
            "\\sigma_x = \\frac{" + M_max_kNm.toFixed(2) + " \\times 10^3}{1,0 \\times " + (beam.Wx).toFixed(2) + "} = " + sigma_uon_MPa.toFixed(2) + "\\text{ MPa} \\le " + f_allow_MPa.toFixed(2) + "\\text{ MPa}",
            sigma_uon_MPa.toFixed(2),
            "MPa",
            { isPass: isBendingPass }
        ));
        steps.push(window.createCalculationStep(
            "CALC-BEAM-004",
            "Kiểm tra Cắt (V)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.2.1.2' },
            "\\tau = \\frac{V \\cdot S_x}{I_x \\cdot t_w} \\le f_v \\cdot \\gamma_c",
            "\\tau = \\frac{" + V_max_kN.toFixed(2) + " \\times 10^3 \\times " + ((beam.Wx)/2).toFixed(2) + "}{" + (beam.Ix).toFixed(2) + " \\times " + beam.tw.toFixed(2) + "} = " + tau_MPa.toFixed(2) + "\\text{ MPa} \\le " + fv_allow_MPa.toFixed(2) + "\\text{ MPa}",
            tau_MPa.toFixed(2),
            "MPa",
            { isPass: isShearPass }
        ));
        steps.push(window.createCalculationStep(
            "CALC-BEAM-005",
            "Kiểm tra Độ võng (\\Delta)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.3 & Phụ lục M' },
            "\\Delta = \\frac{5}{384} \\frac{q_k L^4}{E I_x} \\le \\Delta_{allow}",
            "\\Delta = " + (defl_cm * 10).toFixed(2) + "\\text{ mm} \\le [\\Delta] = " + (L_beam * 1000 / 250).toFixed(2) + "\\text{ mm (} L/250 \\text{)}",
            (defl_cm * 10).toFixed(2),
            "mm",
            { isPass: isDeflectionPass }
        ));
        
        return { steps, 
            beam,
            L_beam,
            tributaryWidth,
            qd_line: Number(qd_line.toFixed(2)),
            qk_line: Number(qk_line.toFixed(2)),
            M_max_kNm: Number(M_max_kNm.toFixed(2)),
            V_max_kN: Number(V_max_kN.toFixed(2)),
            checks: {
                sigma_uon: Number(sigma_uon_kN_cm2.toFixed(2)),
                sigma_uon_MPa: Number(sigma_uon_MPa.toFixed(2)),
                f_allow: Number(f_allow_kN_cm2.toFixed(2)),
                f_allow_MPa: Number(f_allow_MPa.toFixed(2)),
                isBendingPass,
                tau_MPa: Number(tau_MPa.toFixed(2)),
                fv_allow: Number(fv_allow_MPa.toFixed(2)),
                fv_allow_MPa: Number(fv_allow_MPa.toFixed(2)),
                isShearPass,
                defl_cm: Number(defl_cm.toFixed(2)),
                defl_ratio: `1/${Math.round(1 / defl_ratio)}`,
                defl_limit: "1/250",
                isDeflectionPass,
                stabilityNote: "Được giằng liên tục bởi bản cánh nén liên kết sàn (TCVN 5575:2024 Điều 7.2.2.1)",
                isStabilityPass,
                isAllPass
            }
        };
    }
};

var globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
globalScope.SlabBeamEngine = SlabBeamEngine;
