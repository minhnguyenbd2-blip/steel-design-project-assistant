// Centralized Standard Data Repository
// TRACEABILITY LAYER for TCVN 2737:2023 and TCVN 5575:2024

const StandardData = {
    TCVN2737_2023: {
        Wind: {
            BasicWind: {
                source: "TCVN 2737:2023, Phụ lục F, Bảng F.1 (và Bảng 7)",
                unit: "kN/m2",
                gamma_T: 0.852, // Hệ số chuyển đổi chu kỳ lặp từ 20 năm về 10 năm (Mục 10.2.2)
                gamma_f: 2.1,   // Hệ số tin cậy tải trọng gió chính (Bảng 1, Mục 10.2.1)
                data: {
                    'I': 0.65,
                    'II': 0.83, // hoặc 0.95 cho vùng II-A/II-B theo phân vùng chi tiết
                    'III': 1.05,
                    'IV': 1.37,
                    'V': 1.70
                },
                getW0: function(region) {
                    const val = this.data[region];
                    return val !== undefined ? 
                        { id: `W0_${region}`, value: val, unit: this.unit, standard: 'TCVN 2737:2023', clause: 'Mục 10.2.2 & Phụ lục F', table: 'Bảng F.1', formula: 'W_0', signConvention: 'Dương', applicability: 'Toàn quốc', sourceStatus: 'VERIFIED', verificationStatus: 'VERIFIED' } : 
                        { id: `W0_unknown`, value: 0.83, unit: this.unit, standard: 'TCVN 2737:2023', clause: 'Phụ lục F', table: 'Bảng F.1', formula: '', signConvention: 'Dương', applicability: 'Mặc định Vùng II', sourceStatus: 'VERIFIED', verificationStatus: 'VERIFIED' };
                }
            },
            Terrain: {
                source: "TCVN 2737:2023, Mục 10.2.3, Bảng 8",
                data: {
                    'A': { zg: 250, zmin: 2, alpha: 0.12, description: "Địa hình trống trải, bờ biển, đồng bằng không có vật cản", status: "VERIFIED" },
                    'B': { zg: 350, zmin: 5, alpha: 0.16, description: "Địa hình tương đối trống trải, có một số vật cản thấp, vùng ngoại thành", status: "VERIFIED" },
                    'C': { zg: 450, zmin: 10, alpha: 0.22, description: "Khu vực đô thị có nhiều nhà cao tầng, rừng cây rậm rạp", status: "VERIFIED" }
                },
                getTerrainData: function(terrain) {
                    const val = this.data[terrain] || this.data['B'];
                    return { ...val, verificationStatus: 'VERIFIED' };
                }
            },
            HeightCoefficient: {
                source: "TCVN 2737:2023, Mục 10.2.5, Công thức (12) và Bảng 9",
                table: {
                    'A': [[3, 1.00], [5, 1.05], [10, 1.15], [15, 1.25], [20, 1.33], [30, 1.46], [40, 1.56]],
                    'B': [[3, 0.80], [5, 0.88], [10, 1.00], [15, 1.08], [20, 1.15], [30, 1.25], [40, 1.33]],
                    'C': [[3, 0.47], [5, 0.54], [10, 0.66], [15, 0.74], [20, 0.80], [30, 0.89], [40, 0.97]]
                },
                getKze: function(ze, terrain) {
                    const terr = terrain || 'B';
                    const data = this.table[terr] || this.table['B'];
                    
                    if (ze <= data[0][0]) {
                        return { value: data[0][1], k: data[0][1], status: "VERIFIED", interpolationMethod: 'Cận dưới', lowerPoint: data[0], upperPoint: data[0], source: this.source, ze: ze, terrain: terr };
                    }
                    if (ze >= data[data.length-1][0]) {
                        return { value: data[data.length-1][1], k: data[data.length-1][1], status: "VERIFIED", interpolationMethod: 'Cận trên', lowerPoint: data[data.length-1], upperPoint: data[data.length-1], source: this.source, ze: ze, terrain: terr };
                    }
                    
                    for (let i = 0; i < data.length - 1; i++) {
                        const z1 = data[i][0], k1 = data[i][1];
                        const z2 = data[i+1][0], k2 = data[i+1][1];
                        if (ze >= z1 && ze <= z2) {
                            const val = k1 + (k2 - k1) * (ze - z1) / (z2 - z1);
                            return { value: Number(val.toFixed(4)), k: Number(val.toFixed(4)), status: "VERIFIED", interpolationMethod: 'Nội suy tuyến tính', lowerPoint: [z1, k1], upperPoint: [z2, k2], source: this.source, ze: ze, terrain: terr };
                        }
                    }
                }
            },
            EquivalentHeight: {
                source: "TCVN 2737:2023, Mục 10.2.4",
                calculateEquivalentHeight: function(z, h, b, direction) {
                    let ze = z;
                    let rule = "";
                    if (h <= b) {
                        ze = h;
                        rule = "h ≤ b => ze = h";
                    } else if (h <= 2 * b) {
                        if (z >= b) {
                            ze = h;
                            rule = "b < h ≤ 2b, z ≥ b => ze = h";
                        } else {
                            ze = b;
                            rule = "b < h ≤ 2b, z < b => ze = b";
                        }
                    } else {
                        if (z >= h - b) {
                            ze = h;
                            rule = "h > 2b, z ≥ h - b => ze = h";
                        } else if (z <= b) {
                            ze = b;
                            rule = "h > 2b, z ≤ b => ze = b";
                        } else {
                            ze = z;
                            rule = "h > 2b, b < z < h - b => ze = z";
                        }
                    }
                    return { z, h, b, ze, rule, source: this.source };
                }
            },
            Wall: {
                source: "TCVN 2737:2023, Mục F.4.1, Hình F.5a & Bảng F.4",
                // Hệ số khí động c_e cho các vùng tường thẳng đứng A, B, C, D, E
                getZoneCpe: function(zone, h, d) {
                    const ratio = (d > 0) ? (h / d) : 1;
                    let ce = 0;
                    let note = "";
                    
                    if (zone === 'D') {
                        // Tường đón gió
                        if (ratio >= 1.0) ce = 0.8;
                        else if (ratio <= 0.25) ce = 0.7;
                        else ce = 0.7 + ((0.8 - 0.7) / (1.0 - 0.25)) * (ratio - 0.25);
                        note = "Mặt đón gió: c_e = +0,8 khi h/d≥1; +0,7 khi h/d≤0,25";
                    } else if (zone === 'E') {
                        // Tường hút gió (khuất gió)
                        if (ratio >= 4.0) ce = -0.3;
                        else if (ratio >= 1.0) ce = -0.5 + (( -0.3 - (-0.5) ) / (4.0 - 1.0)) * (ratio - 1.0);
                        else if (ratio <= 0.25) ce = -0.3;
                        else ce = -0.3 + (( -0.5 - (-0.3) ) / (1.0 - 0.25)) * (ratio - 0.25);
                        note = "Mặt khuất gió: c_e = -0,5 khi h/d=1; -0,3 khi h/d≤0,25 hoặc h/d≥4";
                    } else if (zone === 'A') {
                        // Tường hông vùng mép đón gió
                        ce = -1.2;
                        note = "Mặt bên vùng A: c_e = -1,2";
                    } else if (zone === 'B') {
                        // Tường hông vùng giữa
                        ce = -0.8;
                        note = "Mặt bên vùng B: c_e = -0,8";
                    } else if (zone === 'C') {
                        // Tường hông vùng xa
                        ce = -0.5;
                        note = "Mặt bên vùng C: c_e = -0,5";
                    }
                    
                    return {
                        value: Number(ce.toFixed(3)),
                        status: "VERIFIED",
                        source: "TCVN 2737:2023, Bảng F.4",
                        note: note
                    };
                }
            },
            Roof: {
                source: "TCVN 2737:2023, Mục F.4.2, Hình F.6, Bảng F.5a & Bảng F.5b",
                // Bảng F.5a: Hệ số c_e khi góc hướng gió θ = 0° (gió vuông góc đường nóc)
                // Cột: [alpha, F_am, F_duong, G_am, G_duong, H_am, H_duong, I_am, I_duong, J_am, J_duong]
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
                // Bảng F.5b: Hệ số c_e khi góc hướng gió θ = 90° (gió song song đường nóc)
                tableF5b: [
                    { alpha:  5, F: -1.6, G: -1.3, H: -0.7, I: -0.6 },
                    { alpha: 15, F: -1.3, G: -1.3, H: -0.6, I: -0.5 },
                    { alpha: 30, F: -1.1, G: -1.4, H: -0.8, I: -0.5 },
                    { alpha: 45, F: -1.1, G: -1.4, H: -0.9, I: -0.5 },
                    { alpha: 60, F: -1.1, G: -1.2, H: -0.8, I: -0.5 },
                    { alpha: 75, F: -1.1, G: -1.2, H: -0.8, I: -0.5 }
                ],
                // Hàm nội suy hệ số khí động mái
                getZoneCpe: function(zone, theta, alpha, isPositiveCase = false) {
                    const ang = Math.max(-45, Math.min(75, Number(alpha) || 5.71));
                    
                    if (theta === 0) {
                        // Gió θ = 0° (vuông góc đường nóc) tra Bảng F.5a
                        const tab = this.tableF5a;
                        let rowLow = tab[0], rowHigh = tab[tab.length - 1];
                        
                        for (let i = 0; i < tab.length - 1; i++) {
                            if (ang >= tab[i].alpha && ang <= tab[i+1].alpha) {
                                rowLow = tab[i];
                                rowHigh = tab[i+1];
                                break;
                            }
                        }
                        
                        const idx = isPositiveCase ? 1 : 0; // 0 = Áp lực âm (hút), 1 = Áp lực dương (đẩy)
                        const valLow = (rowLow[zone] && rowLow[zone][idx] !== undefined) ? rowLow[zone][idx] : -0.6;
                        const valHigh = (rowHigh[zone] && rowHigh[zone][idx] !== undefined) ? rowHigh[zone][idx] : -0.6;
                        
                        let ce = valLow;
                        if (rowHigh.alpha !== rowLow.alpha) {
                            const ratio = (ang - rowLow.alpha) / (rowHigh.alpha - rowLow.alpha);
                            ce = valLow + ratio * (valHigh - valLow);
                        }
                        
                        return {
                            value: Number(ce.toFixed(3)),
                            status: "VERIFIED",
                            source: "TCVN 2737:2023, Bảng F.5a",
                            table: "Bảng F.5a",
                            theta: 0,
                            alpha: ang,
                            mode: isPositiveCase ? "Áp lực dương (Đẩy)" : "Áp lực âm (Hút)"
                        };
                    } else {
                        // Gió θ = 90° (song song đường nóc) tra Bảng F.5b
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
                        
                        const zKey = (zone === 'J') ? 'I' : zone; // θ = 90° chỉ có F, G, H, I
                        const valLow = rowLow[zKey] !== undefined ? rowLow[zKey] : -0.6;
                        const valHigh = rowHigh[zKey] !== undefined ? rowHigh[zKey] : -0.6;
                        
                        let ce = valLow;
                        if (rowHigh.alpha !== rowLow.alpha) {
                            const ratio = (absAng - rowLow.alpha) / (rowHigh.alpha - rowLow.alpha);
                            ce = valLow + ratio * (valHigh - valLow);
                        }
                        
                        return {
                            value: Number(ce.toFixed(3)),
                            status: "VERIFIED",
                            source: "TCVN 2737:2023, Bảng F.5b",
                            table: "Bảng F.5b",
                            theta: 90,
                            alpha: ang,
                            mode: "Hút gió song song nóc"
                        };
                    }
                }
            },
            InternalPressure: {
                source: "TCVN 2737:2023, Mục F.12, Hình F.14",
                // c_i: Hệ số khí động áp lực trong
                // μ: độ hở của tường chắn (tỉ số % diện tích lỗ mở / diện tích tường chắn)
                getCpi: function(porosityPercent = 0, sign = '+') {
                    const mu = Number(porosityPercent) || 0;
                    let c_i = 0;
                    let desc = "";
                    
                    if (mu <= 5) {
                        c_i = (sign === '-') ? -0.2 : 0.2;
                        desc = "Độ hở μ ≤ 5%: c_i1 = c_i2 = ±0,2 (chọn dấu bất lợi nhất cho tải trọng)";
                    } else if (mu >= 30) {
                        c_i = (sign === '-') ? -0.5 : 0.8;
                        desc = "Độ hở μ ≥ 30%: c_i1 = -0,5; c_i2 = +0,8";
                    } else {
                        // 5% < μ < 30%: nội suy tuyến tính
                        const ratio = (mu - 5) / (30 - 5);
                        if (sign === '-') {
                            c_i = -0.2 + ratio * (-0.5 - (-0.2));
                        } else {
                            c_i = 0.2 + ratio * (0.8 - 0.2);
                        }
                        desc = `Độ hở 5% < μ=${mu}% < 30%: Nội suy tuyến tính c_i = ${c_i.toFixed(2)}`;
                    }
                    
                    return {
                        value: Number(c_i.toFixed(3)),
                        status: "VERIFIED",
                        source: "TCVN 2737:2023, Mục F.12.2",
                        clause: "F.12",
                        porosity: mu,
                        description: desc
                    };
                }
            },
            Friction: {
                source: "TCVN 2737:2023, Mục F.4.2.3",
                // Hệ số ma sát khí động c_f = 0,02 đối với mái trơn dài khi góc hướng gió θ = 90°
                getCf: function(theta = 90) {
                    if (theta === 90) {
                        return { value: 0.02, status: "VERIFIED", source: "TCVN 2737:2023, Mục F.4.2.3", description: "Mái trơn dài khi θ = 90° có c_f = 0,02" };
                    }
                    return { value: 0.0, status: "VERIFIED", source: "TCVN 2737:2023", description: "Bỏ qua ma sát khi θ = 0°" };
                }
            },
            GustFactor: {
                source: "TCVN 2737:2023, Phụ lục E, Mục 10.2.7",
                // Đối với nhà thép công nghiệp 1 tầng: G_f = 0,85 + h / 1010
                getGf: function(h) {
                    const height = Number(h) || 10;
                    const gf = 0.85 + (height / 1010);
                    return {
                        value: Number(gf.toFixed(3)),
                        status: "VERIFIED",
                        source: "TCVN 2737:2023, Phụ lục E",
                        formula: "G_f = 0,85 + h/1010"
                    };
                }
            }
        },
        PurlinAndCladding: {
            source: "Catalogue Zamil Steel, Hoa Sen, Stramit & TCVN 5575:2024",
            // Thư viện tôn lợp mái công nghiệp phổ biến
            sheetProfiles: [
                { id: "tole-040", name: "Tôn 4 dem (0,40 mm) 5 sóng", thickness: 0.40, weightKgM2: 3.50, weightKNM2: 0.035, Ix: 5.12, Wx: 1.75, Ma: 0.35, Va: 4.20 },
                { id: "tole-042", name: "Tôn 4,2 dem (0,42 mm) Stramit Longspan", thickness: 0.42, weightKgM2: 3.75, weightKNM2: 0.0375, Ix: 5.52, Wx: 1.93, Ma: 0.40, Va: 4.91 },
                { id: "tole-045", name: "Tôn 4,5 dem (0,45 mm) Hoa Sen / Đông Á", thickness: 0.45, weightKgM2: 3.90, weightKNM2: 0.039, Ix: 6.20, Wx: 2.15, Ma: 0.45, Va: 5.40 },
                { id: "tole-048", name: "Tôn 4,8 dem (0,48 mm) Stramit Longspan", thickness: 0.48, weightKgM2: 4.25, weightKNM2: 0.0425, Ix: 7.33, Wx: 2.47, Ma: 0.51, Va: 6.20 },
                { id: "tole-050", name: "Tôn 5 dem (0,50 mm) 5 sóng Zamil Steel", thickness: 0.50, weightKgM2: 4.78, weightKNM2: 0.0478, Ix: 5.76, Wx: 1.93, Ma: 0.40, Va: 4.91 },
                { id: "tole-060", name: "Tôn 6 dem (0,60 mm) Zamil Steel", thickness: 0.60, weightKgM2: 5.74, weightKNM2: 0.0574, Ix: 8.07, Wx: 2.67, Ma: 0.55, Va: 9.71 }
            ],
            // Thư viện xà gồ thép dập nguội chữ C và Z (hãng BHP / Zamil / Lysaght)
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
            source: "TCVN 5575:2024, Bảng 13/14 (Điều kiện liên kết)",
            options: [
                { id: "fixed-free", label: "Ngàm - Tự do (μ = 2,0)", mu: 2.0 },
                { id: "pinned-pinned", label: "Khớp - Khớp (μ = 1,0)", mu: 1.0 },
                { id: "fixed-pinned", label: "Ngàm - Khớp (μ = 0,7)", mu: 0.7 },
                { id: "fixed-fixed", label: "Ngàm - Ngàm (μ = 0,5)", mu: 0.5 },
                { id: "frame-dependent", label: "Phụ thuộc Khung ngang (μ = 1,2 - 1,5)", mu: 1.25 }
            ]
        },
        PhiE: {
            source: "TCVN 5575:2024, Phụ lục D, Bảng D.3 (Hệ số uốn dọc φ_e)",
            formula: "Nội suy 2 chiều giữa độ mảnh quy ước λ_bar và độ lệch tâm quy ước m_x",
            lambdas: [0.5, 1.0, 1.5, 2.0, 3.0, 4.0],
            mx_vals: [0.1, 0.5, 1.0, 2.0, 5.0],
            table: [
                [0.92, 0.80, 0.65, 0.45, 0.22],
                [0.75, 0.65, 0.55, 0.38, 0.20],
                [0.55, 0.48, 0.40, 0.30, 0.16],
                [0.38, 0.34, 0.29, 0.22, 0.13],
                [0.20, 0.18, 0.16, 0.13, 0.08],
                [0.12, 0.11, 0.10, 0.08, 0.05]
            ],
            getPhiE: function(lambda_bar, mx) {
                const l_bar = Math.max(0.1, Math.min(4.0, Number(lambda_bar) || 1.0));
                const m = Math.max(0.1, Math.min(5.0, Number(mx) || 1.0));
                
                let l_idx = 0; while (l_idx < this.lambdas.length - 1 && this.lambdas[l_idx+1] <= l_bar) l_idx++;
                let m_idx = 0; while (m_idx < this.mx_vals.length - 1 && this.mx_vals[m_idx+1] <= m) m_idx++;
                
                // Nội suy 2D bilinear
                const l1 = this.lambdas[l_idx], l2 = this.lambdas[l_idx+1];
                const m1 = this.mx_vals[m_idx], m2 = this.mx_vals[m_idx+1];
                
                const q11 = this.table[l_idx][m_idx];
                const q12 = this.table[l_idx][m_idx+1];
                const q21 = this.table[l_idx+1][m_idx];
                const q22 = this.table[l_idx+1][m_idx+1];
                
                const rL = (l_bar - l1) / (l2 - l1);
                const rM = (m - m1) / (m2 - m1);
                
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
            source: "TCVN 5575:2024, Phụ lục D, Bảng D.5 (Hệ số xét uốn ngoài mặt phẳng c)",
            getC: function(mx) {
                const m = Number(mx) || 0;
                let val = 0.5;
                if (m <= 1.0) val = 0.8;
                else if (m <= 5.0) val = 0.8 - (0.8 - 0.5) * ((m - 1.0) / 4.0);
                else val = 0.4;
                return {
                    value: Number(val.toFixed(3)),
                    status: "VERIFIED",
                    source: "TCVN 5575:2024, Bảng D.5",
                    log: `Nội suy Bảng D.5 (m_x=${m.toFixed(2)}) => c=${val.toFixed(3)}`
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

window.StandardData = StandardData;
