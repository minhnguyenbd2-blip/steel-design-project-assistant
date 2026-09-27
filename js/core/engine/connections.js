// Connection Design Engine

function calculateBasePlate(N_kN, M_kNm, V_kN, section, concreteGrade = 'B20') {
    const steps = [];
    const N = Math.abs(N_kN);
    const M = Math.abs(M_kNm);

    // 1. Vật liệu bê tông
    let Rb = 11.5; // MPa (kN/cm2 = 1.15) cho B20
    if (concreteGrade === 'B25') Rb = 14.5;
    
    const Rb_cm2 = Rb / 10; // kN/cm2
    
    steps.push(createCalculationStep(
        "CALC-CONN-001",
        "Cường độ chịu nén của bê tông móng",
        { standard: 'TCVN 5574:2018', table: 'Bảng 7' },
        "R_b",
        `R_b = ${Rb_cm2} \\text{ kN/cm}^2 \\text{ (cho cấp ${concreteGrade})}`,
        Number(Rb_cm2.toFixed(3)),
        "kN/cm^2"
    ));

    // 2. Chiều rộng bản đế
    const c1 = 100; // mm
    const B_bd = section.b + 2 * c1;
    const B_bd_cm = B_bd / 10;

    steps.push(createCalculationStep(
        "CALC-CONN-002",
        "Bề rộng bản đế",
        { standard: 'Lý thuyết Thiết kế Kết cấu thép', section: 'Chân cột' },
        "B_{bd} = b_c + 2c_1",
        `B_{bd} = ${section.b} + 2 \\times ${c1}`,
        B_bd,
        "mm"
    ));

    // 3. Hệ số ép cục bộ
    const alpha = 1;
    const phi_b = 1.1; // Chon phi_b = 1.1 (Theo GT)
    const Rb_loc = alpha * phi_b * Rb_cm2;

    steps.push(createCalculationStep(
        "CALC-CONN-003",
        "Cường độ chịu nén cục bộ của bê tông móng",
        { standard: 'Lý thuyết Thiết kế Kết cấu thép', section: 'Chân cột' },
        "R_{b,loc} = \\alpha \\times \\varphi_b \\times R_b",
        `R_{b,loc} = ${alpha} \\times ${phi_b} \\times ${Rb_cm2}`,
        Number(Rb_loc.toFixed(3)),
        "kN/cm^2"
    ));

    // 4. Chiều dài bản đế (Lbd)
    // Lbd >= N/(2*Bbd*0.75*Rb_loc) + sqrt(...) + 6M/(Bbd*0.75*Rb_loc) -> Công thức (1) trong đồ án
    const psi = 0.75;
    const term1 = N / (2 * B_bd_cm * psi * Rb_loc);
    const term2 = 6 * (M * 100) / (B_bd_cm * psi * Rb_loc);
    const L_bd_min = term1 + Math.sqrt(Math.pow(term1, 2) + term2);

    steps.push(createCalculationStep(
        "CALC-CONN-004",
        "Chiều dài bản đế yêu cầu",
        { standard: 'Lý thuyết Thiết kế Kết cấu thép', section: 'Chân cột' },
        "L_{bd} \\ge \\frac{N}{2 B_{bd} \\psi R_{b,loc}} + \\sqrt{ \\left( \\dots \\right)^2 + \\frac{6M}{B_{bd} \\psi R_{b,loc}} }",
        `L_{bd} \\ge ${term1.toFixed(2)} + \\sqrt{ ${term1.toFixed(2)}^2 + ${term2.toFixed(2)} }`,
        Number(L_bd_min.toFixed(2)),
        "cm",
        {
            conditionLaTeX: `L_{bd} \\ge L_{bd,min}`,
            isPass: true
        }
    ));

    // 5. Chọn Lbd thực tế
    const L_bd_chosen = Math.ceil(L_bd_min / 5) * 5; // Làm tròn lên bội số của 5

    steps.push(createCalculationStep(
        "CALC-CONN-005",
        "Chọn chiều dài bản đế thực tế",
        { standard: 'Cấu tạo', section: 'Chân cột' },
        "L_{bd} = \\text{Chọn làm tròn}",
        `L_{bd} \\text{ được chọn lớn hơn } ${L_bd_min.toFixed(2)}`,
        L_bd_chosen,
        "cm"
    ));

    return { steps, L_bd_chosen, success: true };
}

const globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
globalScope.calculateBasePlate = calculateBasePlate;
