const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/purlin_cladding.js', 'utf8');

if (c.indexOf('const steps = [];') === -1) {
    // We need to inject steps inside designPurlin.
    // Let's replace the return object to include steps.
    const returnStart = c.indexOf('return {', c.indexOf('designPurlin: function'));
    if (returnStart > -1) {
        const traceCode = `
        const steps = [];
        steps.push(window.createCalculationStep(
            "CALC-PURLIN-001",
            "Đặc trưng Hình học Xà gồ (" + profile.name + ")",
            { standard: 'Catalogue Xà gồ', section: '' },
            "W_x = " + profile.Wx + "\\\\text{ cm}^3; \\\\quad W_y = " + profile.Wy + "\\\\text{ cm}^3",
            "I_x = " + profile.Ix + "\\\\text{ cm}^4; \\\\quad I_y = " + profile.Iy + "\\\\text{ cm}^4",
            profile.Wx,
            "cm3",
            { isPass: true }
        ));
        steps.push(window.createCalculationStep(
            "CALC-PURLIN-002",
            "Tải trọng tác dụng (Tĩnh tải + Hoạt tải mái)",
            { standard: 'TCVN 2737:2023', section: 'Mục 8' },
            "q_{total} = q_{TL} + q_{HL}",
            "q_{y} = " + q_max_y.toFixed(2) + "\\\\text{ kN/m}; \\\\quad q_{x} = " + q_max_x.toFixed(2) + "\\\\text{ kN/m}",
            q_max_y.toFixed(2),
            "kN/m",
            { isPass: true }
        ));
        steps.push(window.createCalculationStep(
            "CALC-PURLIN-003",
            "Kiểm tra Bền chịu uốn xiên (M_x, M_y)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.2.1.1' },
            "\\\\sigma = \\\\frac{M_x}{c_x W_x} + \\\\frac{M_y}{c_y W_y} \\\\le f_y \\\\gamma_c",
            "\\\\sigma = \\\\frac{" + Mx_combo1.toFixed(2) + " \\\\times 10^3}{" + profile.Wx + "} + \\\\frac{" + My_combo1.toFixed(2) + " \\\\times 10^3}{" + profile.Wy + "} = " + sigma_combo1.toFixed(2) + "\\\\text{ MPa} \\\\le " + fy + "\\\\text{ MPa}",
            sigma_combo1.toFixed(2),
            "MPa",
            { isPass: isStr1Pass }
        ));
        steps.push(window.createCalculationStep(
            "CALC-PURLIN-004",
            "Kiểm tra Độ võng Xà gồ (Thành phần y)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.3' },
            "\\\\Delta_y = \\\\frac{5}{384} \\\\frac{q_y^c L^4}{E I_x} \\\\le [\\\\Delta] = \\\\frac{L}{200}",
            "\\\\Delta_y = " + defl2_y.toFixed(2) + "\\\\text{ mm} \\\\le " + defl_limit.toFixed(2) + "\\\\text{ mm}",
            defl2_y.toFixed(2),
            "mm",
            { isPass: isDefl2Pass }
        ));
        `;
        c = c.substring(0, returnStart) + traceCode + c.substring(returnStart).replace('return {', 'return { steps, ');
        fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/purlin_cladding.js', c, 'utf8');
    }
}
