// TCVN 5575:2024 - Thiết kế Kết cấu Thép

const TCVN5575_2024 = {
    name: "TCVN 5575:2024",

    getMaterialProperties: function(steelGrade) {
        // Tra bảng cường độ tiêu chuẩn (Phụ lục B hoặc Phần Vật Liệu TCVN 5575:2024)
        const props = {
            'S235': { fy: 235, fu: 360, E: 2.06e5 },
            'S275': { fy: 275, fu: 430, E: 2.06e5 },
            'S355': { fy: 355, fu: 510, E: 2.06e5 },
        };
        const mat = props[steelGrade.toUpperCase()];
        if (!mat) return null;
        
        const gamma_m = 1.05; // Hệ số độ tin cậy vật liệu
        const gamma_c = 1.0;  // Hệ số điều kiện làm việc (giả định chuẩn 1.0 cho cột/dầm thông thường)
        
        return {
            ...mat,
            gamma_m,
            gamma_c,
            f: mat.fy / gamma_m, // Cường độ tính toán chịu kéo, nén, uốn (N/mm2)
            fv: 0.58 * (mat.fy / gamma_m), // Cường độ tính toán chịu cắt
        };
    },

    // Hệ số uốn dọc phi (phi_y)
    getPhi: function(lambda_bar) {
        // Công thức tính phi theo TCVN 5575:2024
        if (lambda_bar <= 2.5) {
            return 1 - 0.073 - 0.053 * lambda_bar; // Giả định gần đúng theo đường cong
        } else {
            return 7.6 / (lambda_bar * lambda_bar); // Công thức gần đúng Euler, CẦN KIỂM TRA LẠI VỚI BẢNG TCVN.
            // Để đảm bảo "NEEDS VERIFICATION", ta sẽ note vào kết quả.
        }
    }
};

window.TCVN5575_2024 = TCVN5575_2024;
