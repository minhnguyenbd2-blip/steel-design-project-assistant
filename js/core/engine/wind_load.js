// Động cơ tính toán tải trọng gió TCVN 2737:2023 (Wind Load Calculation Engine)
// Tuân thủ triệt để: Mục 10.2, Phụ lục E, Phụ lục F (F.4.1, F.4.2, F.12) và Đồ án mẫu

const WindEngine = {
    // 1. Phân tích hình học công trình theo TCVN 2737:2023
    analyzeGeometry: function(L_span, B_step, length_d, H_column, H_roof, roofType = "gable") {
        const L = Number(L_span) || 24; // Nhịp khung ngang nhà (m)
        const B = Number(B_step) || 6;  // Bước cột khung (m)
        const d_total = Number(length_d) || 72; // Chiều dài toàn bộ nhà (m)
        const H_col = Number(H_column) || 8; // Chiều cao đỉnh cột (m)
        const H_rf = Number(H_roof) || 9.25; // Chiều cao đỉnh mái (m)
        
        // Độ dốc mái i (%) và góc dốc mái alpha (độ)
        const roofRise = Math.max(0.1, H_rf - H_col);
        const halfSpan = L / 2;
        const slopePercent = (roofRise / halfSpan) * 100;
        const alphaRad = Math.atan(roofRise / halfSpan);
        const alphaDeg = (alphaRad * 180) / Math.PI;
        
        // Chiều cao công trình h (tính từ cos +0.000 đến đỉnh mái)
        const h = H_rf;
        
        // Kích thước tương đương theo 2 phương đón gió
        // Phương gió X (θ = 0°, vuông góc đường nóc):
        // b_X là kích thước mặt đón gió vuông góc với hướng gió = chiều dài nhà d_total (hoặc nhịp nếu xét riêng)
        // Trong TCVN 2737:2023 mục F.4: b là bề rộng mặt đón gió (vuông góc gió), d là chiều dài theo phương gió
        // Khi gió θ = 0° (thổi ngang nhà vào sườn): b = d_total, d = L
        const b_theta0 = d_total;
        const d_theta0 = L;
        const e_theta0 = Math.min(b_theta0, 2 * h);
        
        // Khi gió θ = 90° (thổi dọc nhà vào đầu hồi): b = L, d = d_total
        const b_theta90 = L;
        const d_theta90 = d_total;
        const e_theta90 = Math.min(b_theta90, 2 * h);
        
        return {
            L, B, d_total, H_col, H_rf, h,
            roofRise: Number(roofRise.toFixed(3)),
            slopePercent: Number(slopePercent.toFixed(2)),
            alphaDeg: Number(alphaDeg.toFixed(2)),
            theta0: { b: b_theta0, d: d_theta0, e: Number(e_theta0.toFixed(2)) },
            theta90: { b: b_theta90, d: d_theta90, e: Number(e_theta90.toFixed(2)) }
        };
    },

    // 2. Tính toán phân nhánh hướng gió theo TCVN 2737:2023
    calculateDirectionBranch: function(direction, geom, terrain, inputs, internalPressureSign = '+', isPositiveRoofCase = false) {
        // Xác định góc hướng gió θ theo TCVN
        const isTheta0 = (direction === '+X' || direction === '-X' || direction === 'THETA_0');
        const theta = isTheta0 ? 0 : 90;
        
        const b = isTheta0 ? geom.theta0.b : geom.theta90.b;
        const d = isTheta0 ? geom.theta0.d : geom.theta90.d;
        const e = isTheta0 ? geom.theta0.e : geom.theta90.e;
        const h = geom.h;
        const H_col = geom.H_col;
        const B_tributary = geom.B; // Bước cột truyền tải
        
        // 1. Áp lực gió cơ sở W0 và áp lực 3s chu kỳ 10 năm W3s,10 (Mục 10.2.2)
        const W0_res = StandardData.TCVN2737_2023.Wind.BasicWind.getW0(inputs.windZone);
        const W0 = W0_res.value || 0.95;
        const gamma_T = StandardData.TCVN2737_2023.Wind.BasicWind.gamma_T; // 0.852
        const W3s_10 = Number((gamma_T * W0).toFixed(3)); // kN/m2
        
        // 2. Hệ số phản ứng giật Gf cho nhà thép (Phụ lục E)
        const Gf_res = StandardData.TCVN2737_2023.Wind.GustFactor.getGf(h);
        const Gf = Gf_res.value || 0.86;
        
        // 3. Hệ số khí động áp lực trong ci (Mục F.12)
        const porosity = Number(inputs.porosityPercent) || 0;
        const ci_res = StandardData.TCVN2737_2023.Wind.InternalPressure.getCpi(porosity, internalPressureSign === '-' ? '-' : '+');
        const ci = ci_res.value;
        
        // 4. Phân vùng TƯỜNG theo Hình F.5a & Bảng F.4
        const wallZones = [];
        // Tường đón gió D
        wallZones.push({ surface: 'Tường', zone: 'D', name: 'Đón gió (D)', width: b, height: H_col });
        // Tường khuất gió (hút) E
        wallZones.push({ surface: 'Tường', zone: 'E', name: 'Khuất gió (E)', width: b, height: H_col });
        
        // Tường hông (A, B, C)
        if (e < d) {
            wallZones.push({ surface: 'Tường', zone: 'A', name: 'Tường hông vùng A (e/5)', width: Number((e / 5).toFixed(2)), height: H_col });
            wallZones.push({ surface: 'Tường', zone: 'B', name: 'Tường hông vùng B (4e/5)', width: Number(((4 / 5) * e).toFixed(2)), height: H_col });
            wallZones.push({ surface: 'Tường', zone: 'C', name: 'Tường hông vùng C (d - e)', width: Number((d - e).toFixed(2)), height: H_col });
        } else if (e < 5 * d) {
            wallZones.push({ surface: 'Tường', zone: 'A', name: 'Tường hông vùng A (e/5)', width: Number((e / 5).toFixed(2)), height: H_col });
            wallZones.push({ surface: 'Tường', zone: 'B', name: 'Tường hông vùng B (d - e/5)', width: Number((d - e / 5).toFixed(2)), height: H_col });
        } else {
            wallZones.push({ surface: 'Tường', zone: 'A', name: 'Tường hông vùng A (d)', width: d, height: H_col });
        }
        
        const processedWallZones = wallZones.filter(z => z.width > 0).map(z => {
            const eqHeightRes = StandardData.TCVN2737_2023.Wind.EquivalentHeight.calculateEquivalentHeight(z.height, h, b, direction);
            const kzRes = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(eqHeightRes.ze, terrain);
            const ceRes = StandardData.TCVN2737_2023.Wind.Wall.getZoneCpe(z.zone, h, d);
            const ce = ceRes.value;
            
            // Hệ số khí động áp lực trong cục bộ theo nguyên tắc tổ hợp bất lợi nhất (Mục F.12.2)
            let zone_ci = ci;
            if (internalPressureSign === 'unfavorable' || !internalPressureSign || internalPressureSign === 'auto') {
                if (ce > 0) {
                    zone_ci = -Math.abs(ci); // Hút trong làm tăng áp lực đẩy ngoài: ce - (-ci) = ce + ci
                } else if (ce < 0) {
                    zone_ci = Math.abs(ci); // Đẩy trong làm tăng lực bốc/hút ngoài: ce - (+ci) = ce - ci
                } else {
                    zone_ci = -Math.abs(ci);
                }
            } else if (internalPressureSign === '+') {
                zone_ci = Math.abs(ci);
            } else if (internalPressureSign === '-') {
                zone_ci = -Math.abs(ci);
            }
            
            const c_net = Number((ce - zone_ci).toFixed(3));
            
            // Tải trọng tiêu chuẩn Wk (kN/m2) = W3s,10 * k(ze) * c_net * Gf
            const pressure_k = Number((W3s_10 * (kzRes.value || 1.0) * c_net * Gf).toFixed(3));
            // Tải trọng tính toán W (kN/m2) = 2.1 * Wk
            const pressure_d = Number((2.1 * pressure_k).toFixed(3));
            // Tải trọng phân bố truyền vào khung ngang (kN/m dài cột)
            const frameLineLoad_k = Number((pressure_k * B_tributary).toFixed(2));
            const frameLineLoad_d = Number((pressure_d * B_tributary).toFixed(2));
            
            const area = Number((z.width * z.height).toFixed(2));
            
            return {
                ...z,
                ze: eqHeightRes.ze,
                kz: kzRes.value,
                ce,
                ci: zone_ci,
                c_net,
                W0,
                W3s_10,
                Gf,
                pressure_k,
                pressure_d,
                area,
                resultant_kN: Number((pressure_d * area).toFixed(2)),
                tributaryWidth: B_tributary,
                frameLineLoad_k,
                frameLineLoad_d
            };
        });
        
        // 5. Phân vùng MÁI theo Hình F.6, Bảng F.5a & F.5b
        const roofZones = [];
        if (isTheta0) {
            // Gió θ = 0° (vuông góc đường nóc) - Hình F.6b:
            // Sườn đón gió: Vùng F (hai bên góc mép: e/4 x e/10), G (giữa: [b - 2(e/4)] x e/10), H (phần còn lại)
            // Sườn khuất gió: Vùng J (dải nóc: b x e/10), Vùng I (phần còn lại)
            const e4 = Number((e / 4).toFixed(2));
            const e10 = Number((e / 10).toFixed(2));
            const half_d = Number((d / 2).toFixed(2));
            
            roofZones.push({ surface: 'Mái', zone: 'F', name: 'Mái đón gió góc biên (F)', width: e4, length: e10, area: Number((2 * e4 * e10).toFixed(2)) });
            roofZones.push({ surface: 'Mái', zone: 'G', name: 'Mái đón gió dải giữa (G)', width: Number(Math.max(0, b - 2 * e4).toFixed(2)), length: e10, area: Number((Math.max(0, b - 2 * e4) * e10).toFixed(2)) });
            roofZones.push({ surface: 'Mái', zone: 'H', name: 'Mái đón gió phần còn lại (H)', width: b, length: Number(Math.max(0, half_d - e10).toFixed(2)), area: Number((b * Math.max(0, half_d - e10)).toFixed(2)) });
            roofZones.push({ surface: 'Mái', zone: 'J', name: 'Mái khuất gió dải nóc (J)', width: b, length: e10, area: Number((b * e10).toFixed(2)) });
            roofZones.push({ surface: 'Mái', zone: 'I', name: 'Mái khuất gió phần còn lại (I)', width: b, length: Number(Math.max(0, half_d - e10).toFixed(2)), area: Number((b * Math.max(0, half_d - e10)).toFixed(2)) });
        } else {
            // Gió θ = 90° (song song đường nóc) - Hình F.6c:
            // Phân vùng F (hai bên mép đầu hồi đón gió: e/4 x e/10), G (giữa: [b - 2(e/4)] x e/10), H (từ e/10 đến e/2), I (từ e/2 đến hết)
            const e4 = Number((e / 4).toFixed(2));
            const e10 = Number((e / 10).toFixed(2));
            const e2 = Number((e / 2).toFixed(2));
            
            roofZones.push({ surface: 'Mái', zone: 'F', name: 'Mái đầu hồi góc biên (F)', width: e4, length: e10, area: Number((2 * e4 * e10).toFixed(2)) });
            roofZones.push({ surface: 'Mái', zone: 'G', name: 'Mái đầu hồi dải giữa (G)', width: Number(Math.max(0, b - 2 * e4).toFixed(2)), length: e10, area: Number((Math.max(0, b - 2 * e4) * e10).toFixed(2)) });
            roofZones.push({ surface: 'Mái', zone: 'H', name: 'Mái dải tiếp giáp H (e/10 đến e/2)', width: b, length: Number(Math.max(0, e2 - e10).toFixed(2)), area: Number((b * Math.max(0, e2 - e10)).toFixed(2)) });
            roofZones.push({ surface: 'Mái', zone: 'I', name: 'Mái phần còn lại I (> e/2)', width: b, length: Number(Math.max(0, d - e2).toFixed(2)), area: Number((b * Math.max(0, d - e2)).toFixed(2)) });
        }
        
        const processedRoofZones = roofZones.filter(z => z.area > 0).map(z => {
            const eqHeightRes = StandardData.TCVN2737_2023.Wind.EquivalentHeight.calculateEquivalentHeight(h, h, b, direction);
            const kzRes = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(eqHeightRes.ze, terrain);
            const ceRes = StandardData.TCVN2737_2023.Wind.Roof.getZoneCpe(z.zone, theta, geom.alphaDeg, isPositiveRoofCase);
            const ce = ceRes.value;
            
            // Hệ số khí động áp lực trong cục bộ theo nguyên tắc tổ hợp bất lợi nhất (Mục F.12.2)
            let zone_ci = ci;
            if (internalPressureSign === 'unfavorable' || !internalPressureSign || internalPressureSign === 'auto') {
                if (ce > 0) {
                    zone_ci = -Math.abs(ci); // Hút trong làm tăng áp lực đẩy ngoài
                } else if (ce < 0) {
                    zone_ci = Math.abs(ci); // Đẩy trong làm tăng lực bốc/hút mái
                } else {
                    zone_ci = -Math.abs(ci);
                }
            } else if (internalPressureSign === '+') {
                zone_ci = Math.abs(ci);
            } else if (internalPressureSign === '-') {
                zone_ci = -Math.abs(ci);
            }
            
            const c_net = Number((ce - zone_ci).toFixed(3));
            const pressure_k = Number((W3s_10 * (kzRes.value || 1.0) * c_net * Gf).toFixed(3));
            const pressure_d = Number((2.1 * pressure_k).toFixed(3));
            const frameLineLoad_k = Number((pressure_k * B_tributary).toFixed(2));
            const frameLineLoad_d = Number((pressure_d * B_tributary).toFixed(2));
            
            return {
                ...z,
                ze: eqHeightRes.ze,
                kz: kzRes.value,
                ce,
                ci: zone_ci,
                c_net,
                W0,
                W3s_10,
                Gf,
                pressure_k,
                pressure_d,
                resultant_kN: Number((pressure_d * z.area).toFixed(2)),
                tributaryWidth: B_tributary,
                frameLineLoad_k,
                frameLineLoad_d,
                roofCaseMode: ceRes.mode
            };
        });
        
        // 6. Tính toán ma sát Wf theo TCVN 2737:2023 Mục 10.2.1b & Phụ lục F.4.2.3
        const x0_friction = Math.min(2 * b, 4 * h);
        const isFrictionApplicable = d > x0_friction;
        let frictionData = null;
        
        if (isFrictionApplicable) {
            const L_fr = d - x0_friction; // Chiều dài vùng phát triển ma sát
            const cf_roof = 0.02; // Mái tôn lượn sóng/trơn (Mục F.4.2.3)
            const cf_wall = 0.02; // Tường tôn gờ thấp
            const roofFrArea = 2 * (geom.L / (2 * Math.cos(geom.alphaDeg * Math.PI / 180))) * L_fr;
            const wallFrArea = 2 * H_col * L_fr;
            
            const kz_roof = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(h, terrain).value || 1.0;
            const qp_roof = W3s_10 * kz_roof * Gf;
            
            const Wf_k_roof = qp_roof * cf_roof * roofFrArea;
            const Wf_k_wall = qp_roof * cf_wall * wallFrArea;
            const Wf_k = Wf_k_roof + Wf_k_wall;
            const Wf_d = 2.1 * Wf_k;
            
            frictionData = {
                isApplicable: true,
                x0: Number(x0_friction.toFixed(2)),
                L_fr: Number(L_fr.toFixed(2)),
                cf_roof,
                cf_wall,
                roofFrArea: Number(roofFrArea.toFixed(1)),
                wallFrArea: Number(wallFrArea.toFixed(1)),
                totalArea: Number((roofFrArea + wallFrArea).toFixed(1)),
                Wf_k: Number(Wf_k.toFixed(2)),
                Wf_d: Number(Wf_d.toFixed(2)),
                lineLoad_d: Number((Wf_d / d).toFixed(2)),
                description: `Ma sát phát sinh từ khoảng cách x₀ = min(2b, 4h) = ${x0_friction.toFixed(1)}m trên chiều dài L_fr = ${L_fr.toFixed(1)}m. Truyền tải vào hệ giằng mái và giằng cột dọc nhà.`
            };
        } else {
            frictionData = {
                isApplicable: false,
                x0: Number(x0_friction.toFixed(2)),
                reason: `d = ${d}m ≤ min(2b, 4h) = ${x0_friction.toFixed(1)}m theo TCVN 2737:2023 Điều 10.2.1b (lực ma sát không đáng kể, đã bao gồm trong c_e)`
            };
        }
        
        const caseId = isTheta0 ? 
            (direction === '+X' ? 'GIO_X_THUAN' : 'GIO_X_NGHICH') : 
            (direction === '+Y' ? 'GIO_Y_THUAN' : 'GIO_Y_NGHICH');
            
        const caseTitle = isTheta0 ? 
            `Gió ngang nhà θ = 0° (${direction === '+X' ? 'Đón gió sườn 1 (+X)' : 'Đón gió sườn 2 (-X)'}) - ${isPositiveRoofCase ? 'Mái đẩy' : 'Mái hút'}` :
            `Gió dọc nhà θ = 90° (${direction === '+Y' ? 'Đón gió đầu hồi 1 (+Y)' : 'Đón gió đầu hồi 2 (-Y)'})`;
        
        return {
            id: caseId,
            direction,
            theta,
            title: caseTitle,
            isTheta0,
            W0,
            W3s_10,
            Gf,
            ci,
            porosity,
            isPositiveRoofCase,
            friction: frictionData,
            surfaces: [...processedWallZones, ...processedRoofZones]
        };
    }
};

function calculateWindLoad(inputs) {
    const steps = [];
    
    // Kiểm tra tính hợp lệ của dữ liệu đầu vào (Không âm thầm tính toán với dữ liệu sai)
    if (typeof validateInputs !== 'undefined' && inputs) {
        const normalized = {
            L: inputs.L || inputs.B_span || 24,
            B: inputs.B || inputs.B_step || 6,
            length: inputs.length || inputs.length_d || 72,
            H_column: inputs.H_column || inputs.H || 8,
            H_roof: inputs.H_roof || inputs.H_rf || 9.25,
            windZone: inputs.windZone || 'II',
            terrainCategory: inputs.terrainCategory || 'B',
            porosityPercent: inputs.porosityPercent !== undefined ? inputs.porosityPercent : 0
        };
        const valRes = validateInputs(normalized);
        if (!valRes.isValid) {
            return {
                steps: [],
                success: false,
                errors: valRes.errors,
                fieldErrors: valRes.fieldErrors,
                loadCases: {},
                geom: null
            };
        }
    }
    
    // 1. Phân tích hình học
    const geom = WindEngine.analyzeGeometry(
        inputs.L || inputs.B_span || 24,
        inputs.B || inputs.B_step || 6,
        inputs.length || inputs.length_d || 72,
        inputs.H_column || 8,
        inputs.H_roof || 9.25,
        "gable"
    );
    
    const terrain = inputs.terrainCategory || 'B';
    const W0_res = StandardData.TCVN2737_2023.Wind.BasicWind.getW0(inputs.windZone);
    const W0 = W0_res.value;
    const gamma_T = StandardData.TCVN2737_2023.Wind.BasicWind.gamma_T; // 0.852
    const W3s_10 = Number((gamma_T * W0).toFixed(3));
    
    // Ghi chú công thức khởi đầu
    steps.push(createCalculationStep(
        "CALC-WIND-001",
        "Áp lực gió cơ sở W₀ và Áp lực 3s chu kỳ 10 năm W₃ₛ,₁₀",
        { standard: 'TCVN 2737:2023', section: 'Mục 10.2.2 & Bảng F.1' },
        "W_{3s,10} = \\gamma_T \\times W_0",
        `W_{3s,10} = ${gamma_T} \\times ${W0} = ${W3s_10}\\text{ kN/m}^2`,
        W3s_10,
        "kN/m2",
        { isPass: true },
        "Ý NGHĨA KÝ HIỆU:\n" +
        "• W_0: Áp lực gió cơ sở ứng với chu kỳ lặp 20 năm theo Bảng F.1 cho Vùng gió " + inputs.windZone + "\n" +
        "• γ_T = 0,852: Hệ số chuyển đổi áp lực gió từ chu kỳ lặp 20 năm về 10 năm (Mục 10.2.2)\n" +
        "• W_{3s,10}: Áp lực gió 3s ứng với chu kỳ lặp 10 năm dùng để thiết kế kết cấu thép"
    ));
    
    steps.push(createCalculationStep(
        "CALC-WIND-002",
        "Hình học nhà & Góc dốc mái α (Hình F.5a & F.6)",
        { standard: 'TCVN 2737:2023', section: 'Phụ lục F.4' },
        "\\tan\\alpha = \\frac{H_{roof} - H_{col}}{L / 2} \\implies \\alpha, \\quad e = \\min(b, 2h)",
        `\\tan\\alpha = \\frac{${geom.H_rf} - ${geom.H_col}}{${geom.L}/2} = \\frac{${geom.roofRise}}{${geom.L/2}} = ${(geom.roofRise/(geom.L/2)).toFixed(3)} \\implies \\alpha = ${geom.alphaDeg}^\\circ; \\quad e = \\min(${geom.theta0.b}, 2 \\times ${geom.h}) = ${geom.theta0.e}\\text{ m}`,
        geom.alphaDeg,
        "độ",
        { isPass: true },
        "Ý NGHĨA KÝ HIỆU:\n" +
        "• L = " + geom.L + " m: Nhịp khung ngang nhà; B = " + geom.B + " m: Bước cột\n" +
        "• H_{col} = " + geom.H_col + " m: Chiều cao đỉnh cột; H_{roof} = " + geom.H_rf + " m: Chiều cao đỉnh mái (h = " + geom.h + " m)\n" +
        "• i = " + geom.slopePercent + " %: Độ dốc mái; α = " + geom.alphaDeg + "°: Góc nghiêng mái dốc hai phía\n" +
        "• e = min(b, 2h): Kích thước tương đương dùng để phân vùng khí động tường và mái theo Hình F.5a & F.6"
    ));
    
    // Tính toán 4 trường hợp gió chính:
    // +X (Gió ngang trái sang, θ = 0°)
    // -X (Gió ngang phải sang, θ = 0°)
    // +Y (Gió dọc đầu hồi 1, θ = 90°)
    // -Y (Gió dọc đầu hồi 2, θ = 90°)
    const pressureSignMode = inputs.internalPressureSign || 'unfavorable';
    const loadCases = {
        '+X': WindEngine.calculateDirectionBranch('+X', geom, terrain, inputs, pressureSignMode, false), // Mái hút
        '+X_DUONG': WindEngine.calculateDirectionBranch('+X', geom, terrain, inputs, pressureSignMode, true), // Mái đẩy
        '-X': WindEngine.calculateDirectionBranch('-X', geom, terrain, inputs, pressureSignMode, false),
        '-X_DUONG': WindEngine.calculateDirectionBranch('-X', geom, terrain, inputs, pressureSignMode, true),
        '+Y': WindEngine.calculateDirectionBranch('+Y', geom, terrain, inputs, pressureSignMode, false),
        '-Y': WindEngine.calculateDirectionBranch('-Y', geom, terrain, inputs, pressureSignMode, false)
    };
    
    // Ghi các bước tính toán chi tiết cho trường hợp Gió +X (Gió ngang θ = 0° điển hình)
    const caseX = loadCases['+X'];
    let stepCount = 3;
    caseX.surfaces.forEach(zone => {
        const stepId = `CALC-WIND-${String(stepCount).padStart(3, '0')}`;
        const title = `Tải trọng Gió θ = 0° (+X) | Bề mặt: ${zone.surface} | Vùng: ${zone.zone} (${zone.name})`;
        const formula = `w_k = W_{3s,10} \\cdot k(z_e) \\cdot (c_e - c_i) \\cdot G_f; \\quad q_d = \\gamma_f \\cdot w_k \\cdot B`;
        const subst = `w_k = ${zone.W3s_10} \\times ${zone.kz} \\times (${zone.ce} - (${zone.ci})) \\times ${zone.Gf} = ${zone.pressure_k}\\text{ kN/m}^2; \\quad q_d = 2,1 \\times ${zone.pressure_k} \\times ${zone.tributaryWidth} = ${zone.frameLineLoad_d}\\text{ kN/m}`;
        
        steps.push(createCalculationStep(
            stepId,
            title,
            { standard: 'TCVN 2737:2023', section: zone.surface === 'Tường' ? 'Bảng F.4' : 'Bảng F.5a' },
            formula,
            subst,
            zone.frameLineLoad_d,
            "kN/m",
            { isPass: true },
            `Ý NGHĨA KÝ HIỆU & THÔNG SỐ VÙNG ${zone.zone}:\n` +
            `• z_e = ${zone.ze} m: Độ cao tương đương theo quy tắc Mục 10.2.4 (h ≤ b)\n` +
            `• k(z_e) = ${zone.kz}: Hệ số độ cao theo Bảng 9 (Địa hình ${terrain})\n` +
            `• G_f = ${zone.Gf}: Hệ số ứng giật công trình nhà thép (G_f = 0,85 + h/1010)\n` +
            `• c_e = ${zone.ce}: Hệ số khí động mặt ngoài tra từ ${zone.surface === 'Tường' ? 'Bảng F.4' : 'Bảng F.5a cho góc dốc α = ' + geom.alphaDeg + '°'}\n` +
            `• c_i = ${zone.ci}: Hệ số khí động áp lực trong theo Mục F.12 (Độ hở μ ≤ 5%)\n` +
            `• c_{net} = c_e - c_i = ${zone.c_net}: Hệ số áp lực tổng hợp\n` +
            `• w_k = ${zone.pressure_k} kN/m²: Áp lực gió tiêu chuẩn trên bề mặt\n` +
            `• w_d = ${zone.pressure_d} kN/m²: Áp lực gió tính toán (hệ số độ tin cậy γ_f = 2,1)\n` +
            `• q_d = ${zone.frameLineLoad_d} kN/m: Tải trọng phân bố dồn lên khung ngang (bước B = ${zone.tributaryWidth} m)`
        ));
        stepCount++;
    });
    
    return {
        steps,
        success: true,
        loadCases,
        geom
    };
}

var globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
globalScope.WindEngine = WindEngine;
globalScope.calculateWindLoad = calculateWindLoad;
