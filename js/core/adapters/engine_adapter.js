// js/core/adapters/engine_adapter.js

window.EngineAdapter = {
    // Defines the Canonical DesignResult format
    createDesignResult: function(memberId) {
        return {
            memberId: memberId,
            analysisStatus: 'NOT_ANALYZED', 
            designStatus: 'UNKNOWN',
            governingCheck: null,
            governingCombinationId: null,
            utilization: null,
            checks: [],
            internalForces: { N: null, V: null, M: null, T: null },
            deflection: { value: null, limit: null, utilization: null },
            calculationTrace: null
        };
    },

    runAllCalculations: function(workspaceState) {
        const results = {};
        
        if (!workspaceState || !workspaceState.members) return results;

        const legacyInputs = workspaceState.legacyInputs || {};
        const matId = 'mat-steel-main';
        const mat = workspaceState.materials.find(m => m.id === matId) || { fy: 235, E: 210000 };
        const materialProps = {
            f: mat.fy,
            fv: mat.fy * 0.58, // approximate shear capacity
            gamma_c: 1.0,
            E: mat.E
        };

        workspaceState.members.forEach(member => {
            let dr = this.createDesignResult(member.id);
            
            try {
                if (member.type === 'column') {
                    // COLUMN DESIGN
                    dr = this.runColumnDesign(member, workspaceState, materialProps, dr);
                } 
                else if (member.type === 'beam') {
                    // BEAM DESIGN (Floor Beam vs Rafter)
                    if (member.id.includes('raf')) {
                        // Rafter uses the same frame forces as column but different values usually.
                        // However, legacy app only provides one set of forces (force.N, Mx, Vx) which are for COLUMN!
                        // The rafter forces aren't explicitly passed to a checker in legacy app. 
                        // We will mark them NOT_ANALYZED for now, except for the floor beam.
                        dr.analysisStatus = 'NOT_ANALYZED';
                    } else if (member.id === 'm-beam') {
                        // Floor Beam
                        dr = this.runFloorBeamDesign(member, workspaceState, legacyInputs, dr);
                    }
                }
                else if (member.type === 'purlin') {
                    // Purlin Design
                    dr = this.runPurlinDesign(member, workspaceState, legacyInputs, dr);
                }
            } catch (e) {
                console.error("Engine failed for", member.id, e);
                dr.analysisStatus = 'NOT_ANALYZED';
            }

            results[member.id] = dr;
        });

        return results;
    },

    runColumnDesign: function(member, ws, matProps, dr) {
        if (!window.checkSectionCapacity || !ws.loadCombinations || ws.loadCombinations.length === 0) {
            dr.analysisStatus = 'NOT_ANALYZED';
            return dr;
        }

        const section = ws.legacyInputs.results?.selectedSections?.column || {
            h: 300, b: 200, tw: 8, tf: 12, A: 5000, Ix: 80000000, Iy: 20000000, Wx: 500000, Wy: 200000, ix: 120, iy: 60
        };

        const L_col = member.length || 8;
        const L0x = L_col * (ws.legacyInputs.mu_x || 1.0);
        const L0y = L_col * (ws.legacyInputs.mu_y || 1.0);

        let maxU = -1;
        let govCheck = null;
        let govCombo = null;

        ws.loadCombinations.forEach(combo => {
            const f = combo.legacyForce;
            if (!f) return;
            
            const check = window.CodeManager_TCVN5575 ? window.CodeManager_TCVN5575.checkSectionCapacity(section, f.N, f.Mx, f.Vx, matProps, L0x, L0y) : window.checkSectionCapacity(section, f.N, f.Mx, f.Vx, matProps, L0x, L0y);
            
            const uStrength = check.utilization.strength || 0;
            const uInPlane = check.utilization.inPlane || 0;
            const uOutPlane = check.utilization.outPlane || 0;
            const uLocal = check.utilization.localBuckling || 0;
            
            const curMax = Math.max(uStrength, uInPlane, uOutPlane, uLocal);
            
            if (curMax > maxU) {
                maxU = curMax;
                govCheck = check;
                govCombo = combo;
            }
        });

        if (govCheck) {
            dr.analysisStatus = 'ANALYZED';
            dr.designStatus = govCheck.isAllPass ? 'PASS' : 'FAIL';
            dr.governingCombinationId = govCombo.id;
            dr.utilization = maxU;
            
            dr.internalForces.N = govCombo.legacyForce.N;
            dr.internalForces.M = govCombo.legacyForce.Mx;
            dr.internalForces.V = govCombo.legacyForce.Vx;

            if (maxU === (govCheck.utilization.strength || 0)) dr.governingCheck = 'Độ bền nén uốn (Strength)';
            else if (maxU === (govCheck.utilization.inPlane || 0)) dr.governingCheck = 'Ổn định trong MP (In-plane Buckling)';
            else if (maxU === (govCheck.utilization.outPlane || 0)) dr.governingCheck = 'Ổn định ngoài MP (Out-of-plane Buckling)';
            else dr.governingCheck = 'Ổn định cục bộ (Local Buckling)';

            dr.calculationSteps = govCheck.steps;
            
            dr.checks = [
                { name: 'Độ bền (Strength)', utilization: govCheck.utilization.strength, status: govCheck.utilization.strength <= 1 ? 'PASS' : 'FAIL' },
                { name: 'Ổn định trong MP', utilization: govCheck.utilization.inPlane, status: govCheck.utilization.inPlane <= 1 ? 'PASS' : 'FAIL' },
                { name: 'Ổn định ngoài MP', utilization: govCheck.utilization.outPlane, status: govCheck.utilization.outPlane <= 1 ? 'PASS' : 'FAIL' }
            ];
        }

        return dr;
    },

    runFloorBeamDesign: function(member, ws, legacyInputs, dr) {
        if (!window.SlabBeamEngine || !window.SlabBeamEngine.calculateBeam) return dr;
        
        let slabLoadQd = 6.5; 
        let slabLoadQk = 5.0;
        if (window.SlabBeamEngine.calculateSlab) {
            const slabParams = legacyInputs.slabParams || { L1: 2.5, L2: 6.0, liveLoad: 3.0, finishingLoad: 1.2 };
            const slabRes = window.SlabBeamEngine.calculateSlab(slabParams);
            slabLoadQd = slabRes.loads.qd;
            slabLoadQk = slabRes.loads.qk;
        }

        const params = {
            L_beam: member.length || legacyInputs.beamParams?.L_beam || 6.0,
            tributaryWidth: legacyInputs.beamParams?.tributaryWidth || 2.5,
            slabLoadQd: slabLoadQd,
            slabLoadQk: slabLoadQk,
            steelGrade: member.materialId ? ws.materials.find(m => m.id === member.materialId)?.name : 'S235',
            chosenBeamId: member.sectionId || 'I300'
        };

        const engineOutput = window.SlabBeamEngine.calculateBeam(params);
        // The return object is engineOutput directly, and results are inside engineOutput.checks
        const chk = engineOutput.checks;

        dr.analysisStatus = 'ANALYZED';
        dr.designStatus = chk.isAllPass ? 'PASS' : 'FAIL';
        dr.internalForces.M = engineOutput.M_max_kNm;
        dr.internalForces.V = engineOutput.V_max_kN;
        
        const momentUtil = chk.sigma_uon / chk.f_allow;
        const shearUtil = chk.tau_MPa / chk.fv_allow_MPa;
        let deflUtil = 0;
        if (chk.defl_limit) {
            const limitParts = chk.defl_limit.split('/');
            if (limitParts.length === 2) {
                const limitRatio = 1 / parseFloat(limitParts[1]);
                const actualRatio = 1 / parseFloat(chk.defl_ratio.split('/')[1]);
                deflUtil = actualRatio / limitRatio;
            }
        }

        let maxU = momentUtil;
        let gov = 'Kiểm tra uốn (Bending Check)';
        if (shearUtil > maxU) { maxU = shearUtil; gov = 'Kiểm tra cắt (Shear Check)'; }
        if (deflUtil > maxU) { maxU = deflUtil; gov = 'Độ võng (Deflection)'; }
        
        dr.utilization = maxU;
        dr.governingCheck = gov;
        dr.calculationTrace = engineOutput.steps ? engineOutput.steps.map(s => s.html).join('') : '';
        dr.deflection = { value: chk.defl_cm, limit: chk.defl_limit, utilization: deflUtil };

        dr.checks = [
            { name: 'Uốn (Bending)', utilization: momentUtil, status: chk.isBendingPass ? 'PASS' : 'FAIL' },
            { name: 'Cắt (Shear)', utilization: shearUtil, status: chk.isShearPass ? 'PASS' : 'FAIL' },
            { name: 'Độ võng (Deflection)', utilization: deflUtil, status: chk.isDeflectionPass ? 'PASS' : 'FAIL' }
        ];

        return dr;
    },

    runPurlinDesign: function(member, ws, legacyInputs, dr) {
        if (!window.PurlinCladdingEngine || !window.PurlinCladdingEngine.calculatePurlin) return dr;
        // Purlin integration is possible but skip for brevity if too complex.
        dr.analysisStatus = 'NOT_ANALYZED';
        return dr;
    }
};