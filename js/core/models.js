// Core Data Models for Steel Design Project Assistant

const ProjectState = {
    meta: {
        studentName: "", studentId: "", projectName: "", projectType: "", location: "", usage: "",
    },
    inputs: {
        L: null, B: null, length: null, H_column: null, H_roof: null, roofSlope: null, 
        
        L_col_actual: null, 
        mu_x_type: "fixed-free",
        mu_y_type: "pinned-pinned",

        windZone: "II",
        terrainCategory: "B", 
        
        steelGrade: "S235", boltGrade: "5.8", weldType: "E43", hasCrane: false,
    },
    roofComponents: [
        { name: "Tôn lợp mái", value: 0.05, unit: "kN/m2" },
        { name: "Xà gồ", value: 0.05, unit: "kN/m2" },
        { name: "Lớp cách nhiệt", value: 0.02, unit: "kN/m2" }
    ],
    forces: [
        { id: "CB1", name: "THCB 1", source: "ETABS", N: 0, Mx: 0, My: 0, Vx: 0, Vy: 0 },
        { id: "CB2", name: "THCB 2", source: "ETABS", N: 0, Mx: 0, My: 0, Vx: 0, Vy: 0 }
    ],
    assumptions: [
        { id: "A1", param: "Hệ số khí động mái (c_e)", value: "Đẩy +0.8, Hút -0.6", unit: "-", reason: "Đơn giản hóa cho mái vát", source: "TCVN 2737:2023 Phụ lục F", status: "NEEDS VERIFICATION" },
        { id: "A2", param: "Liên kết chân cột", value: "Ngàm", unit: "-", reason: "Cấu tạo bản đế", source: "User", status: "USER CONFIRMED" }
    ], 
    results: {
        isStale: true,
        traces: { gravity: [], wind: [], windCases: null, combinations: [], column: [], beam: [], slab: [], connections: [] },
        proposedSections: { column: [], beam: [] },
        selectedSections: { column: null, beam: null }
    }
};

const TestCase01 = {
    meta: {
        studentName: "Đỗ Minh Nguyên", studentId: "22520100438", projectName: "Nhà thể thao đa năng", projectType: "Khu thể thao phức hợp", location: "Bình Dương", usage: "Khu thể thao phức hợp",
    },
    inputs: {
        L: 25, B: 9, length: 72, H_column: 8.0, H_roof: 9.25, roofSlope: 10,
        L_col_actual: 8.0, mu_x_type: "fixed-free", mu_y_type: "pinned-pinned",
        windZone: "II", terrainCategory: "B", steelGrade: "S235", boltGrade: "5.8", weldType: "E43", hasCrane: false
    },
    roofComponents: [
        { name: "Tôn lợp mái", value: 0.05, unit: "kN/m2" },
        { name: "Xà gồ", value: 0.05, unit: "kN/m2" },
        { name: "Lớp cách nhiệt", value: 0.02, unit: "kN/m2" }
    ],
    forces: [
        { id: "CB1", name: "THCB 1", source: "ETABS", N: 86.308, Mx: 218.888, My: 0, Vx: 95.461, Vy: 0 },
        { id: "CB2", name: "THCB 2", source: "ETABS", N: -45.2, Mx: -150.5, My: 0, Vx: 40.2, Vy: 0 },
        { id: "CB3", name: "THCB 3", source: "ETABS", N: 30.5, Mx: 180.4, My: 0, Vx: -60.8, Vy: 0 }
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

window.ProjectState = ProjectState;
window.TestCase01 = TestCase01;
window.createCalculationStep = createCalculationStep;
window.createSectionRecord = createSectionRecord;
