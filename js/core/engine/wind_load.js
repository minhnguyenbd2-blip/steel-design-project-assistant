// Wind Load Calculation Engine (TCVN 2737:2023)

const WindEngine = {
    analyzeGeometry: function(L, B, Hcolumn, Hroof, roofType, roofSlopeAngle) {
        // e = min(b, 2h)
        const h = Hroof;
        const b = B;
        const d = L;
        const e_X = Math.min(b, 2*h);
        const e_Y = Math.min(d, 2*h);
        
        return {
            h, b, d, e_X, e_Y, roofRise: Hroof - Hcolumn, roofSlopeAngle, H_col: Hcolumn
        };
    },
    
    calculateDirectionBranch: function(direction, geom, terrain, inputs) {
        let b = geom.b;
        let d = geom.d;
        let e = geom.e_X;
        if (direction === '+Y' || direction === '-Y') {
            b = geom.d;
            d = geom.b;
            e = geom.e_Y;
        }

        const W0_res = StandardData.TCVN2737_2023.Wind.BasicWind.getW0(inputs.windZone);
        const W0 = W0_res.value || 0.83; 
        
        const gf_res = StandardData.TCVN2737_2023.Wind.GustFactor.getGf(inputs.T1 || 1.0);
        const Gf = gf_res.value || 0.85;
        
        const H_col = inputs.H_column;
        const h = geom.h;

        const wallZones = [];
        // Zoning according to F.4.1 (TCVN 2737:2023)
        // D is windward, E is leeward. A, B, C are side walls.
        // Windward Wall D
        wallZones.push({ surface: 'Wall', zone: 'D', width: b, height: H_col });
        // Leeward Wall E
        wallZones.push({ surface: 'Wall', zone: 'E', width: b, height: H_col });

        // Side Walls A, B, C
        if (d <= e) {
            wallZones.push({ surface: 'Wall', zone: 'A', width: e/5, height: H_col });
            wallZones.push({ surface: 'Wall', zone: 'B', width: Math.max(0, d - e/5), height: H_col });
        } else {
            wallZones.push({ surface: 'Wall', zone: 'A', width: e/5, height: H_col });
            wallZones.push({ surface: 'Wall', zone: 'B', width: 4*e/5, height: H_col });
            wallZones.push({ surface: 'Wall', zone: 'C', width: Math.max(0, d - e), height: H_col });
        }

        const processedWallZones = wallZones.filter(z => z.width > 0).map(z => {
            // Equivalent height ze logic
            const eqHeightRes = StandardData.TCVN2737_2023.Wind.EquivalentHeight.calculateEquivalentHeight(z.height, h, b, direction);
            const kzRes = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(eqHeightRes.ze, terrain);
            const ceRes = StandardData.TCVN2737_2023.Wind.Wall.getZoneCpe(z.zone);
            
            const area = z.width * z.height;
            const tributaryWidth = inputs.B || 1.0;
            let p = 0;
            if (ceRes.value !== null) {
                 p = W0 * (kzRes.value || 1.0) * Gf * ceRes.value;
            }
            return {
                ...z, ze: eqHeightRes.ze, kz: kzRes.value, ce: ceRes.value, pressure: p, area: area, resultant: p * area,
                tributaryWidth: tributaryWidth,
                frameLineLoad: p * tributaryWidth,
                W0: W0, Gf: Gf, ci: 0
            };
        });

        const roofZones = [];
        // Roof Zoning according to F.4.2 for gable roof
        // zones F, G, H, I, J
        // e is same as above. Widths are along the wind direction.
        if (direction === '+X' || direction === '-X') { // Wind perpendicular to ridge (theta = 0)
            const e4 = e/4;
            const e10 = e/10;
            roofZones.push({ surface: 'Roof', zone: 'F', width: e4, length: e10, area: e4 * e10 });
            roofZones.push({ surface: 'Roof', zone: 'G', width: b - 2*e4, length: e10, area: (b - 2*e4) * e10 });
            roofZones.push({ surface: 'Roof', zone: 'H', width: b, length: Math.max(0, d/2 - e10), area: b * Math.max(0, d/2 - e10) });
            roofZones.push({ surface: 'Roof', zone: 'I', width: b, length: e10, area: b * e10 }); // leeward
            roofZones.push({ surface: 'Roof', zone: 'J', width: b, length: Math.max(0, d/2 - e10), area: b * Math.max(0, d/2 - e10) }); // leeward
        } else { // Wind parallel to ridge (theta = 90)
            // Simpler F, G, H, I
            const e2 = e/2;
            const e4 = e/4;
            const e10 = e/10;
            roofZones.push({ surface: 'Roof', zone: 'F', width: e10, length: e4, area: e10 * e4 * 2 }); // both edges
            roofZones.push({ surface: 'Roof', zone: 'G', width: e10, length: d - 2*e4, area: e10 * (d - 2*e4) * 2 });
            roofZones.push({ surface: 'Roof', zone: 'H', width: Math.max(0, e2 - e10), length: d, area: Math.max(0, e2 - e10) * d * 2 });
            roofZones.push({ surface: 'Roof', zone: 'I', width: Math.max(0, b/2 - e2), length: d, area: Math.max(0, b/2 - e2) * d * 2 });
        }

        const theta = (direction === '+X' || direction === '-X') ? 0 : 90;

        const processedRoofZones = roofZones.filter(z => z.area > 0).map(z => {
            const eqHeightRes = StandardData.TCVN2737_2023.Wind.EquivalentHeight.calculateEquivalentHeight(geom.h, h, b, direction);
            const kzRes = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(eqHeightRes.ze, terrain);
            const ceRes = StandardData.TCVN2737_2023.Wind.Roof.getZoneCpe(z.zone, theta, geom.roofSlopeAngle);
            
            const tributaryWidth = inputs.B || 1.0;
            let p = 0;
            if (ceRes.value !== null) {
                 p = W0 * (kzRes.value || 1.0) * Gf * ceRes.value;
            }
            return {
                ...z, ze: eqHeightRes.ze, kz: kzRes.value, ce: ceRes.value, pressure: p, resultant: p * z.area,
                tributaryWidth: tributaryWidth,
                frameLineLoad: p * tributaryWidth,
                W0: W0, Gf: Gf, ci: 0
            };
        });
        
        return {
            id: 'WIND_' + direction.replace('+', 'POS_').replace('-', 'NEG_'),
            direction,
            surfaces: [...processedWallZones, ...processedRoofZones],
            Fx: 0, Fy: 0, Mz: 0
        };
    }
};

function calculateWindLoad(inputs) {
    const steps = [];
    let isSuccess = true;
    
    const geom = WindEngine.analyzeGeometry(inputs.L, inputs.B, inputs.H_column, inputs.H_roof, "gable", inputs.roofSlope || 5.71);
    
    const directions = ['+X', '-X', '+Y', '-Y'];
    const loadCases = {};
    const terrainByDir = {
        '+X': inputs.terrainCategory,
        '-X': inputs.terrainCategory,
        '+Y': inputs.terrainCategory,
        '-Y': inputs.terrainCategory
    };
    
    let stepCount = 1;
    directions.forEach(dir => {
        const caseResult = WindEngine.calculateDirectionBranch(dir, geom, terrainByDir[dir], inputs);
        loadCases[dir] = caseResult;
        
        caseResult.surfaces.forEach(zone => {
            const stepId = `CALC-WIND-${String(stepCount).padStart(3, '0')}`;
            const title = `Gió ${dir}, Bề mặt: ${zone.surface}, Vùng: ${zone.zone}`;
            const formula = `p = W_0 \\cdot k(z_e) \\cdot c_e \\cdot G_f`;
            const subst = `p = ${zone.W0.toFixed(2)} \\cdot ${zone.kz?.toFixed(2) || 1.0} \\cdot ${zone.ce?.toFixed(2) || 0} \\cdot ${zone.Gf.toFixed(2)}`;
            const notes = `ze = ${zone.ze?.toFixed(2)} m, kz = ${zone.kz?.toFixed(2)}, ce = ${zone.ce?.toFixed(2)}\nTributary width = ${zone.tributaryWidth?.toFixed(2)} m\nFrame load = ${(zone.frameLineLoad || 0).toFixed(2)} kN/m`;
            
            steps.push(createCalculationStep(
                stepId,
                title,
                { standard: 'TCVN 2737:2023' },
                formula,
                subst,
                Number((zone.pressure || 0).toFixed(2)),
                "kN/m2",
                { isPass: true },
                notes
            ));
            stepCount++;
        });
    });
    
    return { steps, success: isSuccess, loadCases };
}

window.calculateWindLoad = calculateWindLoad;
window.WindEngine = WindEngine;
