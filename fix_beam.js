const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/slab_beam.js', 'utf8');

const regex = /steps\.push\(window\.createCalculationStep\(\s*"CALC-BEAM-001"[\s\S]*?(?=return \{ steps,)/;

const newSteps = `steps.push(window.createCalculationStep(
            "CALC-BEAM-001",
            "Đặc trưng Hình học Tiết diện (" + beam.name + ")",
            { standard: 'TCVN 5575:2024', section: 'Phụ lục B' },
            "W_x = \\\\frac{I_x}{h/2}; \\\\quad S_x = b_f \\\\cdot t_f \\\\cdot (\\\\frac{h-t_f}{2}) + t_w \\\\cdot \\\\frac{(h-2t_f)^2}{8}",
            "W_x = " + (beam.Wx).toFixed(2) + "\\\\text{ cm}^3; \\\\quad I_x = " + (beam.Ix).toFixed(2) + "\\\\text{ cm}^4",
            (beam.Wx).toFixed(2),
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
            "\\\\sigma_x = \\\\frac{" + M_max_kNm.toFixed(2) + " \\\\times 10^3}{1,0 \\\\times " + (beam.Wx).toFixed(2) + "} = " + sigma_uon_MPa.toFixed(2) + "\\\\text{ MPa} \\\\le " + f_allow_MPa.toFixed(2) + "\\\\text{ MPa}",
            sigma_uon_MPa.toFixed(2),
            "MPa",
            { isPass: isBendingPass }
        ));
        steps.push(window.createCalculationStep(
            "CALC-BEAM-004",
            "Kiểm tra Cắt (V)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.2.1.2' },
            "\\\\tau = \\\\frac{V \\\\cdot S_x}{I_x \\\\cdot t_w} \\\\le f_v \\\\cdot \\\\gamma_c",
            "\\\\tau = \\\\frac{" + V_max_kN.toFixed(2) + " \\\\times 10^3 \\\\times " + ((beam.Wx)/2).toFixed(2) + "}{" + (beam.Ix).toFixed(2) + " \\\\times " + beam.tw.toFixed(2) + "} = " + tau_MPa.toFixed(2) + "\\\\text{ MPa} \\\\le " + fv_allow_MPa.toFixed(2) + "\\\\text{ MPa}",
            tau_MPa.toFixed(2),
            "MPa",
            { isPass: isShearPass }
        ));
        steps.push(window.createCalculationStep(
            "CALC-BEAM-005",
            "Kiểm tra Độ võng (\\\\Delta)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.3 & Phụ lục M' },
            "\\\\Delta = \\\\frac{5}{384} \\\\frac{q_k L^4}{E I_x} \\\\le \\\\Delta_{allow}",
            "\\\\Delta = " + (defl_cm * 10).toFixed(2) + "\\\\text{ mm} \\\\le [\\\\Delta] = " + (L_beam * 1000 / 250).toFixed(2) + "\\\\text{ mm (} L/250 \\\\text{)}",
            (defl_cm * 10).toFixed(2),
            "mm",
            { isPass: isDeflectionPass }
        ));
        
        `;

c = c.replace(regex, newSteps);
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/slab_beam.js', c, 'utf8');