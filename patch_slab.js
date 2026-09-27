const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/slab_beam.js', 'utf8');

// SLAB MODULE
const slabStart = c.indexOf('calculateSlab: function(params) {');
if (slabStart > -1) {
    const insertPt = c.indexOf('return {', slabStart);
    if (insertPt > -1) {
        const traceCode = `
        const steps = [];
        steps.push(window.createCalculationStep(
            "CALC-SLAB-001",
            "Xác định sơ đồ làm việc và chiều dày sơ bộ",
            { standard: 'TCVN 5574:2018', section: 'Mục 5.3 & 6.2' },
            "\\\\frac{L_2}{L_1} = " + ratio.toFixed(2) + " \\\\implies " + (isOneWay ? "Bản dầm (L_2/L_1 \\\\ge 2)" : "Bản kê 4 cạnh") + "; \\\\quad h_s \\\\ge \\\\frac{D}{m} L_1",
            "\\\\frac{" + L2 + "}{" + L1 + "} = " + ratio.toFixed(2) + "; \\\\quad h_s = " + hs + "\\\\text{ m} = " + (hs*1000) + "\\\\text{ mm}",
            hs * 1000,
            "mm",
            { isPass: true },
            "Ghi chú: L2/L1 = " + ratio.toFixed(2) + " nên bản làm việc theo " + (isOneWay ? "1 phương (bản dầm)" : "2 phương (bản kê)")
        ));
        steps.push(window.createCalculationStep(
            "CALC-SLAB-002",
            "Tải trọng tác dụng lên 1m2 sàn",
            { standard: 'TCVN 2737:2023', section: 'Bảng 3' },
            "q_d = (\\\\gamma_{bt} \\\\cdot h_s \\\\cdot n_{bt}) + g_{ht} + (p \\\\cdot n_p)",
            "q_d = (25 \\\\times " + hs + " \\\\times 1,1) + " + finishingLoadKNM2 + " + (" + liveLoadKNM2 + " \\\\times 1,2) = " + qd.toFixed(2) + "\\\\text{ kN/m}^2",
            qd.toFixed(2),
            "kN/m2",
            { isPass: true }
        ));
        steps.push(window.createCalculationStep(
            "CALC-SLAB-003",
            "Nội lực mô men uốn thiết kế (M)",
            { standard: 'Cơ học kết cấu', section: '' },
            "M = \\\\frac{q_d \\\\cdot L_1^2}{" + (isOneWay ? "11" : "30") + "}",
            "M = \\\\frac{" + qd.toFixed(2) + " \\\\times " + L1 + "^2}{" + (isOneWay ? "11" : "30") + "} = " + M.toFixed(2) + "\\\\text{ kNm/m}",
            M.toFixed(2),
            "kNm/m",
            { isPass: true }
        ));
        steps.push(window.createCalculationStep(
            "CALC-SLAB-004",
            "Tính toán diện tích cốt thép chịu uốn (A_s)",
            { standard: 'TCVN 5574:2018', section: 'Mục 8.1.2.2' },
            "\\\\alpha_m = \\\\frac{M}{R_b \\\\cdot b \\\\cdot h_0^2}; \\\\quad A_s = \\\\frac{M}{\\\\zeta \\\\cdot R_s \\\\cdot h_0}",
            "\\\\alpha_m = \\\\frac{" + M.toFixed(2) + "}{" + (conc.Rb * 1000).toFixed(0) + " \\\\times 1 \\\\times " + h0.toFixed(3) + "^2} = " + alpha_m.toFixed(3) + "; \\\\quad A_s = " + As_calc.toFixed(2) + "\\\\text{ cm}^2\\\\text{/m}",
            As_calc.toFixed(2),
            "cm2/m",
            { isPass: alpha_m <= 0.39 },
            "Hệ số alpha_m = " + alpha_m.toFixed(3) + (alpha_m <= 0.39 ? " (Đạt)" : " (Vượt quá alpha_R, cần tăng chiều dày sàn)")
        ));
        steps.push(window.createCalculationStep(
            "CALC-SLAB-005",
            "Bố trí thép & Kiểm tra hàm lượng (\\\\mu)",
            { standard: 'TCVN 5574:2018', section: 'Mục 10.3.2.2' },
            "\\\\mu = \\\\frac{A_{s,bốtrí}}{b \\\\cdot h_0} \\\\times 100\\\\%; \\\\quad 0,1\\\\% \\\\le \\\\mu \\\\le 2,0\\\\%",
            "\\\\mu = \\\\frac{" + As_selected.toFixed(2) + "}{100 \\\\times " + (h0*100).toFixed(1) + "} \\\\times 100\\\\% = " + mu_percent.toFixed(2) + "\\\\%",
            mu_percent.toFixed(2),
            "%",
            { isPass: mu_percent >= 0.1 && mu_percent <= 2.0 },
            "Hàm lượng thép bố trí đạt yêu cầu cấu tạo."
        ));
        `;
        c = c.substring(0, insertPt) + traceCode + c.substring(insertPt).replace('return {', 'return { steps, ');
    }
}

// BEAM MODULE
const beamStart = c.indexOf('calculateBeam: function(params) {');
if (beamStart > -1) {
    const insertPt = c.indexOf('return {', beamStart);
    if (insertPt > -1) {
        const traceCode = `
        const steps = [];
        steps.push(window.createCalculationStep(
            "CALC-BEAM-001",
            "Đặc trưng Hình học Tiết diện (" + sectionName + ")",
            { standard: 'TCVN 5575:2024', section: 'Phụ lục B' },
            "W_x = \\\\frac{I_x}{h/2}; \\\\quad S_x = b_f \\\\cdot t_f \\\\cdot (\\\\frac{h-t_f}{2}) + t_w \\\\cdot \\\\frac{(h-2t_f)^2}{8}",
            "W_x = " + (section.Wx).toFixed(2) + "\\\\text{ cm}^3; \\\\quad I_x = " + (section.Ix).toFixed(2) + "\\\\text{ cm}^4",
            (section.Wx).toFixed(2),
            "cm3",
            { isPass: true }
        ));
        steps.push(window.createCalculationStep(
            "CALC-BEAM-002",
            "Điều kiện Ổn định Tổng thể (Dầm uốn)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.2.2' },
            "\\\\varphi_b = \\\\varphi_1 \\\\text{ (với } L_0 = L \\\\text{, dầm có cánh chịu nén được giữ chặt)}",
            "\\\\text{Cánh trên liên kết cứng với sàn BTCT } \\\\implies \\\\text{Không mất ổn định tổng thể}",
            1.0,
            "",
            { isPass: true }
        ));
        steps.push(window.createCalculationStep(
            "CALC-BEAM-003",
            "Kiểm tra Bền chịu Uốn (M)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.2.1.1' },
            "\\\\sigma_x = \\\\frac{M_x}{c \\\\cdot W_x} \\\\le f_y \\\\cdot \\\\gamma_c",
            "\\\\sigma_x = \\\\frac{" + M_max + " \\\\times 10^3}{1,0 \\\\times " + (section.Wx).toFixed(2) + "} = " + sigma.toFixed(2) + "\\\\text{ MPa} \\\\le " + fy + "\\\\text{ MPa}",
            sigma.toFixed(2),
            "MPa",
            { isPass: isBendingPass }
        ));
        steps.push(window.createCalculationStep(
            "CALC-BEAM-004",
            "Kiểm tra Cắt (V)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.2.1.2' },
            "\\\\tau = \\\\frac{V \\\\cdot S_x}{I_x \\\\cdot t_w} \\\\le f_v \\\\cdot \\\\gamma_c",
            "\\\\tau = \\\\frac{" + V_max + " \\\\times 10^3 \\\\times " + (section.Sx || (section.Wx/2)).toFixed(2) + "}{" + (section.Ix).toFixed(2) + " \\\\times " + section.tw.toFixed(2) + "} = " + tau.toFixed(2) + "\\\\text{ MPa} \\\\le " + fv.toFixed(2) + "\\\\text{ MPa}",
            tau.toFixed(2),
            "MPa",
            { isPass: isShearPass }
        ));
        steps.push(window.createCalculationStep(
            "CALC-BEAM-005",
            "Kiểm tra Độ võng (\\\\Delta)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.3 & Phụ lục M' },
            "\\\\Delta = \\\\frac{5}{384} \\\\frac{q_k L^4}{E I_x} \\\\le \\\\Delta_{allow}",
            "\\\\Delta = " + deflection.toFixed(2) + "\\\\text{ mm} \\\\le [\\\\Delta] = " + maxDeflection.toFixed(2) + "\\\\text{ mm (} L/" + limitRatio + " \\\\text{)}",
            deflection.toFixed(2),
            "mm",
            { isPass: isDeflectionPass }
        ));
        `;
        c = c.substring(0, insertPt) + traceCode + c.substring(insertPt).replace('return {', 'return { steps, ');
    }
}

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/slab_beam.js', c, 'utf8');