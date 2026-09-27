const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/purlin_cladding.js', 'utf8');

const regex = /const steps = \[\];[\s\S]*?(?=return \{ steps,)/;

const newSteps = `const steps = [];
        steps.push(window.createCalculationStep(
            "CALC-PURLIN-001",
            "Đặc trưng Hình học Xà gồ (" + purlin.name + ")",
            { standard: 'Catalogue Xà gồ', section: '' },
            "W_x = " + purlin.Wx + "\\\\text{ cm}^3; \\\\quad W_y = " + purlin.Wy + "\\\\text{ cm}^3",
            "I_x = " + (purlin.Ix).toFixed(2) + "\\\\text{ cm}^4; \\\\quad I_y = " + (purlin.Iy).toFixed(2) + "\\\\text{ cm}^4",
            purlin.Wx,
            "cm3",
            { isPass: true }
        ));
        steps.push(window.createCalculationStep(
            "CALC-PURLIN-002",
            "Tải trọng tác dụng (Tĩnh tải + Hoạt tải mái)",
            { standard: 'TCVN 2737:2023', section: 'Mục 8' },
            "q_{total} = q_{TL} + q_{HL}",
            "q_{y} = " + Py2.toFixed(2) + "\\\\text{ kN/m}; \\\\quad q_{x} = " + Px2.toFixed(2) + "\\\\text{ kN/m}",
            Py2.toFixed(2),
            "kN/m",
            { isPass: true }
        ));
        steps.push(window.createCalculationStep(
            "CALC-PURLIN-003",
            "Kiểm tra Bền chịu uốn xiên (M_x, M_y)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.2.1.1' },
            "\\\\sigma = \\\\frac{M_x}{c_x W_x} + \\\\frac{M_y}{c_y W_y} \\\\le f_y \\\\gamma_c",
            "\\\\sigma = \\\\frac{" + Mx2.toFixed(2) + " \\\\times 10^2}{" + Wx_cm3.toFixed(2) + "} + \\\\frac{" + My2.toFixed(2) + " \\\\times 10^2}{" + Wy_cm3.toFixed(2) + "} = " + sigma2.toFixed(2) + "\\\\text{ kN/cm}^2 \\\\le " + f_allow.toFixed(2) + "\\\\text{ kN/cm}^2",
            sigma2.toFixed(2),
            "kN/cm2",
            { isPass: isStrength2Pass }
        ));
        steps.push(window.createCalculationStep(
            "CALC-PURLIN-004",
            "Kiểm tra Độ võng Xà gồ (Thành phần y)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.3' },
            "\\\\Delta_y = \\\\frac{5}{384} \\\\frac{q_y^c L^4}{E I_x} \\\\le [\\\\Delta] = \\\\frac{L}{200}",
            "\\\\Delta_y = " + (defl2_y_cm * 10).toFixed(2) + "\\\\text{ mm} \\\\le " + (B * 1000 / 200).toFixed(2) + "\\\\text{ mm}",
            (defl2_y_cm * 10).toFixed(2),
            "mm",
            { isPass: isDefl2Pass }
        ));
        
        `;

c = c.replace(regex, newSteps);
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/purlin_cladding.js', c, 'utf8');