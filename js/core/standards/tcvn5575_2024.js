// TCVN 5575:2024 - Thiết kế Kết cấu Thép
// Tuân thủ triệt để: Mục 6 (Cường độ tính toán), Mục 7 (Ổn định nén đúng tâm), Mục 9 (Nén uốn) và Mục 10 (Độ mảnh)

const TCVN5575_2024 = {
    name: "TCVN 5575:2024",

    getMaterialProperties: function(steelGrade) {
        // Tra bảng cường độ tiêu chuẩn (Phụ lục B, Bảng B.2 và Mục 6, Bảng 2, Bảng 3 TCVN 5575:2024)
        const props = {
            'S235': { fy: 235, fu: 360, E: 2.06e5 },
            'S275': { fy: 275, fu: 410, E: 2.06e5 },
            'S355': { fy: 355, fu: 470, E: 2.06e5 },
        };
        const mat = props[(steelGrade || 'S235').toUpperCase()];
        if (!mat) return null;
        
        const gamma_m = 1.05; // Hệ số độ tin cậy vật liệu cho thép cán (TCVN 5575:2024 Bảng 3)
        const gamma_c = 1.0;  // Hệ số điều kiện làm việc (1.0 cho cột/dầm khung chính)
        
        const f = mat.fy / gamma_m; // Cường độ tính toán chịu kéo, nén, uốn f_yd (MPa = N/mm2)
        const fv = 0.58 * f;        // Cường độ tính toán chịu cắt f_v (MPa)
        
        return {
            ...mat,
            steelGrade: (steelGrade || 'S235').toUpperCase(),
            gamma_m,
            gamma_c,
            f: Number(f.toFixed(2)),       // S235: 223.81 MPa
            fv: Number(fv.toFixed(2)),     // S235: 129.81 MPa
            f_exact: f,
            fv_exact: fv
        };
    },

    // Hệ số ổn định khi nén đúng tâm phi (TCVN 5575:2024, Mục 7.1.2.1, Công thức 7 & 8, Bảng 7)
    getPhi: function(lambda_bar, sectionType = 'b') {
        const l_bar = Number(lambda_bar) || 0;
        if (l_bar < 0.6) {
            return 1.0;
        }
        
        // Bảng 7 – Các hệ số alpha và beta
        // Loại tiết diện a: alpha = 0.03, beta = 0.06, giới hạn l_bar = 3.8
        // Loại tiết diện b (I cán, I tổ hợp): alpha = 0.04, beta = 0.09, giới hạn l_bar = 4.4
        // Loại tiết diện c: alpha = 0.04, beta = 0.14, giới hạn l_bar = 5.8
        let alpha = 0.04, beta = 0.09, limitBar = 4.4;
        if (sectionType === 'a') {
            alpha = 0.03; beta = 0.06; limitBar = 3.8;
        } else if (sectionType === 'c') {
            alpha = 0.04; beta = 0.14; limitBar = 5.8;
        }

        // Công thức (8): delta = 9.87 * (1 - alpha + beta * lambda_bar) + lambda_bar^2
        const delta = 9.87 * (1 - alpha + beta * l_bar) + Math.pow(l_bar, 2);
        
        // Công thức (7): phi = 0.5 / lambda_bar^2 * [ delta - sqrt(delta^2 - 39.48 * lambda_bar^2) ]
        const discriminant = Math.pow(delta, 2) - 39.48 * Math.pow(l_bar, 2);
        if (discriminant < 0) {
            return Number(Math.min(1.0, 7.6 / Math.pow(l_bar, 2)).toFixed(3));
        }
        
        let phi = (0.5 / Math.pow(l_bar, 2)) * (delta - Math.sqrt(discriminant));
        
        // Giới hạn không lớn hơn 7.6 / lambda_bar^2 khi lambda_bar > limitBar (Mục 7.1.2.1)
        if (l_bar > limitBar) {
            phi = Math.min(phi, 7.6 / Math.pow(l_bar, 2));
        }
        
        return Number(Math.max(0.01, Math.min(1.0, phi)).toFixed(3));
    }
};

(typeof window !== 'undefined' ? window : global).TCVN5575_2024 = TCVN5575_2024;
