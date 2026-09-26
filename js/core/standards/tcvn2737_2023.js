// TCVN 2737:2023 - Tải trọng và Tác động

const TCVN2737_2023 = {
    name: "TCVN 2737:2023",
    
    // Bảng 7: Giá trị của áp lực gió cơ sở W0
    getW0: function(windZone) {
        const table = {
            'I': 65,
            'II': 95,
            'III': 125,
            'IV': 155,
            'V': 185
        };
        return table[windZone.toUpperCase()] || null;
    },

    // Mục 10.2.2: Hệ số chuyển đổi áp lực gió 3s, chu kỳ 10 năm
    gamma_T: 0.852,

    // Bảng 8: Các hệ số zg, zmin và alpha theo dạng địa hình
    getTerrainCoefficients: function(category) {
        const table = {
            'A': { zg: 213.36, zmin: 2.13, alpha: 11.5 },
            'B': { zg: 274.32, zmin: 4.57, alpha: 9.5 },
            'C': { zg: 365.76, zmin: 9.14, alpha: 7.0 }
        };
        return table[category.toUpperCase()] || null;
    },

    // 10.2.4 Xác định hệ số thay đổi áp lực gió theo độ cao k(ze)
    calculate_k_ze: function(ze, category) {
        const coeffs = this.getTerrainCoefficients(category);
        if (!coeffs) return null;
        
        // k(ze) = 2.01 * (ze / zg)^(2/alpha)
        let effective_ze = ze;
        if (ze < coeffs.zmin) effective_ze = coeffs.zmin; // z không được nhỏ hơn zmin

        const k_ze = 2.01 * Math.pow((effective_ze / coeffs.zg), 2 / coeffs.alpha);
        return k_ze;
    },

    // Phụ lục E: Hệ số ứng giật Gf cho nhà thép
    calculate_Gf: function(h) {
        // Gf = 0.85 + h/1010
        return 0.85 + (h / 1010);
    }
};
