// Engine Thiết kế Tôn lợp mái và Xà gồ thép (Purlin & Cladding Engine)
// Tuân thủ TCVN 2737:2023, TCVN 5575:2024 và Đồ án mẫu

const PurlinCladdingEngine = {
    // 1. Kiểm tra và thiết kế Tôn lợp mái
    designRoofCladding: function(claddingProfile, purlinSpacing_a, roofSlopeDeg, W0, kz, windCeSuction = -1.372) {
        const a = Number(purlinSpacing_a) || 1.2; // Khoảng cách giữa các thanh xà gồ (m)
        const alphaRad = (Number(roofSlopeDeg) || 5.71) * Math.PI / 180;
        const cosA = Math.cos(alphaRad);
        const sinA = Math.sin(alphaRad);
        
        const profile = claddingProfile || StandardData.TCVN2737_2023.PurlinAndCladding.sheetProfiles[4]; // mặc định tôn 5 dem
        const gk_tole = profile.weightKNM2; // kN/m2
        const gamma_f_dead = 1.05;
        
        // Trọng lượng bản thân tôn phân rã 2 phương
        const gk_y = gk_tole * cosA;
        const gk_x = gk_tole * sinA;
        const gd_y = gk_y * gamma_f_dead;
        const gd_x = gk_x * gamma_f_dead;
        
        const gamma_T = 0.852;
        const W0_kN_m2 = (Number(W0) > 5) ? (Number(W0) / 100) : (Number(W0) || 0.95);
        const W3s_10 = gamma_T * W0_kN_m2;
        const ce_suction = Math.abs(windCeSuction);
        const qk_wind = W3s_10 * kz * ce_suction; // kN/m2
        const qd_wind = 2.1 * qk_wind; // Hệ số độ tin cậy gió gamma_f = 2.1
        
        // Hoạt tải sửa chữa mái (TCVN 2737:2023, Bảng 4, Khu vực H)
        const pk_roof = 0.3; // kN/m2
        const gamma_f_live = 1.3;
        const qk_live_y = pk_roof * cosA;
        const qk_live_x = pk_roof * sinA;
        const qd_live_y = qk_live_y * gamma_f_live;
        const qd_live_x = qk_live_x * gamma_f_live;
        
        // Cường độ tính toán thép tôn
        const f_steel = 22.4; // kN/cm2 (~224 MPa cho thép mạ kẽm G300/G450)
        const gamma_c = 1.0;
        const f_allow = f_steel * gamma_c;
        const E_steel = 2.06e4; // kN/cm2 (2.06 x 10^5 MPa)
        
        // ================= TỔ HỢP 1: TĨNH TẢI TÔN + TẢI TRỌNG GIÓ HÚT (Bốc mái) =================
        // Lưu ý: Tôn không chịu tải trọng xà gồ
        const Py1_design = (-qd_wind + gd_y) * 1.0; // kN/m (dải rộng 1m)
        const Px1_design = gd_x * 1.0; // rất nhỏ
        const M1_kNm = Math.abs(Py1_design) * Math.pow(a, 2) / 8; // kNm
        const M1_kNcm = M1_kNm * 100;
        
        const sigma1 = M1_kNcm / profile.Wx; // kN/cm2
        const isStrength1Pass = sigma1 <= f_allow;
        
        // Độ võng Tổ hợp 1 (dùng tải tiêu chuẩn)
        const Py1_service = (-qk_wind + gk_y) * 1.0; // kN/m
        // f = 5/384 * P * a^4 / (E * J) -> chuyển đơn vị sang cm
        const P_ser1_N_per_cm = Math.abs(Py1_service) * 10; // kN/m = 10 N/cm
        const a_cm = a * 100;
        const defl1_cm = (5 / 384) * (Math.abs(Py1_service) * Math.pow(a_cm, 4)) / (E_steel * profile.Ix * 100);
        const defl1_ratio = defl1_cm / a_cm;
        const defl1_limit = 1 / 150;
        const isDefl1Pass = defl1_ratio <= defl1_limit;
        
        // ================= TỔ HỢP 2: TĨNH TẢI TÔN + HOẠT TẢI SỬA CHỮA MÁI =================
        const Py2_design = (gd_y + qd_live_y) * 1.0; // kN/m
        const Px2_design = (gd_x + qd_live_x) * 1.0; // kN/m
        const Mx2_kNm = Math.abs(Py2_design) * Math.pow(a, 2) / 8;
        const My2_kNm = Math.abs(Px2_design) * Math.pow(a, 2) / 8;
        
        const sigma2 = (Mx2_kNm * 100) / profile.Wx + (My2_kNm * 100) / (profile.Wx * 1.2);
        const isStrength2Pass = sigma2 <= f_allow;
        
        const Py2_service = (gk_y + qk_live_y) * 1.0;
        const Px2_service = (gk_x + qk_live_x) * 1.0;
        const defl2_y_cm = (5 / 384) * (Math.abs(Py2_service) * Math.pow(a_cm, 4)) / (E_steel * profile.Ix * 100);
        const defl2_x_cm = (5 / 384) * (Math.abs(Px2_service) * Math.pow(a_cm, 4)) / (E_steel * profile.Ix * 100);
        const defl2_cm = Math.sqrt(Math.pow(defl2_y_cm, 2) + Math.pow(defl2_x_cm, 2));
        const defl2_ratio = defl2_cm / a_cm;
        const isDefl2Pass = defl2_ratio <= defl1_limit;
        
        const isAllPass = isStrength1Pass && isDefl1Pass && isStrength2Pass && isDefl2Pass;
        
        return {
            profile,
            purlinSpacing: a,
            roofSlopeDeg,
            isAllPass,
            combo1: {
                title: "Tổ hợp 1: Tĩnh tải tole + Gió hút bốc mái (Bất lợi kéo/uốn)",
                Py: Py1_design,
                M: M1_kNm,
                sigma: sigma1,
                f_allow: f_allow,
                isStrengthPass: isStrength1Pass,
                deflRatio: defl1_ratio,
                deflLimit: defl1_limit,
                isDeflPass: isDefl1Pass
            },
            combo2: {
                title: "Tổ hợp 2: Tĩnh tải tole + Hoạt tải sửa chữa mái 0,3 kN/m2",
                Py: Py2_design,
                Px: Px2_design,
                M: Mx2_kNm,
                sigma: sigma2,
                f_allow: f_allow,
                isStrengthPass: isStrength2Pass,
                deflRatio: defl2_ratio,
                deflLimit: defl1_limit,
                isDeflPass: isDefl2Pass
            }
        };
    },

    // 2. Kiểm tra và thiết kế Xà gồ thép chữ C hoặc Z
    designPurlin: function(purlinProfile, claddingProfile, purlinSpacing_a, frameSpacing_B, roofSlopeDeg, W0, kz, windCeSuction = -1.372, insulationKNM2 = 0.02) {
        const a = Number(purlinSpacing_a) || 1.2; // Bước xà gồ (m)
        const B = Number(frameSpacing_B) || 6.0; // Bước cột khung (m)
        const alphaRad = (Number(roofSlopeDeg) || 5.71) * Math.PI / 180;
        const cosA = Math.cos(alphaRad);
        const sinA = Math.sin(alphaRad);
        
        const purlin = purlinProfile || StandardData.TCVN2737_2023.PurlinAndCladding.purlinProfiles[9]; // Z250x1.9
        const tole = claddingProfile || StandardData.TCVN2737_2023.PurlinAndCladding.sheetProfiles[4]; // Tôn 5 dem
        
        const gamma_f_dead = 1.05;
        const f_steel = 22.4; // kN/cm2 (~224 MPa)
        const gamma_c = 1.0;
        const f_allow = f_steel * gamma_c;
        const E_steel = 2.06e4; // kN/cm2
        
        // Tĩnh tải truyền lên 1 thanh xà gồ:
        // Trọng lượng bản thân tole + lớp cách nhiệt trên diện tích truyền tải (a x 1m)
        const gk_tole_line = tole.weightKNM2 * a; // kN/m
        const gk_insulation_line = insulationKNM2 * a; // kN/m
        const gk_purlin_line = purlin.weightKNM; // kN/m
        const gk_total = gk_tole_line + gk_insulation_line + gk_purlin_line;
        
        const gk_y = gk_total * cosA;
        const gk_x = gk_total * sinA;
        const gd_y = gk_y * gamma_f_dead;
        const gd_x = gk_x * gamma_f_dead;
        
        const gamma_T = 0.852;
        const W0_kN_m2 = (Number(W0) > 5) ? (Number(W0) / 100) : (Number(W0) || 0.95);
        const W3s_10 = gamma_T * W0_kN_m2;
        const qk_wind_purlin = W3s_10 * kz * Math.abs(windCeSuction) * a; // kN/m
        const qd_wind_purlin = 2.1 * qk_wind_purlin;
        
        // Hoạt tải sửa chữa mái trên diện truyền tải xà gồ
        const pk_roof = 0.3; // kN/m2
        const qk_live_purlin_y = pk_roof * a * cosA;
        const qk_live_purlin_x = pk_roof * a * sinA;
        const qd_live_purlin_y = qk_live_purlin_y * 1.3;
        const qd_live_purlin_x = qk_live_purlin_x * 1.3;
        
        // ================= TỔ HỢP 1: TĨNH TẢI + GIÓ HÚT BỐC MÁI =================
        const Py1 = (-qd_wind_purlin + gd_y); // kN/m
        const Px1 = gd_x; // kN/m
        const Mx1 = Math.abs(Py1) * Math.pow(B, 2) / 8; // kNm
        // Khi có thanh ty giằng xà gồ tại giữa nhịp (L_giang = B/2)
        const numSagRods = B >= 8 ? 2 : 1;
        const L_giang = B / (numSagRods + 1);
        const My1 = Math.abs(Px1) * Math.pow(L_giang, 2) / 8; // kNm
        
        // Wx, Wy trong catalogue là mm3 -> đổi ra cm3 (/1000)
        const Wx_cm3 = purlin.Wx / 1000;
        const Wy_cm3 = purlin.Wy / 1000;
        const Ix_cm4 = purlin.Ix / 10000;
        const Iy_cm4 = purlin.Iy / 10000;
        
        const sigma1 = (Mx1 * 100) / Wx_cm3 + (My1 * 100) / Wy_cm3;
        const isStrength1Pass = sigma1 <= f_allow;
        
        // Độ võng Tổ hợp 1
        const Py1_k = (-qk_wind_purlin + gk_y);
        const Px1_k = gk_x;
        const B_cm = B * 100;
        const B_half_cm = L_giang * 100;
        const defl1_y_cm = (5 / 384) * (Math.abs(Py1_k) * Math.pow(B_cm, 4)) / (E_steel * Ix_cm4 * 100);
        const defl1_x_cm = (5 / 384) * (Math.abs(Px1_k) * Math.pow(B_half_cm, 4)) / (E_steel * Iy_cm4 * 100);
        const defl1_total_cm = Math.sqrt(Math.pow(defl1_y_cm, 2) + Math.pow(defl1_x_cm, 2));
        const defl1_ratio = defl1_total_cm / B_cm;
        const defl_limit = 1 / 200;
        const isDefl1Pass = defl1_ratio <= defl_limit;
        
        // ================= TỔ HỢP 2: TĨNH TẢI + HOẠT TẢI MÁI =================
        const Py2 = (gd_y + qd_live_purlin_y);
        const Px2 = (gd_x + qd_live_purlin_x);
        const Mx2 = Math.abs(Py2) * Math.pow(B, 2) / 8;
        const My2 = Math.abs(Px2) * Math.pow(L_giang, 2) / 8;
        
        const sigma2 = (Mx2 * 100) / Wx_cm3 + (My2 * 100) / Wy_cm3;
        const isStrength2Pass = sigma2 <= f_allow;
        
        const Py2_k = (gk_y + qk_live_purlin_y);
        const Px2_k = (gk_x + qk_live_purlin_x);
        const defl2_y_cm = (5 / 384) * (Math.abs(Py2_k) * Math.pow(B_cm, 4)) / (E_steel * Ix_cm4 * 100);
        const defl2_x_cm = (5 / 384) * (Math.abs(Px2_k) * Math.pow(B_half_cm, 4)) / (E_steel * Iy_cm4 * 100);
        const defl2_total_cm = Math.sqrt(Math.pow(defl2_y_cm, 2) + Math.pow(defl2_x_cm, 2));
        const defl2_ratio = defl2_total_cm / B_cm;
        const isDefl2Pass = defl2_ratio <= defl_limit;
        
        const isAllPass = isStrength1Pass && isDefl1Pass && isStrength2Pass && isDefl2Pass;
        
        // Tĩnh tải phân bố thực tế dồn lên dầm khung (kN/m2 mái)
        const actualRoofDeadLoad_kN_m2 = tole.weightKNM2 + (purlin.weightKNM / a) + insulationKNM2 + 0.03; // +0.03 kN/m2 giằng mái
        
        
        const steps = [];
        steps.push(window.createCalculationStep(
            "CALC-PURLIN-001",
            "Đặc trưng Hình học Xà gồ (" + profile.name + ")",
            { standard: 'Catalogue Xà gồ', section: '' },
            "W_x = " + profile.Wx + "\\text{ cm}^3; \\quad W_y = " + profile.Wy + "\\text{ cm}^3",
            "I_x = " + profile.Ix + "\\text{ cm}^4; \\quad I_y = " + profile.Iy + "\\text{ cm}^4",
            profile.Wx,
            "cm3",
            { isPass: true }
        ));
        steps.push(window.createCalculationStep(
            "CALC-PURLIN-002",
            "Tải trọng tác dụng (Tĩnh tải + Hoạt tải mái)",
            { standard: 'TCVN 2737:2023', section: 'Mục 8' },
            "q_{total} = q_{TL} + q_{HL}",
            "q_{y} = " + q_max_y.toFixed(2) + "\\text{ kN/m}; \\quad q_{x} = " + q_max_x.toFixed(2) + "\\text{ kN/m}",
            q_max_y.toFixed(2),
            "kN/m",
            { isPass: true }
        ));
        steps.push(window.createCalculationStep(
            "CALC-PURLIN-003",
            "Kiểm tra Bền chịu uốn xiên (M_x, M_y)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.2.1.1' },
            "\\sigma = \\frac{M_x}{c_x W_x} + \\frac{M_y}{c_y W_y} \\le f_y \\gamma_c",
            "\\sigma = \\frac{" + Mx_combo1.toFixed(2) + " \\times 10^3}{" + profile.Wx + "} + \\frac{" + My_combo1.toFixed(2) + " \\times 10^3}{" + profile.Wy + "} = " + sigma_combo1.toFixed(2) + "\\text{ MPa} \\le " + fy + "\\text{ MPa}",
            sigma_combo1.toFixed(2),
            "MPa",
            { isPass: isStr1Pass }
        ));
        steps.push(window.createCalculationStep(
            "CALC-PURLIN-004",
            "Kiểm tra Độ võng Xà gồ (Thành phần y)",
            { standard: 'TCVN 5575:2024', section: 'Mục 7.3' },
            "\\Delta_y = \\frac{5}{384} \\frac{q_y^c L^4}{E I_x} \\le [\\Delta] = \\frac{L}{200}",
            "\\Delta_y = " + defl2_y.toFixed(2) + "\\text{ mm} \\le " + defl_limit.toFixed(2) + "\\text{ mm}",
            defl2_y.toFixed(2),
            "mm",
            { isPass: isDefl2Pass }
        ));
        return { steps, 
            purlin,
            tole,
            purlinSpacing: a,
            frameSpacing: B,
            actualRoofDeadLoad_kN_m2: Number(actualRoofDeadLoad_kN_m2.toFixed(3)),
            isAllPass,
            combo1: {
                title: "Tổ hợp 1: Tĩnh tải + Gió hút bốc mái (Gió ngược)",
                Py: Py1,
                Px: Px1,
                Mx: Mx1,
                My: My1,
                sigma: sigma1,
                f_allow: f_allow,
                isStrengthPass: isStrength1Pass,
                deflRatio: defl1_ratio,
                deflLimit: defl_limit,
                isDeflPass: isDefl1Pass
            },
            combo2: {
                title: "Tổ hợp 2: Tĩnh tải + Hoạt tải mái (Tải trọng đứng)",
                Py: Py2,
                Px: Px2,
                Mx: Mx2,
                My: My2,
                sigma: sigma2,
                f_allow: f_allow,
                isStrengthPass: isStrength2Pass,
                deflRatio: defl2_ratio,
                deflLimit: defl_limit,
                isDeflPass: isDefl2Pass
            }
        };
    }
};

var globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
globalScope.PurlinCladdingEngine = PurlinCladdingEngine;
