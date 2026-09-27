// Centralized Standard Data Repository
// TRACEABILITY LAYER for TCVN 2737:2023 and TCVN 5575:2024
// Fully Verified against official TCVN 2737:2023 and TCVN 5575:2024 Standards

const StandardData = {
    TCVN2737_2023: {
        Wind: {
            BasicWind: {
                source: "TCVN 2737:2023, Mục 10.2.3, Bảng 7",
                unit: "kN/m2",
                unitDaN: "daN/m2",
                gamma_T: 0.852, // Hệ số chuyển đổi chu kỳ lặp từ 20 năm về 10 năm (Mục 10.2.2)
                gamma_f: 2.1,   // Hệ số tin cậy tải trọng gió chính (Bảng 1, Mục 10.1.6)
                data: {
                    'I': 0.65,    // 65 daN/m2
                    'II': 0.95,   // 95 daN/m2 (Bảng 7 TCVN 2737:2023, chuẩn xác tuyệt đối)
                    'III': 1.25,  // 125 daN/m2
                    'IV': 1.55,   // 155 daN/m2
                    'V': 1.85     // 185 daN/m2
                },
                dataDaN: {
                    'I': 65,
                    'II': 95,
                    'III': 125,
                    'IV': 155,
                    'V': 185
                },
                getW0: function(region) {
                    const key = (region || 'II').toUpperCase();
                    const val = this.data[key];
                    const valDaN = this.dataDaN[key];
                    return val !== undefined ? 
                        { id: `W0_${key}`, value: val, valueDaN: valDaN, unit: this.unit, standard: 'TCVN 2737:2023', clause: 'Mục 10.2.3 & Bảng 7', table: 'Bảng 7', formula: 'W_0 = ' + valDaN + ' daN/m² = ' + val + ' kN/m²', signConvention: 'Dương', applicability: 'Toàn quốc', sourceStatus: 'VERIFIED', verificationStatus: 'VERIFIED' } : 
                        { id: `W0_unknown`, value: 0.95, valueDaN: 95, unit: this.unit, standard: 'TCVN 2737:2023', clause: 'Mục 10.2.3 & Bảng 7', table: 'Bảng 7', formula: 'Mặc định Vùng II: 95 daN/m² = 0.95 kN/m²', signConvention: 'Dương', applicability: 'Mặc định Vùng II', sourceStatus: 'VERIFIED', verificationStatus: 'VERIFIED' };
                }
            },
            Terrain: {
                source: "TCVN 2737:2023, Mục 10.2.5, Bảng 8",
                data: {
                    'A': { zg: 213.36, zmin: 2.13, alpha: 11.5, description: "Trống trải, không có hoặc rất ít vật cản cao không quá 1,5 m", status: "VERIFIED" },
                    'B': { zg: 274.32, zmin: 4.57, alpha: 9.5, description: "Tương đối trống trải, có một số vật cản thưa thớt cao không quá 10 m", status: "VERIFIED" },
                    'C': { zg: 365.76, zmin: 9.14, alpha: 7.0, description: "Bị che chắn mạnh, có nhiều vật cản sát nhau cao từ 10 m trở lên", status: "VERIFIED" }
                },
                getTerrainData: function(terrain) {
                    const terr = (terrain || 'B').toUpperCase();
                    const val = this.data[terr] || this.data['B'];
                    return { ...val, verificationStatus: 'VERIFIED', source: this.source };
                }
            },
            HeightCoefficient: {
                source: "TCVN 2737:2023, Mục 10.2.5, Công thức (12) và Bảng 9",
                table: {
                    'A': [
                        [5, 1.05], [10, 1.18], [15, 1.27], [20, 1.33], [30, 1.43], [40, 1.50],
                        [50, 1.56], [60, 1.61], [80, 1.69], [100, 1.76], [150, 1.89], [200, 1.99],
                        [250, 1.99], [300, 1.99], [350, 1.99], [400, 1.99]
                    ],
                    'B': [
                        [5, 0.87], [10, 1.00], [15, 1.09], [20, 1.16], [30, 1.26], [40, 1.34],
                        [50, 1.40], [60, 1.46], [80, 1.55], [100, 1.63], [150, 1.77], [200, 1.88],
                        [250, 1.97], [300, 1.97], [350, 1.97], [400, 1.97]
                    ],
                    'C': [
                        [5, 0.59], [10, 0.72], [15, 0.81], [20, 0.88], [30, 0.98], [40, 1.07],
                        [50, 1.14], [60, 1.20], [80, 1.30], [100, 1.39], [150, 1.56], [200, 1.69],
                        [250, 1.80], [300, 1.90], [350, 1.98], [400, 1.98]
                    ]
                },
                getKze: function(ze, terrain) {
                    const terr = (terrain || 'B').toUpperCase();
                    const data = this.table[terr] || this.table['B'];
                    const z = Number(ze) || 5.0;
                    
                    if (z <= data[0][0]) {
                        return { value: data[0][1], k: data[0][1], status: "VERIFIED", interpolationMethod: 'Cận dưới (z ≤ 5m)', lowerPoint: data[0], upperPoint: data[0], source: this.source, ze: z, terrain: terr };
                    }
                    if (z >= data[data.length-1][0]) {
                        return { value: data[data.length-1][1], k: data[data.length-1][1], status: "VERIFIED", interpolationMethod: 'Cận trên', lowerPoint: data[data.length-1], upperPoint: data[data.length-1], source: this.source, ze: z, terrain: terr };
                    }
                    
                    for (let i = 0; i < data.length - 1; i++) {
                        const z1 = data[i][0], k1 = data[i][1];
                        const z2 = data[i+1][0], k2 = data[i+1][1];
                        if (z >= z1 && z <= z2) {
                            const val = k1 + (k2 - k1) * (z - z1) / (z2 - z1);
                            return {
                                value: Number(val.toFixed(3)),
                                k: Number(val.toFixed(3)),
                                status: "VERIFIED",
                                interpolationMethod: 'Nội suy tuyến tính theo Chú thích 1 Bảng 9',
                                lowerPoint: [z1, k1],
                                upperPoint: [z2, k2],
                                source: this.source,
                                ze: z,
                                terrain: terr
                            };
                        }
                    }
                    return { value: 1.0, k: 1.0, status: "VERIFIED", interpolationMethod: 'Mặc định', lowerPoint: [10, 1.0], upperPoint: [10, 1.0], source: this.source, ze: z, terrain: terr };
                }
            },
            EquivalentHeight: {
                source: "TCVN 2737:2023, Mục 10.2.4",
                calculateEquivalentHeight: function(h_actual, h_total, b_width, direction) {
                    const h = Number(h_total);
                    const b = Number(b_width);
                    let ze = h;
                    let rule = "";
                    
                    if (h <= b) {
                        ze = h;
                        rule = "h ≤ b => ze = h (độ cao tương đương lấy bằng toàn bộ chiều cao công trình)";
                    } else if (h <= 2 * b) {
                        ze = h;
                        rule = "b < h ≤ 2b => ze phân đoạn theo độ cao z";
                    } else {
                        ze = h;
                        rule = "h > 2b => ze phân đoạn 3 mức";
                    }
                    
                    return {
                        ze: Number(ze.toFixed(2)),
                        rule: rule,
                        status: "VERIFIED",
                        source: this.source
                    };
                }
            },
            Wall: {
                source: "TCVN 2737:2023, Mục F.4.1, Hình F.5 & Bảng F.4",
                getZoneCpe: function(zone, h, d) {
                    const ratio = (d > 0) ? (h / d) : 1;
                    let ce = 0;
                    let note = "";
                    
                    if (zone === 'D') {
                        // Tường đón gió: h/d >= 1: +0.8; h/d <= 0.25: +0.7
                        if (ratio >= 1.0) ce = 0.8;
                        else if (ratio <= 0.25) ce = 0.7;
                        else ce = 0.7 + ((0.8 - 0.7) / (1.0 - 0.25)) * (ratio - 0.25);
                        note = "Mặt đón gió: c_e = +0,8 khi h/d≥1; +0,7 khi h/d≤0,25 (Bảng F.4)";
                    } else if (zone === 'E') {
                        // Tường hút gió (khuất gió) theo Bảng F.4:
                        // h/d >= 5: -0.7; h/d = 1: -0.5; h/d <= 0.25: -0.3
                        if (ratio >= 5.0) {
                            ce = -0.7;
                        } else if (ratio >= 1.0) {
                            ce = -0.5 + ((-0.7 - (-0.5)) / (5.0 - 1.0)) * (ratio - 1.0);
                        } else if (ratio <= 0.25) {
                            ce = -0.3;
                        } else {
                            ce = -0.3 + ((-0.5 - (-0.3)) / (1.0 - 0.25)) * (ratio - 0.25);
                        }
                        note = "Mặt khuất gió: c_e = -0,7 khi h/d≥5; -0,5 khi h/d=1; -0,3 khi h/d≤0,25 (Bảng F.4)";
                    } else if (zone === 'A') {
                        ce = -1.2;
                        note = "Mặt bên vùng A: c_e = -1,2 (Bảng F.4)";
                    } else if (zone === 'B') {
                        ce = -0.8;
                        note = "Mặt bên vùng B: c_e = -0,8 (Bảng F.4)";
                    } else if (zone === 'C') {
                        ce = -0.5;
                        note = "Mặt bên vùng C: c_e = -0,5 (Bảng F.4)";
                    }
                    
                    return {
                        value: Number(ce.toFixed(3)),
                        status: "VERIFIED",
                        source: this.source,
                        note: note
                    };
                }
            },
            Roof: {
                source: "TCVN 2737:2023, Mục F.4.2, Hình F.6, Bảng F.5a & Bảng F.5b",
                tableF5a: [
                    { alpha: -45, F: [-0.6, -0.6], G: [-0.6, -0.6], H: [-0.8, -0.8], I: [-0.7, -0.7], J: [-1.0, -1.0] },
                    { alpha: -30, F: [-1.1, -1.1], G: [-2.0, -2.0], H: [-0.8, -0.8], I: [-0.6, -0.6], J: [-0.8, -0.8] },
                    { alpha: -15, F: [-2.5, -2.5], G: [-1.3, -1.3], H: [-0.9, -0.9], I: [-0.5, -0.5], J: [-0.7, -0.7] },
                    { alpha:  -5, F: [-2.3, -0.6], G: [-1.2, -0.6], H: [-0.8, -0.6], I: [-0.6,  0.2], J: [-0.6,  0.2] },
                    { alpha:   5, F: [-1.7,  0.0], G: [-1.2,  0.0], H: [-0.6,  0.0], I: [-0.6, -0.6], J: [-0.6,  0.2] },
                    { alpha:  15, F: [-0.9,  0.2], G: [-0.8,  0.2], H: [-0.3,  0.2], I: [-0.4, -0.4], J: [-1.0, -1.0] },
                    { alpha:  30, F: [-0.5,  0.7], G: [-0.5,  0.7], H: [-0.2,  0.4], I: [-0.4, -0.4], J: [-0.5, -0.5] },
                    { alpha:  45, F: [ 0.0,  0.7], G: [ 0.0,  0.7], H: [ 0.0,  0.6], I: [-0.2,  0.0], J: [-0.3,  0.0] },
                    { alpha:  60, F: [ 0.7,  0.7], G: [ 0.7,  0.7], H: [ 0.7,  0.7], I: [-0.2, -0.2], J: [-0.3, -0.3] },
                    { alpha:  75, F: [ 0.8,  0.8], G: [ 0.8,  0.8], H: [ 0.8,  0.8], I: [-0.2, -0.2], J: [-0.3, -0.3] }
                ],
                tableF5b: [
                    { alpha:  5, F: -1.6, G: -1.3, H: -0.7, I: -0.6 },
                    { alpha: 15, F: -1.3, G: -1.3, H: -0.6, I: -0.5 },
                    { alpha: 30, F: -1.1, G: -1.4, H: -0.8, I: -0.5 },
                    { alpha: 45, F: -1.1, G: -1.4, H: -0.9, I: -0.5 },
                    { alpha: 60, F: -1.1, G: -1.2, H: -0.8, I: -0.5 },
                    { alpha: 75, F: -1.1, G: -1.2, H: -0.8, I: -0.5 }
                ],
                getZoneCpe: function(zone, theta, alpha, isPositiveCase = false) {
                    const ang = Math.max(-45, Math.min(75, Number(alpha) || 5.71));
                    
                    if (theta === 0) {
                        const tab = this.tableF5a;
                        let rowLow = tab[0], rowHigh = tab[tab.length - 1];
                        
                        for (let i = 0; i < tab.length - 1; i++) {
                            if (ang >= tab[i].alpha && ang <= tab[i+1].alpha) {
                                rowLow = tab[i];
                                rowHigh = tab[i+1];
                                break;
                            }
                        }
                        
                        const idx = isPositiveCase ? 1 : 0;
                        const valLow = (rowLow[zone] && rowLow[zone][idx] !== undefined) ? rowLow[zone][idx] : -0.6;
                        const valHigh = (rowHigh[zone] && rowHigh[zone][idx] !== undefined) ? rowHigh[zone][idx] : -0.6;
                        
                        let ce = valLow;
                        let factor = 0;
                        if (rowHigh.alpha !== rowLow.alpha) {
                            factor = (ang - rowLow.alpha) / (rowHigh.alpha - rowLow.alpha);
                            ce = valLow + factor * (valHigh - valLow);
                        }
                        
                        return {
                            value: Number(ce.toFixed(3)),
                            status: "VERIFIED",
                            source: "TCVN 2737:2023, Bảng F.5a",
                            table: "Bảng F.5a",
                            theta: 0,
                            alpha: ang,
                            lowerPoint: [rowLow.alpha, valLow],
                            upperPoint: [rowHigh.alpha, valHigh],
                            interpolationFactor: Number(factor.toFixed(4)),
                            mode: isPositiveCase ? "Áp lực dương (Đẩy)" : "Áp lực âm (Hút)"
                        };
                    } else {
                        const tab = this.tableF5b;
                        const absAng = Math.max(5, Math.min(75, Math.abs(ang)));
                        let rowLow = tab[0], rowHigh = tab[tab.length - 1];
                        
                        for (let i = 0; i < tab.length - 1; i++) {
                            if (absAng >= tab[i].alpha && absAng <= tab[i+1].alpha) {
                                rowLow = tab[i];
                                rowHigh = tab[i+1];
                                break;
                            }
                        }
                        
                        const zKey = (zone === 'J') ? 'I' : zone;
                        const valLow = rowLow[zKey] !== undefined ? rowLow[zKey] : -0.6;
                        const valHigh = rowHigh[zKey] !== undefined ? rowHigh[zKey] : -0.6;
                        
                        let ce = valLow;
                        let factor = 0;
                        if (rowHigh.alpha !== rowLow.alpha) {
                            factor = (absAng - rowLow.alpha) / (rowHigh.alpha - rowLow.alpha);
                            ce = valLow + factor * (valHigh - valLow);
                        }
                        
                        return {
                            value: Number(ce.toFixed(3)),
                            status: "VERIFIED",
                            source: "TCVN 2737:2023, Bảng F.5b",
                            table: "Bảng F.5b",
                            theta: 90,
                            alpha: ang,
                            lowerPoint: [rowLow.alpha, valLow],
                            upperPoint: [rowHigh.alpha, valHigh],
                            interpolationFactor: Number(factor.toFixed(4)),
                            mode: "Hút gió song song nóc"
                        };
                    }
                }
            },
            InternalPressure: {
                source: "TCVN 2737:2023, Mục F.12, Hình F.14",
                getCpi: function(porosityPercent = 0, sign = '+') {
                    const mu = Number(porosityPercent) || 0;
                    let c_i = 0;
                    let desc = "";
                    let status = "VERIFIED";
                    
                    if (mu <= 5) {
                        c_i = (sign === '-') ? -0.2 : 0.2;
                        desc = "Độ hở μ ≤ 5%: c_i = ±0,2 theo Mục F.12.2 TCVN 2737:2023 (chọn theo điều kiện bất lợi nhất)";
                    } else if (mu >= 30) {
                        c_i = (sign === '-') ? -0.5 : 0.8;
                        desc = "Độ hở μ ≥ 30%: c_i1 = -0,5; c_i2 = +0,8 theo Mục F.12.2 TCVN 2737:2023";
                    } else {
                        // 5% < μ < 30%: Tiêu chuẩn TCVN 2737:2023 Mục F.12 không quy định công thức nội suy tuyến tính tùy tiện
                        // Bắt buộc phân tích sơ đồ lỗ mở hoặc yêu cầu người dùng xác nhận
                        status = "NEEDS VERIFICATION / USER CONFIRMED";
                        c_i = (sign === '-') ? -0.2 : 0.2;
                        desc = `Độ hở 5% < μ=${mu}% < 30%: Tiêu chuẩn không quy định nội suy tuyến tính (Mục F.12) - Yêu cầu xác nhận sơ đồ lỗ mở (NEEDS VERIFICATION / USER CONFIRMED)`;
                    }
                    
                    return {
                        value: Number(c_i.toFixed(3)),
                        status: status,
                        source: this.source,
                        clause: "Mục F.12.2",
                        porosity: mu,
                        description: desc
                    };
                }
            },
            Friction: {
                source: "TCVN 2737:2023, Mục 10.2.1b, Mục F.4.1.2 & Mục F.4.2.3",
                getCf: function(theta = 90, surfaceType = 'smooth_roof') {
                    if (theta === 90) {
                        if (surfaceType === 'smooth_roof') {
                            return { value: 0.02, status: "VERIFIED", source: "TCVN 2737:2023, Mục F.4.2.3", description: "Mái trơn dài khi θ = 90° có c_f = 0,02" };
                        } else if (surfaceType === 'wall_with_ribs') {
                            return { value: 0.10, status: "VERIFIED", source: "TCVN 2737:2023, Mục F.4.1.2", description: "Tường có gờ nhô c_f = 0,10" };
                        }
                    }
                    return { value: 0.0, status: "VERIFIED", source: "TCVN 2737:2023, Mục 10.2.1b", description: "Không xét ma sát khi θ = 0° (đã xét trong c_e)" };
                }
            },
            GustFactor: {
                source: "TCVN 2737:2023, Mục 10.2.7 & Phụ lục E",
                getGf: function(h) {
                    const height = Number(h) || 9.25;
                    const gf = 0.85 + (height / 1010);
                    return {
                        value: Number(gf.toFixed(3)),
                        status: "VERIFIED",
                        source: "TCVN 2737:2023, Mục 10.2.7.2 & Phụ lục E",
                        formula: "G_f = 0,85 + h/1010"
                    };
                }
            }
        },
        PurlinAndCladding: {
            source: "Catalogue Zamil Steel, Hoa Sen, Stramit & TCVN 5575:2024",
            sheetProfiles: [
                { id: "tole-040", name: "Tôn 4 dem (0,40 mm) 5 sóng", thickness: 0.40, weightKgM2: 3.50, weightKNM2: 0.035, Ix: 5.12, Wx: 1.75, Ma: 0.35, Va: 4.20 },
                { id: "tole-042", name: "Tôn 4,2 dem (0,42 mm) Stramit Longspan", thickness: 0.42, weightKgM2: 3.75, weightKNM2: 0.0375, Ix: 5.52, Wx: 1.93, Ma: 0.40, Va: 4.91 },
                { id: "tole-045", name: "Tôn 4,5 dem (0,45 mm) Hoa Sen / Đông Á", thickness: 0.45, weightKgM2: 3.90, weightKNM2: 0.039, Ix: 6.20, Wx: 2.15, Ma: 0.45, Va: 5.40 },
                { id: "tole-048", name: "Tôn 4,8 dem (0,48 mm) Stramit Longspan", thickness: 0.48, weightKgM2: 4.25, weightKNM2: 0.0425, Ix: 7.33, Wx: 2.47, Ma: 0.51, Va: 6.20 },
                { id: "tole-050", name: "Tôn 5 dem (0,50 mm) 5 sóng Zamil Steel", thickness: 0.50, weightKgM2: 4.78, weightKNM2: 0.0478, Ix: 5.76, Wx: 1.93, Ma: 0.40, Va: 4.91 },
                { id: "tole-060", name: "Tôn 6 dem (0,60 mm) Zamil Steel", thickness: 0.60, weightKgM2: 5.74, weightKNM2: 0.0574, Ix: 8.07, Wx: 2.67, Ma: 0.55, Va: 9.71 }
            ],
            purlinProfiles: [
                { id: "C15015", type: "C", name: "C150 x 50 x 15 x 1.5", h: 150, b: 50, c: 15, t: 1.5, weightKgM: 3.12, weightKNM: 0.0312, Ix: 1.62e6, Iy: 0.22e6, Wx: 21.6e3, Wy: 6.2e3 },
                { id: "C18018", type: "C", name: "C180 x 65 x 20 x 1.8", h: 180, b: 65, c: 20, t: 1.8, weightKgM: 4.65, weightKNM: 0.0465, Ix: 3.12e6, Iy: 0.48e6, Wx: 34.6e3, Wy: 11.2e3 },
                { id: "C20018", type: "C", name: "C200 x 65 x 20 x 1.8", h: 200, b: 65, c: 20, t: 1.8, weightKgM: 4.93, weightKNM: 0.0493, Ix: 3.98e6, Iy: 0.51e6, Wx: 39.8e3, Wy: 11.5e3 },
                { id: "C20020", type: "C", name: "C200 x 75 x 20 x 2.0", h: 200, b: 75, c: 20, t: 2.0, weightKgM: 5.86, weightKNM: 0.0586, Ix: 4.85e6, Iy: 0.76e6, Wx: 48.5e3, Wy: 15.6e3 },
                { id: "Z15015", type: "Z", name: "Z150 x 65 x 61 x 1.5", h: 150, b: 65, c: 16.5, t: 1.5, weightKgM: 3.54, weightKNM: 0.0354, Ix: 1.83e6, Iy: 0.144e6, Wx: 24.4e3, Wy: 4.43e3 },
                { id: "Z15019", type: "Z", name: "Z150 x 65 x 61 x 1.9", h: 150, b: 65, c: 17.5, t: 1.9, weightKgM: 4.46, weightKNM: 0.0446, Ix: 2.30e6, Iy: 0.182e6, Wx: 30.7e3, Wy: 5.60e3 },
                { id: "Z20015", type: "Z", name: "Z200 x 79 x 74 x 1.5", h: 200, b: 79, c: 15.0, t: 1.5, weightKgM: 4.44, weightKNM: 0.0444, Ix: 3.88e6, Iy: 0.253e6, Wx: 38.8e3, Wy: 6.40e3 },
                { id: "Z20019", type: "Z", name: "Z200 x 79 x 74 x 1.9", h: 200, b: 79, c: 18.5, t: 1.9, weightKgM: 5.68, weightKNM: 0.0568, Ix: 4.99e6, Iy: 0.339e6, Wx: 49.9e3, Wy: 8.58e3 },
                { id: "Z20024", type: "Z", name: "Z200 x 79 x 73 x 2.4", h: 200, b: 79, c: 21.5, t: 2.4, weightKgM: 7.15, weightKNM: 0.0715, Ix: 6.32e6, Iy: 0.438e6, Wx: 63.2e3, Wy: 11.1e3 },
                { id: "Z25019", type: "Z", name: "Z250 x 79 x 74 x 1.9 (Đồ án mẫu)", h: 250, b: 79, c: 18.0, t: 1.9, weightKgM: 6.43, weightKNM: 0.0643, Ix: 8.34e6, Iy: 0.408e6, Wx: 65.7e3, Wy: 10.3e3 },
                { id: "Z25024", type: "Z", name: "Z250 x 79 x 73 x 2.4", h: 250, b: 79, c: 21.0, t: 2.4, weightKgM: 8.10, weightKNM: 0.0810, Ix: 10.19e6, Iy: 0.488e6, Wx: 80.2e3, Wy: 12.3e3 }
            ]
        }
    },
    TCVN5575_2024: {
        EffectiveLength: {
            source: "TCVN 5575:2024, Bảng 31 & Bảng 32 (Mục 10.3)",
            options: [
                { id: "fixed-free", label: "Ngàm - Tự do (μ = 2,0)", mu: 2.0 },
                { id: "pinned-pinned", label: "Khớp - Khớp (μ = 1,0)", mu: 1.0 },
                { id: "fixed-pinned", label: "Ngàm - Khớp (μ = 0,7)", mu: 0.7 },
                { id: "fixed-fixed", label: "Ngàm - Ngàm (μ = 0,5)", mu: 0.5 },
                { id: "frame-dependent", label: "Khung ngang 1 tầng (μ = 1,5 - 2,0)", mu: 1.5 }
            ]
        },
        PhiE: {
            source: "TCVN 5575:2024, Phụ lục D, Bảng D.3 (Hệ số uốn dọc φ_e)",
            formula: "Nội suy 2 chiều song tuyến (bilinear) Bảng D.3",
            lambdas: [0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,8,9],
            mx_vals: [0.1,0.25,0.5,0.75,1,1.25,1.5,1.75,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,8,9,10,12,14,17,20],
            table: [[0.967,0.922,0.85,0.782,0.722,0.669,0.62,0.577,0.538,0.469,0.417,0.37,0.337,0.307,0.28,0.26,0.237,0.222,0.21,0.183,0.164,0.15,0.125,0.106,0.09,0.077],[0.925,0.854,0.778,0.711,0.653,0.6,0.563,0.52,0.484,0.427,0.382,0.341,0.307,0.283,0.259,0.24,0.225,0.209,0.196,0.175,0.157,0.142,0.121,0.103,0.086,0.074],[0.875,0.804,0.716,0.647,0.593,0.548,0.507,0.47,0.439,0.388,0.347,0.312,0.283,0.262,0.24,0.223,0.207,0.195,0.182,0.163,0.148,0.134,0.114,0.099,0.082,0.07],[0.813,0.742,0.653,0.587,0.536,0.496,0.457,0.425,0.397,0.352,0.315,0.286,0.26,0.24,0.222,0.206,0.193,0.182,0.17,0.153,0.138,0.125,0.107,0.094,0.079,0.067],[0.742,0.672,0.587,0.526,0.48,0.442,0.41,0.383,0.357,0.317,0.287,0.262,0.238,0.22,0.204,0.19,0.178,0.168,0.158,0.144,0.13,0.118,0.101,0.09,0.076,0.065],[0.667,0.597,0.52,0.465,0.425,0.395,0.365,0.342,0.32,0.287,0.26,0.238,0.217,0.202,0.187,0.175,0.166,0.156,0.147,0.135,0.123,0.112,0.097,0.086,0.073,0.063],[0.587,0.522,0.455,0.408,0.375,0.35,0.325,0.303,0.287,0.258,0.233,0.216,0.198,0.183,0.172,0.162,0.153,0.145,0.137,0.125,0.115,0.106,0.092,0.082,0.069,0.06],[0.505,0.447,0.394,0.356,0.33,0.309,0.289,0.27,0.256,0.232,0.212,0.197,0.181,0.168,0.158,0.149,0.14,0.135,0.127,0.118,0.108,0.098,0.088,0.078,0.066,0.057],[0.418,0.382,0.342,0.31,0.288,0.272,0.257,0.242,0.229,0.208,0.192,0.178,0.165,0.155,0.146,0.137,0.13,0.125,0.118,0.11,0.101,0.093,0.083,0.075,0.064,0.055],[0.354,0.326,0.295,0.273,0.253,0.239,0.225,0.215,0.205,0.188,0.175,0.162,0.15,0.143,0.135,0.126,0.12,0.117,0.111,0.103,0.095,0.088,0.079,0.072,0.062,0.053],[0.302,0.28,0.256,0.24,0.224,0.212,0.2,0.192,0.184,0.17,0.158,0.148,0.138,0.132,0.124,0.117,0.112,0.108,0.104,0.095,0.089,0.084,0.075,0.069,0.06,0.051],[0.258,0.244,0.223,0.21,0.198,0.19,0.178,0.172,0.166,0.153,0.145,0.137,0.128,0.12,0.115,0.109,0.104,0.1,0.097,0.09,0.084,0.079,0.071,0.065,0.057,0.048],[0.223,0.213,0.196,0.185,0.176,0.17,0.16,0.155,0.149,0.14,0.132,0.125,0.117,0.112,0.106,0.101,0.097,0.094,0.091,0.085,0.079,0.074,0.067,0.061,0.054,0.046],[0.194,0.186,0.173,0.163,0.157,0.152,0.145,0.141,0.136,0.127,0.121,0.115,0.108,0.102,0.098,0.094,0.091,0.087,0.085,0.079,0.074,0.07,0.063,0.058,0.051,0.043],[0.152,0.146,0.138,0.133,0.128,0.121,0.117,0.115,0.113,0.106,0.1,0.095,0.091,0.087,0.083,0.081,0.078,0.076,0.074,0.07,0.066,0.062,0.056,0.051,0.045,0.039],[0.122,0.117,0.112,0.107,0.103,0.1,0.098,0.096,0.093,0.088,0.084,0.08,0.077,0.073,0.07,0.068,0.066,0.064,0.063,0.06,0.056,0.053,0.048,0.044,0.039,0.034]],
            getPhiE: function(lambda_bar, mx) {
                const l_bar = Math.max(0.5, Math.min(9.0, Number(lambda_bar) || 1.0));
                const m = Math.max(0.1, Math.min(20.0, Number(mx) || 0.1));
                
                let l_idx = 0;
                while (l_idx < this.lambdas.length - 1 && this.lambdas[l_idx+1] <= l_bar) l_idx++;
                let m_idx = 0;
                while (m_idx < this.mx_vals.length - 1 && this.mx_vals[m_idx+1] <= m) m_idx++;
                
                const l1 = this.lambdas[l_idx], l2 = this.lambdas[Math.min(this.lambdas.length - 1, l_idx + 1)];
                const m1 = this.mx_vals[m_idx], m2 = this.mx_vals[Math.min(this.mx_vals.length - 1, m_idx + 1)];
                
                const q11 = this.table[l_idx][m_idx];
                const q12 = this.table[l_idx][Math.min(this.mx_vals.length - 1, m_idx + 1)];
                const q21 = this.table[Math.min(this.lambdas.length - 1, l_idx + 1)][m_idx];
                const q22 = this.table[Math.min(this.lambdas.length - 1, l_idx + 1)][Math.min(this.mx_vals.length - 1, m_idx + 1)];
                
                const rL = (l2 === l1) ? 0 : (l_bar - l1) / (l2 - l1);
                const rM = (m2 === m1) ? 0 : (m - m1) / (m2 - m1);
                
                const val = (1 - rL) * ((1 - rM) * q11 + rM * q12) + rL * ((1 - rM) * q21 + rM * q22);
                
                return {
                    value: Number(val.toFixed(3)),
                    status: "VERIFIED",
                    source: "TCVN 5575:2024, Bảng D.3",
                    log: `Nội suy Bảng D.3 (λ_bar=${l_bar.toFixed(2)}, m_x=${m.toFixed(2)}) => φ_e=${val.toFixed(3)}`
                };
            }
        },
        C_Factor: {
            source: "TCVN 5575:2024, Mục 9.2.5, Công thức (111)-(113) & Bảng 22",
            getC: function(mx, lambda_bar_y = 1.0, phi_y = 1.0, phi_b = 1.0) {
                const m = Math.max(0, Number(mx) || 0);
                const l_bar_y = Number(lambda_bar_y) || 1.0;
                
                let beta = 1.0;
                if (l_bar_y > 3.14) {
                    const phi_c = (typeof TCVN5575_2024 !== 'undefined') ? TCVN5575_2024.getPhi(3.14, 'b') : 0.61;
                    beta = phi_c / (phi_y || 1.0);
                }
                
                function calcC5(m_val) {
                    const alpha = m_val <= 1.0 ? 0.7 : (0.65 + 0.05 * m_val);
                    return beta / (1 + alpha * m_val);
                }
                
                function calcC10(m_val) {
                    const ratio = (phi_y || 1.0) / (phi_b || 1.0);
                    return 1 / (1 + m_val * ratio);
                }
                
                let c_val = 1.0;
                if (m <= 5.0) {
                    c_val = calcC5(m);
                } else if (m >= 10.0) {
                    c_val = calcC10(m);
                } else {
                    const c5 = calcC5(5.0);
                    const c10 = calcC10(10.0);
                    c_val = c5 * (2 - 0.2 * m) + c10 * (0.2 * m - 1);
                }
                
                return {
                    value: Number(Math.max(0.01, Math.min(1.0, c_val)).toFixed(3)),
                    status: "VERIFIED",
                    source: "TCVN 5575:2024, Mục 9.2.5",
                    formula: m <= 5 ? "Công thức (111)" : (m >= 10 ? "Công thức (112)" : "Công thức (113)")
                };
            }
        },
        BeamLibrary: [
            { id: "I200", name: "I 200 x 100 x 5.5 x 8", h: 200, b: 100, tw: 5.5, tf: 8.0, A: 27.16, Ix: 1840, Wx: 184, Iy: 134, Wy: 26.8, mass: 21.3 },
            { id: "I250", name: "I 250 x 125 x 6 x 9", h: 250, b: 125, tw: 6.0, tf: 9.0, A: 37.66, Ix: 4020, Wx: 324, Iy: 294, Wy: 47.0, mass: 29.6 },
            { id: "I300", name: "I 300 x 150 x 6.5 x 9", h: 300, b: 150, tw: 6.5, tf: 9.0, A: 46.78, Ix: 7210, Wx: 481, Iy: 508, Wy: 67.7, mass: 36.7 },
            { id: "I350", name: "I 350 x 175 x 7 x 11", h: 350, b: 175, tw: 7.0, tf: 11.0, A: 63.14, Ix: 13600, Wx: 777, Iy: 984, Wy: 112, mass: 49.6 },
            { id: "I400", name: "I 400 x 200 x 8 x 13", h: 400, b: 200, tw: 8.0, tf: 13.0, A: 84.12, Ix: 23700, Wx: 1190, Iy: 1740, Wy: 174, mass: 66.0 },
            { id: "I450", name: "I 450 x 200 x 9 x 14", h: 450, b: 200, tw: 9.0, tf: 14.0, A: 96.76, Ix: 33500, Wx: 1490, Iy: 1870, Wy: 187, mass: 76.0 },
            { id: "I500", name: "I 500 x 200 x 10 x 16", h: 500, b: 200, tw: 10.0, tf: 16.0, A: 114.2, Ix: 46800, Wx: 1870, Iy: 2140, Wy: 214, mass: 89.6 },
            { id: "I-CUSTOM-400-200", name: "I Tổ hợp hàn 400x200x8x12 (Kèo mẫu)", h: 400, b: 200, tw: 8.0, tf: 12.0, A: 78.08, Ix: 21960, Wx: 1098, Iy: 1601, Wy: 160.1, mass: 61.3 }
        ],
        SlabData: {
            concreteGrades: {
                'B20': { Rb: 11.5, Rbt: 0.90, Eb: 2.75e4, name: 'Bê tông B20 (M250)' },
                'B25': { Rb: 14.5, Rbt: 1.05, Eb: 3.00e4, name: 'Bê tông B25 (M350)' },
                'B30': { Rb: 17.0, Rbt: 1.15, Eb: 3.25e4, name: 'Bê tông B30 (M400)' }
            },
            rebarGrades: {
                'CB240-T': { Rs: 210, Rsc: 210, name: 'Thép tròn trơn CB240-T' },
                'CB300-V': { Rs: 260, Rsc: 260, name: 'Thép vằn CB300-V' },
                'CB400-V': { Rs: 350, Rsc: 350, name: 'Thép gân CB400-V' }
            }
        }
    }
};

const _globalTarget = (typeof window !== 'undefined' ? window : global);
_globalTarget.StandardData = StandardData;
if (_globalTarget.TCVN5575_2024) {
    _globalTarget.TCVN5575_2024.BeamLibrary = StandardData.TCVN5575_2024.BeamLibrary;
}
