// TCVN 2737:2023 - Tải trọng và Tác động
// Chuẩn hóa tuyệt đối theo tiêu chuẩn TCVN 2737:2023

const TCVN2737_2023 = {
    name: "TCVN 2737:2023",
    
    // Bảng 7: Giá trị của áp lực gió cơ sở W0 (daN/m2)
    getW0: function(windZone) {
        const table = {
            'I': 65,
            'II': 95,
            'III': 125,
            'IV': 155,
            'V': 185
        };
        return table[(windZone || 'II').toUpperCase()] || 95;
    },

    // Mục 10.2.2: Hệ số chuyển đổi áp lực gió 3s, chu kỳ 10 năm
    gamma_T: 0.852,

    // Bảng 1, Mục 10.1.6: Hệ số độ tin cậy tải trọng gió chính
    gamma_f: 2.1,

    // Bảng 8: Các hệ số zg, zmin và alpha theo dạng địa hình (Mục 10.2.5)
    getTerrainCoefficients: function(category) {
        const table = {
            'A': { zg: 213.36, zmin: 2.13, alpha: 11.5 },
            'B': { zg: 274.32, zmin: 4.57, alpha: 9.5 },
            'C': { zg: 365.76, zmin: 9.14, alpha: 7.0 }
        };
        return table[(category || 'B').toUpperCase()] || table['B'];
    },

    // Mục 10.2.5, Công thức (12): Xác định hệ số thay đổi áp lực gió theo độ cao k(ze)
    calculate_k_ze: function(ze, category) {
        const coeffs = this.getTerrainCoefficients(category);
        let effective_ze = Number(ze) || coeffs.zmin;
        if (effective_ze < coeffs.zmin) effective_ze = coeffs.zmin;

        const k_ze = 2.01 * Math.pow((effective_ze / coeffs.zg), 2 / coeffs.alpha);
        return Number(k_ze.toFixed(3));
    },

    // Phụ lục E, Mục 10.2.7.2: Hệ số ứng giật Gf cho nhà thép
    calculate_Gf: function(h) {
        return Number((0.85 + (Number(h) || 9.25) / 1010).toFixed(3));
    }
};

(typeof window !== 'undefined' ? window : global).TCVN2737_2023 = TCVN2737_2023;
