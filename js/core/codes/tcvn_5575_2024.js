// js/core/codes/tcvn_5575_2024.js
// Tiêu chuẩn Thiết kế Kết cấu thép (TCVN 5575:2024)

window.TCVN5575_2024 = {
    codeName: 'TCVN 5575:2024',
    description: 'Kết cấu thép - Tiêu chuẩn thiết kế',

    // Material definitions based on TCVN 5575:2024
    getMaterialProperties: function(grade) {
        // Based on Table 3 or similar
        const props = {
            'S235': { fy: 235, fu: 360, E: 210000, G: 80769 },
            'S275': { fy: 275, fu: 430, E: 210000, G: 80769 },
            'S355': { fy: 355, fu: 510, E: 210000, G: 80769 }
        };
        
        const mat = props[grade] || props['S235'];
        return {
            ...mat,
            fv: mat.fy * 0.58, // TCVN 5575 approximate
            gamma_c: 1.0,
            density: 7850
        };
    },

    // Bridge to existing calculation engines to enforce "Do not invent formulas"
    checkSectionCapacity: function(section, N_kN, M_kNm, V_kN, materialProps, L0x_m, L0y_m) {
        if (!window.checkSectionCapacity) {
            throw new Error("Missing legacy engine: checkSectionCapacity");
        }
        // Route to the existing, verified engine
        return window.checkSectionCapacity(section, N_kN, M_kNm, V_kN, materialProps, L0x_m, L0y_m);
    }
};