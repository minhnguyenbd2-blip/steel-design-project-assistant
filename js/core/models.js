// Core Data Models for Steel Design Project Assistant
// Chuẩn hóa theo Đồ án Mẫu và TCVN 2737:2023 / TCVN 5575:2024

const ProjectState = {
    meta: {
        studentName: "Đỗ Minh Nguyên",
        studentId: "22520100438",
        projectName: "Nhà thể thao đa năng",
        projectType: "Công trình thể thao phức hợp",
        usage: "Nhà thi đấu thể thao & dịch vụ đa năng",
        location: "Bình Dương",
    },
    inputs: {
        // Thông số hình học chính theo đề bài
        L: 25.0,           // Nhịp khung ngang (m)
        B: 9.0,            // Bước cột khung (m)
        length: 72.0,      // Chiều dài toàn bộ nhà (m)
        H_column: 8.0,     // Chiều cao đỉnh cột (m)
        H_roof: 9.25,      // Chiều cao đỉnh mái (m)
        roofSlope: 10.0,   // Độ dốc mái i (%) = (9.25 - 8.0) / (25 / 2) * 100
        
        // Điều kiện tính toán & Tiêu chuẩn
        windZone: "II",             // Vùng gió (I, II, III, IV, V)
        terrainCategory: "B",       // Dạng địa hình (A, B, C)
        porosityPercent: 0,         // Độ hở của tường chắn bao che μ (%) (Mục F.12)
        internalPressureSign: "unfavorable",  // Dấu áp lực trong bất lợi nhất (unfavorable, + hoặc -)
        
        // Vật liệu chính
        steelGrade: "S235",         // Mác thép kết cấu
        boltGrade: "5.8",           // Cấp bền bu lông
        weldType: "E43",            // Que hàn
        
        // Chiều dài tính toán cột
        L_col_actual: 8.0,
        mu_x_type: "fixed-free",    // Ngàm - tự do (μ = 2.0)
        mu_y_type: "pinned-pinned", // Khớp - khớp (μ = 1.0)
        
        // Thiết kế Tôn lợp và Xà gồ mái
        selectedCladdingId: "tole-050", // Tôn 5 dem (0.50 mm) 5 sóng
        selectedPurlinId: "Z25019",     // Xà gồ Z250 x 79 x 74 x 1.9 (Đồ án mẫu)
        purlinSpacing: 1.2,             // Bước xà gồ a (m)
        
        // Thiết kế Sàn BTCT & Dầm sàn
        slabParams: {
            L1: 2.5,
            L2: 9.0,
            liveLoad: 4.0, // kN/m2 (khu thể thao)
            finishingLoad: 1.2,
            concreteGrade: 'B25',
            rebarGrade: 'CB240-T'
        },
        beamParams: {
            L_beam: 9.0,
            tributaryWidth: 2.5,
            chosenBeamId: 'I350'
        }
    },
    // Thành phần tĩnh tải mái tự động cập nhật từ tôn lợp và xà gồ đã chọn
    roofComponents: [
        { name: "Tôn lợp mái (5 dem 0,50 mm)", value: 0.0478, unit: "kN/m2" },
        { name: "Xà gồ Z250x1.9 (bước xà gồ 1,2 m)", value: 0.0536, unit: "kN/m2" },
        { name: "Lớp cách nhiệt chống nóng", value: 0.0200, unit: "kN/m2" },
        { name: "Hệ giằng mái và phụ kiện", value: 0.0300, unit: "kN/m2" }
    ],
    // Ma trận các tổ hợp nội lực từ ETABS / SAP2000 (Có thể thêm/bớt tùy ý)
    forces: [
        { id: "CB1", name: "THCB 1 (Tĩnh tải + Hoạt tải mái)", source: "ETABS", N: 86.308, Mx: 218.888, My: 0, Vx: 95.461, Vy: 0 },
        { id: "CB2", name: "THCB 2 (Tĩnh tải + Gió trái)", source: "ETABS", N: -45.200, Mx: -150.500, My: 0, Vx: 40.200, Vy: 0 },
        { id: "CB3", name: "THCB 3 (Tĩnh tải + Gió phải)", source: "ETABS", N: 30.500, Mx: 180.400, My: 0, Vx: -60.800, Vy: 0 }
    ],
    assumptions: [
        { id: "A1", param: "Hệ số chuyển đổi áp lực gió 3s chu kỳ 10 năm", value: "γ_T = 0,852", unit: "-", reason: "Theo Mục 10.2.2 TCVN 2737:2023", source: "TCVN 2737:2023", status: "USER CONFIRMED" },
        { id: "A2", param: "Hệ số khí động áp lực trong (c_i)", value: "±0,2", unit: "-", reason: "Theo Mục F.12 TCVN 2737:2023 khi độ hở μ ≤ 5%", source: "TCVN 2737:2023 Mục F.12", status: "USER CONFIRMED" },
        { id: "A3", param: "Hệ số tin cậy tải trọng gió chính (γ_f)", value: "2,1", unit: "-", reason: "Theo Bảng 1 TCVN 2737:2023", source: "TCVN 2737:2023", status: "USER CONFIRMED" },
        { id: "A4", param: "Liên kết chân cột vào móng", value: "Ngàm cứng", unit: "-", reason: "Cấu tạo bản đế và bu lông neo", source: "Đồ án mẫu", status: "USER CONFIRMED" }
    ], 
    results: {
        isStale: true,
        traces: { gravity: [], wind: [], windCases: null, combinations: [], column: [], beam: [], slab: [], connections: [] },
        proposedSections: { column: [], beam: [] },
        selectedSections: { column: null, beam: null },
        claddingResult: null,
        purlinResult: null,
        slabResult: null,
        beamResult: null
    }
};

const TestCase01 = {
    meta: {
        studentName: "Đỗ Minh Nguyên",
        studentId: "22520100438",
        projectName: "Nhà thể thao đa năng",
        projectType: "Công trình thể thao phức hợp",
        usage: "Nhà thi đấu thể thao & dịch vụ đa năng",
        location: "Bình Dương",
    },
    inputs: {
        L: 25.0,
        B: 9.0,
        length: 72.0,
        H_column: 8.0,
        H_roof: 9.25,
        roofSlope: 10.0,
        windZone: "II",
        terrainCategory: "B",
        porosityPercent: 0,
        internalPressureSign: "unfavorable",
        steelGrade: "S235",
        boltGrade: "5.8",
        weldType: "E43",
        L_col_actual: 8.0,
        mu_x_type: "fixed-free",
        mu_y_type: "pinned-pinned",
        selectedCladdingId: "tole-050",
        selectedPurlinId: "Z25019",
        purlinSpacing: 1.2,
        slabParams: {
            L1: 2.5,
            L2: 9.0,
            liveLoad: 4.0,
            finishingLoad: 1.2,
            concreteGrade: 'B25',
            rebarGrade: 'CB240-T'
        },
        beamParams: {
            L_beam: 9.0,
            tributaryWidth: 2.5,
            chosenBeamId: 'I350'
        }
    },
    roofComponents: [
        { name: "Tôn lợp mái (5 dem 0,50 mm)", value: 0.0478, unit: "kN/m2" },
        { name: "Xà gồ Z250x1.9 (bước xà gồ 1,2 m)", value: 0.0536, unit: "kN/m2" },
        { name: "Lớp cách nhiệt chống nóng", value: 0.0200, unit: "kN/m2" },
        { name: "Hệ giằng mái và phụ kiện", value: 0.0300, unit: "kN/m2" }
    ],
    forces: [
        { id: "CB1", name: "THCB 1 (Tĩnh tải + Hoạt tải mái)", source: "ETABS", N: 86.308, Mx: 218.888, My: 0, Vx: 95.461, Vy: 0 },
        { id: "CB2", name: "THCB 2 (Tĩnh tải + Gió trái)", source: "ETABS", N: -45.200, Mx: -150.500, My: 0, Vx: 40.200, Vy: 0 },
        { id: "CB3", name: "THCB 3 (Tĩnh tải + Gió phải)", source: "ETABS", N: 30.500, Mx: 180.400, My: 0, Vx: -60.800, Vy: 0 }
    ]
};

function createCalculationStep(id, title, source, formulaLaTeX, substitutionLaTeX, result, unit, check = null, notes = "") {
    return { stepId: id, title, source, formulaLaTeX, substitutionLaTeX, result, unit, check, notes };
}

function createSectionRecord(type, name, h, b, tw, tf, category) {
    const hw = h - 2 * tf;
    const A = 2 * b * tf + hw * tw; 
    const Ix_web = (tw * Math.pow(hw, 3)) / 12;
    const Ix_flanges = 2 * ((b * Math.pow(tf, 3)) / 12 + b * tf * Math.pow(h / 2 - tf / 2, 2));
    const Ix = Ix_web + Ix_flanges; 
    const Iy_web = (hw * Math.pow(tw, 3)) / 12;
    const Iy_flanges = 2 * ((tf * Math.pow(b, 3)) / 12);
    const Iy = Iy_web + Iy_flanges; 
    const Wx = Ix / (h / 2); 
    const Wy = Iy / (b / 2); 
    const ix = Math.sqrt(Ix / A); 
    const iy = Math.sqrt(Iy / A); 

    return {
        type, name, category, h, b, tw, tf, hw,
        A, Ix, Iy, Wx, Wy, ix, iy,
        massPerMeter: A * 7850 * 1e-6 
    };
}

const _modelsScope = typeof window !== 'undefined' ? window : global;
_modelsScope.ProjectState = ProjectState;
_modelsScope.TestCase01 = TestCase01;
_modelsScope.createCalculationStep = createCalculationStep;
_modelsScope.createSectionRecord = createSectionRecord;
