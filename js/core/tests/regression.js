// Independent Calculation Regression Tests (TCVN 2737:2023 & TCVN 5575:2024)
// Bộ kiểm thử hồi quy tự động độc lập kiểm tra toàn diện các module kỹ thuật, tiêu chuẩn và nội lực

const RegressionTests = {
    results: [],

    runAll: function() {
        this.results = [];
        
        // 1. TCVN 2737:2023 Tải trọng Gió & Tiêu chuẩn
        this.testWindRegion();
        this.testAllWindZones();
        this.testTerrainTable8();
        this.testKzTable9();
        this.testKzInterpolation();
        this.testEquivalentHeight();
        this.testWindDirection();
        this.testWallZoning();
        this.testRoofZoning();
        this.testRoofSlopeInterpolation();
        this.testPressureSign();
        this.testInternalPressure();
        this.testInternalPressureEnvelopeThesis();
        this.testFriction();
        this.testFrictionClause1021b();
        this.testGustFactor();
        this.testTributaryLoad();
        
        // 2. TCVN 5575:2024 Kết cấu Thép & Vật liệu
        this.testSteelS235Normative();
        this.testPhiExactFormulas7and8();
        this.testPhiEFullTableD3();
        this.testCFactorClause925();
        this.testSectionCheckAndSlenderness();
        this.testSectionCheckTensionMember();
        this.testSectionCheckPureBending();
        this.testSectionProposal();
        this.testBeamLibraryLookup();
        
        // 3. Khung ngang & Tổ hợp tải trọng
        this.testPortalFrameSolverAndCombinations();
        this.testPositiveRoofWindCombination();
        
        // 4. Module Cấu kiện phụ & Sàn BTCT
        this.testPurlinCladding();
        this.testDynamicRoofSuctionPurlin();
        this.testSlabDesign();
        this.testBeamDesign();
        this.testBeamStressUnits();
        this.testValidationLayer();
        this.testPorosityValidationBoundaries();
        
        // 5. Kiểm tra an toàn số học (Robustness & Integrity)
        this.testNoNaN();
        this.testNoInfinity();
        this.testSourceTraceability();
        
        const passCount = this.results.filter(r => r.pass).length;
        console.log(`\n======================================================`);
        console.log(`TỔNG KẾT HỒI QUY: ${passCount}/${this.results.length} bài test ĐẠT (PASS) - ${(passCount / this.results.length * 100).toFixed(1)}%`);
        console.log(`======================================================\n`);
        return this.results;
    },

    assert: function(name, actual, expected, tolerance = 0.01) {
        let pass = false;
        if (typeof expected === 'number' && typeof actual === 'number') {
            pass = Math.abs(actual - expected) <= tolerance;
        } else {
            pass = actual === expected;
        }
        this.results.push({ name, actual, expected, pass });
        if (!pass) {
            console.error(`[FAIL] ${name} | Kỳ vọng: ${expected} | Thực tế: ${actual}`);
        } else {
            // console.log(`[PASS] ${name}`);
        }
    },

    // 1.1 Vùng gió II: W0 = 0.95 kN/m2 (Bảng 7), W3s,10 = 0.809 kN/m2
    testWindRegion: function() {
        const res = StandardData.TCVN2737_2023.Wind.BasicWind.getW0('II');
        this.assert("testWindRegion - W0 Vùng II = 0.95 kN/m2 (Bảng 7)", res.value, 0.95);
        const gamma_T = StandardData.TCVN2737_2023.Wind.BasicWind.gamma_T;
        this.assert("testWindRegion - gamma_T = 0.852", gamma_T, 0.852);
        const W3s_10 = Number((gamma_T * res.value).toFixed(3));
        this.assert("testWindRegion - W3s,10 = 0.809 kN/m2", W3s_10, 0.809);
    },

    // 1.2 Tất cả các vùng gió I đến V theo Bảng 7 TCVN 2737:2023
    testAllWindZones: function() {
        this.assert("testAllWindZones - Vùng I", StandardData.TCVN2737_2023.Wind.BasicWind.getW0('I').value, 0.65);
        this.assert("testAllWindZones - Vùng II", StandardData.TCVN2737_2023.Wind.BasicWind.getW0('II').value, 0.95);
        this.assert("testAllWindZones - Vùng III", StandardData.TCVN2737_2023.Wind.BasicWind.getW0('III').value, 1.25);
        this.assert("testAllWindZones - Vùng IV", StandardData.TCVN2737_2023.Wind.BasicWind.getW0('IV').value, 1.55);
        this.assert("testAllWindZones - Vùng V", StandardData.TCVN2737_2023.Wind.BasicWind.getW0('V').value, 1.85);
    },

    // 1.3 Dạng địa hình theo Bảng 8 TCVN 2737:2023
    testTerrainTable8: function() {
        const resB = StandardData.TCVN2737_2023.Wind.Terrain.getTerrainData('B');
        this.assert("testTerrainTable8 - Địa hình B alpha = 9.5", resB.alpha, 9.5);
        this.assert("testTerrainTable8 - Địa hình B zg = 274.32m", resB.zg, 274.32);
        this.assert("testTerrainTable8 - Địa hình B zmin = 4.57m", resB.zmin, 4.57);

        const resA = StandardData.TCVN2737_2023.Wind.Terrain.getTerrainData('A');
        this.assert("testTerrainTable8 - Địa hình A alpha = 11.5", resA.alpha, 11.5);
        this.assert("testTerrainTable8 - Địa hình A zg = 213.36m", resA.zg, 213.36);

        const resC = StandardData.TCVN2737_2023.Wind.Terrain.getTerrainData('C');
        this.assert("testTerrainTable8 - Địa hình C alpha = 7.0", resC.alpha, 7.0);
        this.assert("testTerrainTable8 - Địa hình C zg = 365.76m", resC.zg, 365.76);
    },

    // 1.4 Hệ số k(ze) theo Bảng 9 TCVN 2737:2023
    testKzTable9: function() {
        const res10 = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(10, 'B');
        this.assert("testKzTable9 - k(10m, B) = 1.00", res10.value, 1.00);
        const res5 = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(5, 'B');
        this.assert("testKzTable9 - k(5m, B) = 0.87", res5.value, 0.87);
        const res15 = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(15, 'B');
        this.assert("testKzTable9 - k(15m, B) = 1.09", res15.value, 1.09);
    },

    // 1.5 Nội suy k(ze)
    testKzInterpolation: function() {
        const res = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(7.5, 'B');
        // Nội suy giữa 5m (0.87) và 10m (1.00): 0.87 + 0.13 * 0.5 = 0.935 -> 0.94
        this.assert("testKzInterpolation - k(7.5m, B) = 0.94", res.value, 0.94, 0.01);
    },

    // 1.6 Độ cao tương đương ze (Mục 10.2.4)
    testEquivalentHeight: function() {
        const res = StandardData.TCVN2737_2023.Wind.EquivalentHeight.calculateEquivalentHeight(8, 9.25, 25, '+X');
        this.assert("testEquivalentHeight - h<=b rule (ze = h)", res.ze, 9.25);
        this.assert("testEquivalentHeight - rule text contains h <= b", res.rule.includes("h ≤ b => ze = h"), true);
    },

    // 1.7 Phân nhánh 4 hướng gió (+X, -X, +Y, -Y)
    testWindDirection: function() {
        const inputs = { L: 25, B: 9, length: 72, H_column: 8, H_roof: 9.25, windZone: 'II', terrainCategory: 'B' };
        const globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
        const load = globalScope.calculateWindLoad ? globalScope.calculateWindLoad(inputs) : null;
        if (load) {
            this.assert("testWindDirection - có ít nhất 4 nhánh chính", Object.keys(load.loadCases).length >= 4, true);
            this.assert("testWindDirection - có nhánh +X", !!load.loadCases['+X'], true);
            this.assert("testWindDirection - có nhánh -X", !!load.loadCases['-X'], true);
            this.assert("testWindDirection - có nhánh +Y", !!load.loadCases['+Y'], true);
            this.assert("testWindDirection - có nhánh -Y", !!load.loadCases['-Y'], true);
        } else {
            this.assert("testWindDirection", false, true);
        }
    },

    // 1.8 Phân vùng khí động tường (Hình F.5a & Bảng F.4)
    testWallZoning: function() {
        const globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
        const geom = globalScope.WindEngine ? globalScope.WindEngine.analyzeGeometry(25, 9, 72, 8, 9.25, 'gable') : null;
        if (geom) {
            const branch = globalScope.WindEngine.calculateDirectionBranch('+X', geom, 'B', { windZone: 'II', terrainCategory: 'B' });
            const walls = branch.surfaces.filter(s => s.surface === 'Tường');
            this.assert("testWallZoning - có 5 vùng (D, E, A, B, C)", walls.length, 5);
            const zoneD = walls.find(w => w.zone === 'D');
            const zoneE = walls.find(w => w.zone === 'E');
            this.assert("testWallZoning - Vùng D đón gió ce > 0", zoneD.ce > 0, true);
            this.assert("testWallZoning - Vùng E khuất gió ce < 0", zoneE.ce < 0, true);
        } else {
            this.assert("testWallZoning", false, true);
        }
    },

    // 1.9 Phân vùng khí động mái (Hình F.6 & Bảng F.5a)
    testRoofZoning: function() {
        const globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
        const geom = globalScope.WindEngine ? globalScope.WindEngine.analyzeGeometry(25, 9, 72, 8, 9.25, 'gable') : null;
        if (geom) {
            const branch = globalScope.WindEngine.calculateDirectionBranch('+X', geom, 'B', { windZone: 'II', terrainCategory: 'B' });
            const roofs = branch.surfaces.filter(s => s.surface === 'Mái');
            this.assert("testRoofZoning - θ=0° có 5 vùng (F, G, H, J, I)", roofs.length, 5);
            const zoneF = roofs.find(r => r.zone === 'F');
            this.assert("testRoofZoning - Vùng F có diện tích > 0", zoneF.area > 0, true);
        } else {
            this.assert("testRoofZoning", false, true);
        }
    },

    // 1.10 Nội suy góc dốc mái theo Bảng F.5a
    testRoofSlopeInterpolation: function() {
        // Tại alpha = 5.71°: vùng G âm nội suy giữa 5° (-1.2) và 15° (-0.8):
        // ce_G = -1.2 + (5.71 - 5)/(15 - 5) * (-0.8 - (-1.2)) = -1.2 + 0.071 * 0.4 = -1.1716 -> -1.172
        const resG = StandardData.TCVN2737_2023.Wind.Roof.getZoneCpe('G', 0, 5.71, false);
        this.assert("testRoofSlopeInterpolation - ce_G tại 5.71° = -1.172", resG.value, -1.172, 0.005);
        this.assert("testRoofSlopeInterpolation - Status VERIFIED", resG.status, "VERIFIED");
    },

    // 1.11 Phân biệt dấu áp lực
    testPressureSign: function() {
        const globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
        const geom = globalScope.WindEngine ? globalScope.WindEngine.analyzeGeometry(25, 9, 72, 8, 9.25, 'gable') : null;
        if (geom) {
            const branch = globalScope.WindEngine.calculateDirectionBranch('+X', geom, 'B', { windZone: 'II', terrainCategory: 'B' });
            const zoneD = branch.surfaces.find(s => s.zone === 'D');
            const zoneE = branch.surfaces.find(s => s.zone === 'E');
            this.assert("testPressureSign - Vùng D dương", zoneD.ce > 0, true);
            this.assert("testPressureSign - Vùng E âm", zoneE.ce < 0, true);
        } else {
            this.assert("testPressureSign", false, true);
        }
    },

    // 1.12 Hệ số áp lực trong ci (Mục F.12)
    testInternalPressure: function() {
        const res0 = StandardData.TCVN2737_2023.Wind.InternalPressure.getCpi(0, '+');
        this.assert("testInternalPressure - mu=0% ci = +0.2", res0.value, 0.2);
        const res5 = StandardData.TCVN2737_2023.Wind.InternalPressure.getCpi(5, '-');
        this.assert("testInternalPressure - mu=5% ci = -0.2", res5.value, -0.2);
        const res15 = StandardData.TCVN2737_2023.Wind.InternalPressure.getCpi(15, '+');
        this.assert("testInternalPressure - 5%<mu<30% flagged", res15.status, "NEEDS VERIFICATION / USER CONFIRMED");
    },

    // 1.13 Tổ hợp áp lực trong bất lợi nhất (Khớp 100% Đồ án Thầy Hùng & Bích Ngọc)
    testInternalPressureEnvelopeThesis: function() {
        const globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
        const geom = globalScope.WindEngine.analyzeGeometry(24, 6, 114, 11.5, 12.7, 'gable');
        // Alpha = 5.711 độ, H_roof = 12.7m, địa hình B
        const branch = globalScope.WindEngine.calculateDirectionBranch('+X', geom, 'B', { windZone: 'II', terrainCategory: 'B' }, 'unfavorable', false);
        const zoneG = branch.surfaces.find(s => s.zone === 'G');
        this.assert("testInternalPressureEnvelopeThesis - Mái hút c_net = -1.372", zoneG.c_net, -1.372, 0.01);
    },

    // 1.14 Hệ số ma sát mái cf (Mục F.4.2.3)
    testFriction: function() {
        const res = StandardData.TCVN2737_2023.Wind.Friction.getCf(90);
        this.assert("testFriction - cf=0.02 khi theta=90°", res.value, 0.02);
    },

    // 1.14b Điều kiện phát sinh ma sát theo Điều 10.2.1b & Mục F.4.2.3
    testFrictionClause1021b: function() {
        const globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
        const geom = globalScope.WindEngine.analyzeGeometry(25, 9, 72, 8, 9.25, 'gable');
        // θ = 0°: d = 25m, x0 = min(2*72, 4*9.25) = 37m -> d <= x0 -> isApplicable = false
        const branch0 = globalScope.WindEngine.calculateDirectionBranch('+X', geom, 'B', { windZone: 'II', terrainCategory: 'B' });
        this.assert("testFrictionClause1021b - θ=0° không phát sinh ma sát (d <= min(2b, 4h))", branch0.friction.isApplicable, false);
        
        // θ = 90°: d = 72m, x0 = min(2*25, 4*9.25) = 37m -> d > x0 -> isApplicable = true
        const branch90 = globalScope.WindEngine.calculateDirectionBranch('+Y', geom, 'B', { windZone: 'II', terrainCategory: 'B' });
        this.assert("testFrictionClause1021b - θ=90° phát sinh ma sát (d > min(2b, 4h))", branch90.friction.isApplicable, true);
        this.assert("testFrictionClause1021b - θ=90° L_fr = 35m", branch90.friction.L_fr, 35, 0.1);
        this.assert("testFrictionClause1021b - θ=90° Lực ma sát Wf_d > 0", branch90.friction.Wf_d > 0, true);
    },

    // 1.15 Hệ số ứng giật Gf (Phụ lục E)
    testGustFactor: function() {
        const res = StandardData.TCVN2737_2023.Wind.GustFactor.getGf(9.25);
        this.assert("testGustFactor - Gf(9.25m) = 0.86", res.value, 0.86, 0.01);
    },

    // 1.16 Bề rộng truyền tải diện tích
    testTributaryLoad: function() {
        const globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
        const geom = globalScope.WindEngine ? globalScope.WindEngine.analyzeGeometry(25, 9, 72, 8, 9.25, 'gable') : null;
        if (geom) {
            const branch = globalScope.WindEngine.calculateDirectionBranch('+X', geom, 'B', { windZone: 'II', terrainCategory: 'B' });
            const allHaveTrib = branch.surfaces.every(s => s.tributaryWidth === 9);
            this.assert("testTributaryLoad - Bước cột truyền tải B = 9m", allHaveTrib, true);
        } else {
            this.assert("testTributaryLoad", false, true);
        }
    },

    // 2.1 Thép S235 theo TCVN 5575:2024
    testSteelS235Normative: function() {
        const mat = TCVN5575_2024.getMaterialProperties('S235');
        this.assert("testSteelS235Normative - f = 223.81 MPa", mat.f, 223.81, 0.05);
        this.assert("testSteelS235Normative - fv = 129.81 MPa", mat.fv, 129.81, 0.05);
        this.assert("testSteelS235Normative - E = 206000 MPa (Điều 6.3)", mat.E, 206000);
        this.assert("testSteelS235Normative - gamma_c = 1.0", mat.gamma_c, 1.0);
    },

    // 2.2 Hệ số phi chuẩn theo Công thức (7) & (8) và Bảng 7 TCVN 5575:2024
    testPhiExactFormulas7and8: function() {
        const phi05 = TCVN5575_2024.getPhi(0.5, 'b');
        this.assert("testPhiExactFormulas7and8 - lambda_bar < 0.6 => phi = 1.0", phi05, 1.0);
        const phi10 = TCVN5575_2024.getPhi(1.0, 'b');
        this.assert("testPhiExactFormulas7and8 - lambda_bar = 1.0 => phi = 0.95", phi10, 0.95, 0.02);
        const phi314 = TCVN5575_2024.getPhi(3.14, 'b');
        this.assert("testPhiExactFormulas7and8 - lambda_bar = 3.14 => phi = 0.61-0.62", phi314, 0.615, 0.02);
    },

    // 2.3 Bảng D.3 chuẩn 16x26 TCVN 5575:2024
    testPhiEFullTableD3: function() {
        const d3 = StandardData.TCVN5575_2024.PhiE;
        const res1 = d3.getPhiE(1.5, 0.5);
        this.assert("testPhiEFullTableD3 - l_bar=1.5, m=0.5 => phi_e = 0.707", res1.value, 0.707, 0.01);
        const res2 = d3.getPhiE(2.0, 1.0);
        this.assert("testPhiEFullTableD3 - l_bar=2.0, m=1.0 => phi_e = 0.536", res2.value, 0.536, 0.01);
        const res3 = d3.getPhiE(4.0, 5.0);
        this.assert("testPhiEFullTableD3 - l_bar=4.0, m=5.0 => phi_e = 0.158", res3.value, 0.158, 0.01);
    },

    // 2.4 Hệ số c theo Mục 9.2.5 Công thức (111)-(113) TCVN 5575:2024
    testCFactorClause925: function() {
        const c_engine = StandardData.TCVN5575_2024.C_Factor;
        const c05 = c_engine.getC(0.5);
        this.assert("testCFactorClause925 - m=0.5 => c = 0.741 (CT 111)", c05.value, 0.741, 0.01);
        const c20 = c_engine.getC(2.0);
        this.assert("testCFactorClause925 - m=2.0 => c = 0.400 (CT 111)", c20.value, 0.400, 0.01);
        const c60 = c_engine.getC(6.0);
        this.assert("testCFactorClause925 - m=6.0 => c = 0.164 (CT 113)", c60.value, 0.164, 0.01);
    },

    // 2.5 Kiểm tra tiết diện cột và độ mảnh giới hạn
    testSectionCheckAndSlenderness: function() {
        const sec = createSectionRecord('I', 'I 600x300x10x16', 600, 300, 10, 16);
        const mat = TCVN5575_2024.getMaterialProperties('S235');
        const res = checkSectionCapacity(sec, 150, 250, 60, mat, 8.0 * 2.0, 8.0 * 1.0);
        this.assert("testSectionCheckAndSlenderness - Thành công", res.success, true);
        this.assert("testSectionCheckAndSlenderness - Đạt khả năng chịu lực", res.isAllPass, true);
        this.assert("testSectionCheckAndSlenderness - Độ mảnh lambda <= 180", res.slenderness.isPass, true);
        this.assert("testSectionCheckAndSlenderness - Có hệ số tận dụng", res.utilization.max > 0, true);
    },

    // 2.5b Kiểm tra cấu kiện chịu kéo uốn (Uplift N < 0) theo TCVN 5575:2024 Mục 9.1
    testSectionCheckTensionMember: function() {
        const sec = createSectionRecord('I', 'I 600x300x10x16', 600, 300, 10, 16);
        const mat = TCVN5575_2024.getMaterialProperties('S235');
        // N = -45.2 kN (kéo do bốc gió), M = 150 kNm
        const res = checkSectionCapacity(sec, -45.2, 150, 40, mat, 8.0 * 2.0, 8.0 * 1.0);
        this.assert("testSectionCheckTensionMember - Nhận diện đúng cấu kiện chịu kéo", res.isTension, true);
        this.assert("testSectionCheckTensionMember - Giới hạn độ mảnh kéo [lambda]=300 (Bảng 26)", res.slenderness.limit, 300);
        this.assert("testSectionCheckTensionMember - Đạt kiểm tra chịu lực", res.isAllPass, true);
        this.assert("testSectionCheckTensionMember - Không xét uốn dọc nén trong mặt phẳng (util=0)", res.utilization.inPlane, 0);
        this.assert("testSectionCheckTensionMember - Không xét uốn dọc nén ngoài mặt phẳng (util=0)", res.utilization.outPlane, 0);
    },

    // 2.5c Kiểm tra uốn thuần túy (N = 0)
    testSectionCheckPureBending: function() {
        const sec = createSectionRecord('I', 'I 600x300x10x16', 600, 300, 10, 16);
        const mat = TCVN5575_2024.getMaterialProperties('S235');
        // N = 0 (uốn thuần túy), M = 200 kNm
        const res = checkSectionCapacity(sec, 0, 200, 50, mat, 8.0 * 2.0, 8.0 * 1.0);
        this.assert("testSectionCheckPureBending - isCompression là false", res.isCompression, false);
        this.assert("testSectionCheckPureBending - isTension là false", res.isTension, false);
        this.assert("testSectionCheckPureBending - Đạt ứng suất bền uốn", res.utilization.strength > 0, true);
    },

    // 2.6 Đề xuất tiết diện
    testSectionProposal: function() {
        const mat = TCVN5575_2024.getMaterialProperties('S235');
        const res = proposeSectionsForDesign({ N: 150, Mx: 200, Vx: 50 }, mat, 16.0, 8.0);
        this.assert("testSectionProposal - Có ít nhất 1 phương án đạt", res.candidates.length > 0, true);
        this.assert("testSectionProposal - Trạng thái PASS", res.candidates[0].status, "PASS");
        this.assert("testSectionProposal - Đã sắp xếp theo khối lượng", res.candidates[0].massPerMeter <= res.candidates[res.candidates.length - 1].massPerMeter, true);
    },

    // 2.7 Thư viện tiết diện dầm I (SectionLookup)
    testBeamLibraryLookup: function() {
        const lib1 = StandardData.TCVN5575_2024.BeamLibrary;
        const lib2 = (typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this)).TCVN5575_2024?.BeamLibrary;
        this.assert("testBeamLibraryLookup - BeamLibrary trong StandardData có ít nhất 8 tiết diện", Array.isArray(lib1) && lib1.length >= 8, true);
        this.assert("testBeamLibraryLookup - BeamLibrary được ánh xạ đồng bộ sang TCVN5575_2024", Array.isArray(lib2) && lib2.length >= 8, true);
        this.assert("testBeamLibraryLookup - Có tiết diện I350", lib1.some(b => b.id === 'I350'), true);
    },

    // 3.1 Khung ngang và tổ hợp tải trọng
    testPortalFrameSolverAndCombinations: function() {
        const windRes = calculateWindLoad(TestCase01.inputs);
        const gravRes = calculateGravityLoads(TestCase01.inputs, TestCase01.roofComponents);
        const combRes = calculateLoadCombinations(gravRes, windRes);
        
        this.assert("testPortalFrameSolver - Thành công", combRes.success, true);
        this.assert("testPortalFrameSolver - Đủ 7 trường hợp nội lực", combRes.frameForces.length, 7);
        
        // Kiểm tra trường hợp mô men chân cột lớn nhất
        const maxM = combRes.governingForces.columnBase.maxM;
        this.assert("testPortalFrameSolver - Max M > 200 kNm", Math.abs(maxM.Mx) > 200, true);
        
        // Kiểm tra lực nhổ chân cột (dấu âm)
        const minN = combRes.governingForces.columnBase.minN;
        this.assert("testPortalFrameSolver - Có lực nhổ chân cột (N < 0)", minN.N < 0, true);
    },

    // 3.2 Trường hợp gió mái đẩy (+X_DUONG)
    testPositiveRoofWindCombination: function() {
        const windRes = calculateWindLoad(TestCase01.inputs);
        const gravRes = calculateGravityLoads(TestCase01.inputs, TestCase01.roofComponents);
        const combRes = calculateLoadCombinations(gravRes, windRes);
        const pushCase = combRes.frameForces.find(f => f.id === 'CB1B_Push');
        this.assert("testPositiveRoofWindCombination - Có trường hợp tổ hợp gió mái đẩy CB1B_Push", !!pushCase, true);
        this.assert("testPositiveRoofWindCombination - Lực dọc N của gió mái đẩy là nén (N > 0)", pushCase && pushCase.N > 0, true);
    },

    // 4.1 Tôn lợp và xà gồ
    testPurlinCladding: function() {
        const res = PurlinCladdingEngine.designRoofCladding(null, 1.2, 5.71, 0.95, 1.05, -1.372);
        this.assert("testPurlinCladding - Kiểm tra tole đạt", res.isAllPass, true);
        const purlinRes = PurlinCladdingEngine.designPurlin(null, null, 1.2, 9.0, 5.71, 0.95, 1.05, -1.372);
        this.assert("testPurlinCladding - Tĩnh tải xà gồ > 0", purlinRes.actualRoofDeadLoad_kN_m2 > 0, true);
    },

    // 4.1b Tải trọng hút mái động tác dụng lên xà gồ
    testDynamicRoofSuctionPurlin: function() {
        // Khảo sát theo Đồ án tham chiếu Thầy Hùng & Bích Ngọc (B = 6,0m)
        const res6m = PurlinCladdingEngine.designPurlin(null, null, 1.2, 6.0, 5.71, 0.95, 1.05, -1.372);
        this.assert("testDynamicRoofSuctionPurlin - Bước cột B=6m đạt khả năng chịu lực", res6m.isAllPass, true);
        this.assert("testDynamicRoofSuctionPurlin - Moment uốn Mx1 > 0", res6m.combo1.Mx > 0, true);
        
        // Khảo sát bước cột lớn B = 9,0m (Đỗ Minh Nguyên): cảnh báo vượt khả năng chịu lực của tiết diện Z250x1.9
        const res9m = PurlinCladdingEngine.designPurlin(null, null, 1.2, 9.0, 5.71, 0.95, 1.05, -1.372);
        this.assert("testDynamicRoofSuctionPurlin - Bước cột B=9m cảnh báo vượt ứng suất Z250", res9m.combo1.isStrengthPass, false);
    },

    // 4.2 Sàn bê tông cốt thép
    testSlabDesign: function() {
        const res = SlabBeamEngine.calculateSlab({ L1: 2.5, L2: 9.0, liveLoad: 4.0 });
        this.assert("testSlabDesign - Chiều dày sàn hs >= 80mm", res.hs_chosen >= 80, true);
        this.assert("testSlabDesign - Cốt thép As > 0", res.reinforcement.As_calc_cm2 > 0, true);
    },

    // 4.3 Dầm thép đỡ sàn
    testBeamDesign: function() {
        const res = SlabBeamEngine.calculateBeam({ L_beam: 9.0, tributaryWidth: 2.5, slabLoadQd: 6.5, slabLoadQk: 5.0, steelGrade: 'S235', chosenBeamId: 'I350' });
        this.assert("testBeamDesign - Mmax > 0", res.M_max_kNm > 0, true);
        this.assert("testBeamDesign - Ứng suất uốn sigma > 0", res.checks.sigma_uon > 0, true);
    },

    // 4.3b Đồng bộ đơn vị ứng suất dầm (MPa)
    testBeamStressUnits: function() {
        const res = SlabBeamEngine.calculateBeam({ L_beam: 9.0, tributaryWidth: 2.5, slabLoadQd: 6.5, slabLoadQk: 5.0, steelGrade: 'S235', chosenBeamId: 'I350' });
        this.assert("testBeamStressUnits - Có trường sigma_uon_MPa", res.checks.sigma_uon_MPa !== undefined, true);
        this.assert("testBeamStressUnits - Có trường f_allow_MPa", res.checks.f_allow_MPa !== undefined, true);
        this.assert("testBeamStressUnits - Đổi đúng đơn vị 1 kN/cm2 = 10 MPa", Math.abs(res.checks.sigma_uon_MPa - res.checks.sigma_uon * 10) < 0.05, true);
        this.assert("testBeamStressUnits - f_allow_MPa = 223.8 MPa", Math.abs(res.checks.f_allow_MPa - 223.8) < 0.5, true);
    },

    // 4.4 Lớp kiểm tra tính hợp lệ dữ liệu
    testValidationLayer: function() {
        const validRes = validateInputs(ProjectState.inputs);
        this.assert("testValidationLayer - ProjectState hợp lệ", validRes.isValid, true);
        this.assert("testValidationLayer - Không có lỗi", validRes.errors.length, 0);

        const invalidGeomRes = validateInputs({ ...ProjectState.inputs, H_roof: 7.0, H_column: 8.0 });
        this.assert("testValidationLayer - Phát hiện lỗi H_roof <= H_column", invalidGeomRes.isValid, false);
        this.assert("testValidationLayer - Có fieldError H_roof", !!invalidGeomRes.fieldErrors.H_roof, true);

        const noSlopeInput = { ...ProjectState.inputs };
        delete noSlopeInput.roofSlope;
        const autoSlopeRes = validateInputs(noSlopeInput);
        this.assert("testValidationLayer - Tự động tính roofSlope khi thiếu", autoSlopeRes.isValid, true);
    },

    // 4.4b Biên kiểm tra độ hở tường μ (%)
    testPorosityValidationBoundaries: function() {
        const resNeg = validateInputs({ ...TestCase01.inputs, porosityPercent: -5 });
        this.assert("testPorosityValidationBoundaries - Chặn độ hở âm (mu < 0)", resNeg.isValid, false);
        const resOver = validateInputs({ ...TestCase01.inputs, porosityPercent: 105 });
        this.assert("testPorosityValidationBoundaries - Chặn độ hở vượt 100% (mu > 100)", resOver.isValid, false);
        const resValid = validateInputs({ ...TestCase01.inputs, porosityPercent: 15 });
        this.assert("testPorosityValidationBoundaries - Chấp nhận độ hở hợp lệ (mu = 15%)", resValid.isValid, true);
    },

    // 5.1 Không có NaN
    testNoNaN: function() {
        const globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
        const geom = globalScope.WindEngine.analyzeGeometry(25, 9, 72, 8, 9.25, 'gable');
        const branch = globalScope.WindEngine.calculateDirectionBranch('+X', geom, 'B', { windZone: 'II', terrainCategory: 'B' });
        const hasNaN = branch.surfaces.some(s => isNaN(s.pressure_k) || isNaN(s.frameLineLoad_d) || isNaN(s.resultant_kN));
        this.assert("testNoNaN - Không xuất hiện giá trị NaN trong tính gió", hasNaN, false);
    },

    // 5.2 Không có vô hạn (Infinity)
    testNoInfinity: function() {
        const globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
        const geom = globalScope.WindEngine.analyzeGeometry(25, 9, 72, 8, 9.25, 'gable');
        const branch = globalScope.WindEngine.calculateDirectionBranch('+X', geom, 'B', { windZone: 'II', terrainCategory: 'B' });
        const hasInf = branch.surfaces.some(s => !isFinite(s.pressure_k) || !isFinite(s.frameLineLoad_d));
        this.assert("testNoInfinity - Không xuất hiện giá trị vô hạn trong tính gió", hasInf, false);
    },

    // 5.3 Nguồn gốc điều khoản tiêu chuẩn
    testSourceTraceability: function() {
        const res = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(10, 'B');
        this.assert("testSourceTraceability - Nguồn tra cứu k(ze) rõ ràng", !!res.source, true);
    }
};

var globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
globalScope.RegressionTests = RegressionTests;

// Tự động chạy khi gọi qua Node.js (node js/core/tests/regression.js)
if (typeof window === 'undefined' && typeof require !== 'undefined') {
    const fs = require('fs');
    const path = require('path');
    
    if (require.main === module) {
        const rootDir = path.resolve(__dirname, '../../..');
        const coreFiles = [
            'js/core/models.js',
            'js/core/standards/tcvn2737_2023.js',
            'js/core/standards/tcvn5575_2024.js',
            'js/core/standards/standard_data.js',
            'js/core/standards/registry.js',
            'js/core/engine/validation.js',
            'js/core/engine/loads_calc.js',
            'js/core/engine/wind_load.js',
            'js/core/engine/load_combinations.js',
            'js/core/engine/section_check.js',
            'js/core/engine/section_proposal.js',
            'js/core/engine/purlin_cladding.js',
            'js/core/engine/slab_beam.js',
            'js/core/engine/connections.js'
        ];
        
        for (const file of coreFiles) {
            const filePath = path.join(rootDir, file);
            if (fs.existsSync(filePath)) {
                const code = fs.readFileSync(filePath, 'utf8');
                const fn = new Function(code);
                fn.call(globalScope);
            }
        }
        
        console.log("======================================================");
        console.log("CHẠY BỘ KIỂM THỬ HỒI QUY TỰ ĐỘNG ĐỘC LẬP TCVN 2737/5575");
        console.log("======================================================");
        const results = RegressionTests.runAll();
        const failures = results.filter(r => !r.pass);
        if (failures.length > 0) {
            console.error(`BỘ KIỂM THỬ THẤT BẠI: Có ${failures.length} lỗi.`);
            process.exit(1);
        } else {
            console.log("TOÀN BỘ CÁC BÀI TOÁN KIỂM THỬ ĐÃ ĐẠT 100%!");
            process.exit(0);
        }
    }
}
