// TCVN 5575:2024 - Thiết kế Kết cấu Thép
// Tuân thủ triệt để: Mục 6 (Cường độ tính toán), Mục 7 (Ổn định nén đúng tâm), Mục 9 (Nén uốn) và Mục 10 (Độ mảnh)

const TCVN5575_2024 = {
    name: "TCVN 5575:2024",

    getMaterialProperties: function(steelGrade) {
        // Cường độ tính toán (f) theo TCVN 5575:2024, Bảng 2 (Mục 6.1.2)
        // f và fv là cường độ TÍNH TOÁN đã bao gồm hệ số độ tin cậy vật liệu gamma_m
        // KHÔNG chia thêm gamma_m - Đây là giá trị thiết kế trực tiếp từ tiêu chuẩn
        // Các giá trị áp dụng cho bản thép t ≤ 20mm (phổ biến trong kết cấu nhà thép)
        const props = {
            // TCVN 5575:2024, Bảng 2 - Mác thép theo TCVN 7937:2013, TCVN 5709:2009
            // f = fy / gamma_m (gamma_m = 1.025 cho thép cán)
            // fv = f * 0.58 (theo TCVN 5575:2024 Mục 6.1.3)
            'S235': { fy: 235, fu: 360, f: 230, fv: 133, E: 2.06e5, G: 7.94e4, source: 'Bảng 2 TCVN 5575:2024 (t ≤ 20mm)' },
            'S275': { fy: 275, fu: 430, f: 265, fv: 153, E: 2.06e5, G: 7.94e4, source: 'Bảng 2 TCVN 5575:2024 (t ≤ 20mm)' },
            'S355': { fy: 355, fu: 490, f: 345, fv: 199, E: 2.06e5, G: 7.94e4, source: 'Bảng 2 TCVN 5575:2024 (t ≤ 20mm)' },
            // Thép tương đương CT3 (Q235) - phổ biến trong đồ án Việt Nam
            'CT3':  { fy: 235, fu: 360, f: 230, fv: 133, E: 2.06e5, G: 7.94e4, source: 'CT3 ≈ S235, Bảng 2 TCVN 5575:2024' },
        };
        const mat = props[(steelGrade || 'S235').toUpperCase()];
        if (!mat) return null;
        
        const gamma_c = 1.0;  // Hệ số điều kiện làm việc (Bảng 4 TCVN 5575:2024)
        
        return {
            ...mat,
            steelGrade: (steelGrade || 'S235').toUpperCase(),
            gamma_c,
            // f và fv đã là cường độ tính toán theo Bảng 2
            f_allow: mat.f * gamma_c,   // Cường độ tính toán có xét γ_c
            fv_allow: mat.fv * gamma_c,
        };
    },

    // Hệ số ổn định khi nén đúng tâm phi (TCVN 5575:2024, Mục 7.1.2.1, Công thức 7 & 8, Bảng 7)
    getPhi: function(lambda_bar, sectionType) {
        sectionType = sectionType || 'b';
        const l_bar = Number(lambda_bar) || 0;
        if (l_bar < 0.6) {
            return 1.0;
        }
        
        // Bảng 7 TCVN 5575:2024 – Các hệ số đường uốn cong ổn định α và β
        // Loại tiết diện a (ống tròn, thép hình số đặc): alpha=0.03, beta=0.06, limitBar=3.8
        // Loại tiết diện b (thép I cán, I tổ hợp hàn đối xứng): alpha=0.04, beta=0.09, limitBar=4.4
        // Loại tiết diện c (I tổ hợp hàn không đối xứng, thép góc): alpha=0.04, beta=0.14, limitBar=5.8
        var alpha = 0.04, beta = 0.09, limitBar = 4.4; // Mặc định tiết diện loại b
        if (sectionType === 'a') {
            alpha = 0.03; beta = 0.06; limitBar = 3.8;
        } else if (sectionType === 'c') {
            alpha = 0.04; beta = 0.14; limitBar = 5.8;
        }

        // Công thức (8) TCVN 5575:2024: Δ = 9,87·(1 - α + β·λ̄) + λ̄²
        var delta = 9.87 * (1 - alpha + beta * l_bar) + l_bar * l_bar;
        
        // Công thức (7) TCVN 5575:2024: φ = (1/2λ̄²)·[Δ - √(Δ² - 39,48·λ̄²)]
        var discriminant = delta * delta - 39.48 * l_bar * l_bar;
        if (discriminant < 0) {
            // Fallback: φ ≤ 7,6/λ̄² (giới hạn trên theo Bảng 7)
            return Number(Math.min(1.0, 7.6 / (l_bar * l_bar)).toFixed(3));
        }
        
        var phi = (0.5 / (l_bar * l_bar)) * (delta - Math.sqrt(discriminant));
        
        // Giới hạn không lớn hơn 7.6 / lambda_bar^2 khi lambda_bar > limitBar (Mục 7.1.2.1)
        if (l_bar > limitBar) {
            phi = Math.min(phi, 7.6 / (l_bar * l_bar));
        }
        
        return Number(Math.max(0.01, Math.min(1.0, phi)).toFixed(3));
    },
    
    // Giới hạn độ mảnh [λ] theo TCVN 5575:2024
    getSlendernessLimit: function(memberType) {
        // Bảng 25: Cấu kiện chịu nén
        // Bảng 26: Cấu kiện chịu kéo
        var limits = {
            'column_major': 180,
            'column_secondary': 200,
            'brace_compression': 200,
            'beam': 250,
            'brace_tension': 300,
            'purlin': 250
        };
        return limits[memberType] || 180;
    }
};

(typeof window !== 'undefined' ? window : global).TCVN5575_2024 = TCVN5575_2024;
