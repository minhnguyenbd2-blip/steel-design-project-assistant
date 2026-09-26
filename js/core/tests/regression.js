// Independent Calculation Regression Tests

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
        this.testGlobalWind();
        this.testLoadCases();
        this.testNoNaN();
        this.testNoInfinity();
        this.testSourceTraceability();
        
        console.log("Regression Test Results:", this.results);
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
        if (!pass) console.error(`TEST FAILED: ${name}. Expected ${expected}, got ${actual}`);
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
        // h=9.25, b=25 → h <= b → ze = h = 9.25 (regardless of z)
        const res = StandardData.TCVN2737_2023.Wind.EquivalentHeight.calculateEquivalentHeight(8, 9.25, 25, '+X');
        this.assert("testEquivalentHeight - h<=b rule", res.ze, 9.25);
        this.assert("testEquivalentHeight - rule text", res.rule, "h <= b => ze = h");
    },
    testWindDirection: function() {
        // Mock wind engine input
        const inputs = { L: 72, B: 25, H_column: 8, H_roof: 9.25, roofSlope: 5.71, windZone: 'II', terrainCategory: 'B', T1: 0.5 };
        const load = window.calculateWindLoad ? window.calculateWindLoad(inputs) : null;
        if (load) {
            this.assert("testWindDirection - 4 branches", Object.keys(load.loadCases).length, 4);
            this.assert("testWindDirection - +X", !!load.loadCases['+X'], true);
            this.assert("testWindDirection - -Y", !!load.loadCases['-Y'], true);
        } else {
            this.assert("testWindDirection", false, true);
        }
    },
    testWallZoning: function() {
        const geom = window.WindEngine ? window.WindEngine.analyzeGeometry(72, 25, 8, 9.25, 'gable', 5.71) : null;
        if (geom) {
            const branch = window.WindEngine.calculateDirectionBranch('+X', geom, 'B', { L: 72, B: 25, H_column: 8, H_roof: 9.25, windZone: 'II', terrainCategory: 'B', T1: 0.5 });
            const walls = branch.surfaces.filter(s => s.surface === 'Wall');
            // D, E, A, B, C expected because d (72) > e (25)
            this.assert("testWallZoning - length", walls.length, 5);
            const zoneA = walls.find(w => w.zone === 'A');
            this.assert("testWallZoning - Zone A width", zoneA.width, 5); // e/5 = 25/5 = 5
            const zoneC = walls.find(w => w.zone === 'C');
            this.assert("testWallZoning - Zone C width", zoneC.width, 72 - 25); // d - e = 47
        } else {
            this.assert("testWallZoning", false, true);
        }
    },
    testRoofZoning: function() {
        const geom = window.WindEngine ? window.WindEngine.analyzeGeometry(72, 25, 8, 9.25, 'gable', 5.71) : null;
        if (geom) {
            const branch = window.WindEngine.calculateDirectionBranch('+X', geom, 'B', { L: 72, B: 25, H_column: 8, H_roof: 9.25, windZone: 'II', terrainCategory: 'B', T1: 0.5 });
            const roofs = branch.surfaces.filter(s => s.surface === 'Roof');
            // e = 25, e/4 = 6.25, e/10 = 2.5
            // Zones: F, G, H, I, J
            this.assert("testRoofZoning - length", roofs.length, 5);
            const zoneF = roofs.find(r => r.zone === 'F');
            this.assert("testRoofZoning - Zone F area", zoneF.area, 6.25 * 2.5);
        } else {
            this.assert("testRoofZoning", false, true);
        }
    },
    testRoofSlopeInterpolation: function() {
        // Data missing, so should return NEEDS VERIFICATION
        const res = StandardData.TCVN2737_2023.Wind.Roof.getZoneCpe('F', 0, 5.71);
        this.assert("testRoofSlopeInterpolation - Needs verification", res.status, "NEEDS VERIFICATION");
    },
    testPressureSign: function() {
        // Since ce data is NEEDS VERIFICATION (returns null), all pressures must be exactly 0
        const geom = window.WindEngine ? window.WindEngine.analyzeGeometry(72, 25, 8, 9.25, 'gable', 5.71) : null;
        if (geom) {
            const branch = window.WindEngine.calculateDirectionBranch('+X', geom, 'B', { L: 72, B: 25, H_column: 8, H_roof: 9.25, windZone: 'II', terrainCategory: 'B', T1: 0.5 });
            const allZero = branch.surfaces.every(s => s.pressure === 0);
            this.assert("testPressureSign - all zero when ce=null", allZero, true);
        } else {
            this.assert("testPressureSign", false, true);
        }
    },
    testInternalPressure: function() {
        const res = StandardData.TCVN2737_2023.Wind.InternalPressure.getCpi({});
        this.assert("testInternalPressure", res.status, "NEEDS VERIFICATION");
    },
    testFriction: function() {
        const res = StandardData.TCVN2737_2023.Wind.Friction.getCf();
        this.assert("testFriction", res.status, "NEEDS VERIFICATION");
    },
    testGustFactor: function() {
        const res = StandardData.TCVN2737_2023.Wind.GustFactor.getGf(0.5);
        this.assert("testGustFactor", res.value, 0.85);
    },
    testTributaryLoad: function() {
        const geom = window.WindEngine ? window.WindEngine.analyzeGeometry(72, 25, 8, 9.25, 'gable', 5.71) : null;
        if (geom) {
            const branch = window.WindEngine.calculateDirectionBranch('+X', geom, 'B', { L: 72, B: 25, H_column: 8, H_roof: 9.25, windZone: 'II', terrainCategory: 'B', T1: 0.5 });
            const allHaveTrib = branch.surfaces.every(s => s.tributaryWidth !== undefined && s.tributaryWidth > 0);
            this.assert("testTributaryLoad - all zones have tributaryWidth", allHaveTrib, true);
            const allHaveFrameLoad = branch.surfaces.every(s => s.frameLineLoad !== undefined && !isNaN(s.frameLineLoad));
            this.assert("testTributaryLoad - all zones have frameLineLoad", allHaveFrameLoad, true);
        } else {
            this.assert("testTributaryLoad", false, true);
        }
    },
    testGlobalWind: function() {
        const inputs = { L: 72, B: 25, H_column: 8, H_roof: 9.25, roofSlope: 5.71, windZone: 'II', terrainCategory: 'B', T1: 0.5 };
        const load = window.calculateWindLoad ? window.calculateWindLoad(inputs) : null;
        if (load) {
            this.assert("testGlobalWind - has loadCases", !!load.loadCases, true);
            this.assert("testGlobalWind - Fx defined", load.loadCases['+X'].Fx !== undefined, true);
        } else {
            this.assert("testGlobalWind", false, true);
        }
    },
    testLoadCases: function() {
        const inputs = { L: 72, B: 25, H_column: 8, H_roof: 9.25, roofSlope: 5.71, windZone: 'II', terrainCategory: 'B', T1: 0.5 };
        const load = window.calculateWindLoad ? window.calculateWindLoad(inputs) : null;
        if (load) {
            const ids = Object.values(load.loadCases).map(c => c.id);
            this.assert("testLoadCases - WIND_POS_X exists", ids.includes('WIND_POS_X'), true);
            this.assert("testLoadCases - WIND_NEG_Y exists", ids.includes('WIND_NEG_Y'), true);
            this.assert("testLoadCases - each case has surfaces", Object.values(load.loadCases).every(c => c.surfaces.length > 0), true);
        } else {
            this.assert("testLoadCases", false, true);
        }
    },
    testNoNaN: function() {
        const geom = window.WindEngine ? window.WindEngine.analyzeGeometry(72, 25, 8, 9.25, 'gable', 5.71) : null;
        if (geom) {
            const branch = window.WindEngine.calculateDirectionBranch('+X', geom, 'B', { L: 72, B: 25, H_column: 8, H_roof: 9.25, windZone: 'II', terrainCategory: 'B', T1: 0.5 });
            const hasNaN = branch.surfaces.some(s => isNaN(s.pressure) || isNaN(s.area) || isNaN(s.resultant));
            this.assert("testNoNaN", hasNaN, false);
        } else {
             this.assert("testNoNaN", false, true);
        }
    },
    testNoInfinity: function() {
        const geom = window.WindEngine ? window.WindEngine.analyzeGeometry(72, 25, 8, 9.25, 'gable', 5.71) : null;
        if (geom) {
            const branch = window.WindEngine.calculateDirectionBranch('+X', geom, 'B', { L: 72, B: 25, H_column: 8, H_roof: 9.25, windZone: 'II', terrainCategory: 'B', T1: 0.5 });
            const hasInf = branch.surfaces.some(s => !isFinite(s.pressure) || !isFinite(s.area) || !isFinite(s.resultant) || !isFinite(s.frameLineLoad));
            this.assert("testNoInfinity", hasInf, false);
        } else {
            this.assert("testNoInfinity", false, true);
        }
    },
    testSourceTraceability: function() {
        const res = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(10, 'B');
        this.assert("testSourceTraceability", res.source !== undefined, true);
    }
};

window.RegressionTests = RegressionTests;
