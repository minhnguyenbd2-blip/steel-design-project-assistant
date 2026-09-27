// Independent Calculation Regression Tests
// Bộ kiểm thử hồi quy tự động cho toàn bộ hệ thống tính toán kết cấu thép

const RegressionTests = {
    results: [],

    runAll: function() {
        this.results = [];
        this.testWindRegion();
        this.testTerrain();
        this.testKzTable();
        this.testKzInterpolation();
        this.testEquivalentHeight();
        this.testWindDirection();
        this.testWallZoning();
        this.testRoofZoning();
        this.testRoofSlopeInterpolation();
        this.testPressureSign();
        this.testInternalPressure();
        this.testFriction();
        this.testGustFactor();
        this.testTributaryLoad();
        this.testNoNaN();
        this.testNoInfinity();
        this.testSourceTraceability();
        this.testPurlinCladding();
        this.testSlabDesign();
        this.testBeamDesign();
        this.testValidationLayer();
        
        console.log("Kết quả Kiểm thử Hồi quy (Regression Tests):", this.results);
        const passCount = this.results.filter(r => r.pass).length;
        console.log(`TỔNG KẾT: ${passCount}/${this.results.length} bài test ĐẠT (PASS).`);
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
        if (!pass) console.error(`TEST THẤT BẠI: ${name}. Kỳ vọng ${expected}, nhận được ${actual}`);
    },

    testWindRegion: function() {
        const res = StandardData.TCVN2737_2023.Wind.BasicWind.getW0('II');
        this.assert("testWindRegion", res.value, 0.83);
    },
    testTerrain: function() {
        const res = StandardData.TCVN2737_2023.Wind.Terrain.getTerrainData('B');
        this.assert("testTerrain", res.alpha, 0.16);
    },
    testKzTable: function() {
        const res = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(10, 'B');
        this.assert("testKzTable", res.value, 1.00);
    },
    testKzInterpolation: function() {
        const res = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(7.5, 'B');
        this.assert("testKzInterpolation", res.value, 0.94);
    },
    testEquivalentHeight: function() {
        const res = StandardData.TCVN2737_2023.Wind.EquivalentHeight.calculateEquivalentHeight(8, 9.25, 25, '+X');
        this.assert("testEquivalentHeight - h<=b rule", res.ze, 9.25);
        this.assert("testEquivalentHeight - rule text", res.rule, "h ≤ b => ze = h");
    },
    testWindDirection: function() {
        const inputs = { L: 25, B: 9, length: 72, H_column: 8, H_roof: 9.25, windZone: 'II', terrainCategory: 'B' };
        const load = window.calculateWindLoad ? window.calculateWindLoad(inputs) : null;
        if (load) {
            this.assert("testWindDirection - có đủ 4 nhánh chính", Object.keys(load.loadCases).length >= 4, true);
            this.assert("testWindDirection - +X", !!load.loadCases['+X'], true);
            this.assert("testWindDirection - +Y", !!load.loadCases['+Y'], true);
        } else {
            this.assert("testWindDirection", false, true);
        }
    },
    testWallZoning: function() {
        const geom = window.WindEngine ? window.WindEngine.analyzeGeometry(25, 9, 72, 8, 9.25, 'gable') : null;
        if (geom) {
            const branch = window.WindEngine.calculateDirectionBranch('+X', geom, 'B', { windZone: 'II', terrainCategory: 'B' });
            const walls = branch.surfaces.filter(s => s.surface === 'Tường');
            this.assert("testWallZoning - có 5 vùng (D, E, A, B, C)", walls.length, 5);
            const zoneD = walls.find(w => w.zone === 'D');
            this.assert("testWallZoning - Vùng D đón gió ce > 0", zoneD.ce > 0, true);
        } else {
            this.assert("testWallZoning", false, true);
        }
    },
    testRoofZoning: function() {
        const geom = window.WindEngine ? window.WindEngine.analyzeGeometry(25, 9, 72, 8, 9.25, 'gable') : null;
        if (geom) {
            const branch = window.WindEngine.calculateDirectionBranch('+X', geom, 'B', { windZone: 'II', terrainCategory: 'B' });
            const roofs = branch.surfaces.filter(s => s.surface === 'Mái');
            this.assert("testRoofZoning - θ=0° có 5 vùng (F, G, H, J, I)", roofs.length, 5);
            const zoneF = roofs.find(r => r.zone === 'F');
            this.assert("testRoofZoning - Vùng F có diện tích > 0", zoneF.area > 0, true);
        } else {
            this.assert("testRoofZoning", false, true);
        }
    },
    testRoofSlopeInterpolation: function() {
        // Bảng F.5a: tại alpha = 5.71° vùng F âm nội suy giữa 5° (-1.7) và 15° (-0.9)
        const res = StandardData.TCVN2737_2023.Wind.Roof.getZoneCpe('F', 0, 5.71, false);
        this.assert("testRoofSlopeInterpolation - Status VERIFIED", res.status, "VERIFIED");
        this.assert("testRoofSlopeInterpolation - ce < 0", res.value < 0, true);
    },
    testPressureSign: function() {
        // Kiểm tra phân biệt dấu áp lực đón gió D (> 0) và hút gió E (< 0)
        const geom = window.WindEngine ? window.WindEngine.analyzeGeometry(25, 9, 72, 8, 9.25, 'gable') : null;
        if (geom) {
            const branch = window.WindEngine.calculateDirectionBranch('+X', geom, 'B', { windZone: 'II', terrainCategory: 'B' });
            const zoneD = branch.surfaces.find(s => s.zone === 'D');
            const zoneE = branch.surfaces.find(s => s.zone === 'E');
            this.assert("testPressureSign - Vùng D dương", zoneD.ce > 0, true);
            this.assert("testPressureSign - Vùng E âm", zoneE.ce < 0, true);
        } else {
            this.assert("testPressureSign", false, true);
        }
    },
    testInternalPressure: function() {
        const res = StandardData.TCVN2737_2023.Wind.InternalPressure.getCpi(0, '+');
        this.assert("testInternalPressure - VERIFIED", res.status, "VERIFIED");
        this.assert("testInternalPressure - value 0.2", res.value, 0.2);
    },
    testFriction: function() {
        const res = StandardData.TCVN2737_2023.Wind.Friction.getCf(90);
        this.assert("testFriction - cf=0.02 khi theta=90", res.value, 0.02);
    },
    testGustFactor: function() {
        const res = StandardData.TCVN2737_2023.Wind.GustFactor.getGf(9.25);
        this.assert("testGustFactor", res.value, 0.86, 0.01);
    },
    testTributaryLoad: function() {
        const geom = window.WindEngine ? window.WindEngine.analyzeGeometry(25, 9, 72, 8, 9.25, 'gable') : null;
        if (geom) {
            const branch = window.WindEngine.calculateDirectionBranch('+X', geom, 'B', { windZone: 'II', terrainCategory: 'B' });
            const allHaveTrib = branch.surfaces.every(s => s.tributaryWidth === 9);
            this.assert("testTributaryLoad - Bước cột truyền tải B = 9m", allHaveTrib, true);
        } else {
            this.assert("testTributaryLoad", false, true);
        }
    },
    testNoNaN: function() {
        const geom = window.WindEngine ? window.WindEngine.analyzeGeometry(25, 9, 72, 8, 9.25, 'gable') : null;
        if (geom) {
            const branch = window.WindEngine.calculateDirectionBranch('+X', geom, 'B', { windZone: 'II', terrainCategory: 'B' });
            const hasNaN = branch.surfaces.some(s => isNaN(s.pressure_k) || isNaN(s.frameLineLoad_d) || isNaN(s.resultant_kN));
            this.assert("testNoNaN", hasNaN, false);
        } else {
            this.assert("testNoNaN", false, true);
        }
    },
    testNoInfinity: function() {
        const geom = window.WindEngine ? window.WindEngine.analyzeGeometry(25, 9, 72, 8, 9.25, 'gable') : null;
        if (geom) {
            const branch = window.WindEngine.calculateDirectionBranch('+X', geom, 'B', { windZone: 'II', terrainCategory: 'B' });
            const hasInf = branch.surfaces.some(s => !isFinite(s.pressure_k) || !isFinite(s.frameLineLoad_d));
            this.assert("testNoInfinity", hasInf, false);
        } else {
            this.assert("testNoInfinity", false, true);
        }
    },
    testSourceTraceability: function() {
        const res = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(10, 'B');
        this.assert("testSourceTraceability", res.source !== undefined, true);
    },
    testPurlinCladding: function() {
        const res = PurlinCladdingEngine.designRoofCladding(null, 1.2, 5.71, 0.83, 1.0, -1.372);
        this.assert("testPurlinCladding - Kiểm tra tole", res.isAllPass, true);
        const purlinRes = PurlinCladdingEngine.designPurlin(null, null, 1.2, 9.0, 5.71, 0.83, 1.0, -1.372);
        this.assert("testPurlinCladding - Tĩnh tải xà gồ > 0", purlinRes.actualRoofDeadLoad_kN_m2 > 0, true);
    },
    testSlabDesign: function() {
        const res = SlabBeamEngine.calculateSlab({ L1: 2.5, L2: 9.0, liveLoad: 4.0 });
        this.assert("testSlabDesign - Chiều dày sàn hs >= 80mm", res.hs_chosen >= 80, true);
        this.assert("testSlabDesign - Cốt thép As > 0", res.reinforcement.As_calc_cm2 > 0, true);
    },
    testBeamDesign: function() {
        const res = SlabBeamEngine.calculateBeam({ L_beam: 9.0, tributaryWidth: 2.5, slabLoadQd: 6.5, slabLoadQk: 5.0, steelGrade: 'S235', chosenBeamId: 'I350' });
        this.assert("testBeamDesign - Mmax > 0", res.M_max_kNm > 0, true);
        this.assert("testBeamDesign - sigma uốn hợp lệ", res.checks.sigma_uon > 0, true);
    },
    testValidationLayer: function() {
        // 1. Kiểm tra dữ liệu chuẩn ProjectState hợp lệ
        const validRes = validateInputs(ProjectState.inputs);
        this.assert("testValidationLayer - ProjectState hợp lệ", validRes.isValid, true);
        this.assert("testValidationLayer - Không có lỗi", validRes.errors.length, 0);

        // 2. Kiểm tra phát hiện lỗi khi H_roof <= H_col
        const invalidGeomRes = validateInputs({ ...ProjectState.inputs, H_roof: 7.0, H_column: 8.0 });
        this.assert("testValidationLayer - Phát hiện lỗi H_roof <= H_column", invalidGeomRes.isValid, false);
        this.assert("testValidationLayer - Có fieldError H_roof", !!invalidGeomRes.fieldErrors.H_roof, true);

        // 3. Kiểm tra tự động suy ra roofSlope khi thiếu
        const noSlopeInput = { ...ProjectState.inputs };
        delete noSlopeInput.roofSlope;
        const autoSlopeRes = validateInputs(noSlopeInput);
        this.assert("testValidationLayer - Tự động tính roofSlope khi thiếu", autoSlopeRes.isValid, true);
    }
};

window.RegressionTests = RegressionTests;
