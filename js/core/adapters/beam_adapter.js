// js/core/adapters/beam_adapter.js

window.BeamAdapter = {
    // Defines the Canonical DesignResult format
    createDesignResult: function(memberId) {
        return {
            memberId: memberId,
            analysisStatus: 'NOT_ANALYZED', // NOT_ANALYZED, ANALYZED
            designStatus: 'UNKNOWN', // PASS, FAIL, WARNING, UNKNOWN
            governingCheck: null,
            utilization: null, // max utilization ratio
            checks: [],
            internalForces: { N: null, V: null, M: null, T: null },
            resistance: { N_Rd: null, V_Rd: null, M_Rd: null },
            deflection: { value: null, limit: null, utilization: null },
            stability: { status: 'UNKNOWN', utilization: null, governingMode: null },
            assumptions: [],
            codeReference: [],
            calculationTrace: null
        };
    },

    // Runs the legacy engine and maps it to the Canonical Model
    runDesign: function(member, workspaceState) {
        const res = this.createDesignResult(member.id);
        
        // Ensure we have access to the legacy engine
        if (!window.SlabBeamEngine || !window.SlabBeamEngine.calculateBeam) {
            res.analysisStatus = 'NOT_ANALYZED';
            return res;
        }

        try {
            // STEP 1: Extract data needed for the engine
            // For now, since the legacy engine needs slab loads which are calculated sequentially in the legacy app,
            // we will extract those from workspaceState.legacyInputs or legacy results.
            
            // To be totally safe and not rewrite math, we rely on the slab load if it exists in legacy results,
            // or we calculate it right here if missing.
            
            // In a pure data-driven model, we would sum the 'loads' attached to this member.
            // For Phase 3, we bridge the gap.
            const legacyInputs = workspaceState.legacyInputs || {};
            const legacyResults = window.ProjectState?.results || {}; // Fallback 
            
            // Reconstruct Slab Result to get the loads to feed the Beam
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
                steelGrade: member.materialId ? workspaceState.materials.find(m => m.id === member.materialId)?.name : (legacyInputs.steelGrade || 'S235'),
                chosenBeamId: member.sectionId || legacyInputs.beamParams?.chosenBeamId || 'I300'
            };

            // STEP 2: Run Engine
            const engineOutput = window.SlabBeamEngine.calculateBeam(params);
            const er = engineOutput.results;

            // STEP 3: Map Engine Output to Canonical DesignResult
            res.analysisStatus = 'ANALYZED';
            res.designStatus = er.isAllPass ? 'PASS' : 'FAIL';
            
            res.internalForces.M = er.Mmax;
            res.internalForces.V = er.Vmax;
            
            res.resistance.M_Rd = er.sigma_allow; // The legacy engine returns stress limits instead of moment capacity
            res.resistance.V_Rd = er.tau_allow;
            
            // Calculate utilizations (legacy engine uses stress sigma/sigma_allow)
            const momentUtil = er.sigma / er.sigma_allow;
            const shearUtil = er.tau / er.tau_allow;
            
            let deflUtil = 0;
            if (er.defl_limit) {
                const limitParts = er.defl_limit.split('/');
                if (limitParts.length === 2) {
                    const limitRatio = 1 / parseFloat(limitParts[1]);
                    const actualRatio = 1 / parseFloat(er.defl_ratio.split('/')[1]);
                    deflUtil = actualRatio / limitRatio;
                }
            }

            // Find maximum utilization and governing check
            let maxU = momentUtil;
            let gov = 'Kiểm tra uốn (Bending Check)';
            
            if (shearUtil > maxU) { maxU = shearUtil; gov = 'Kiểm tra cắt (Shear Check)'; }
            if (deflUtil > maxU) { maxU = deflUtil; gov = 'Độ võng (Deflection)'; }
            
            res.utilization = maxU;
            res.governingCheck = gov;

            // Push individual checks
            res.checks.push({
                type: 'BENDING',
                name: 'Kiểm tra uốn (Bending Check)',
                utilization: momentUtil,
                status: er.isStrengthPass ? 'PASS' : 'FAIL'
            });
            res.checks.push({
                type: 'SHEAR',
                name: 'Kiểm tra cắt (Shear Check)',
                utilization: shearUtil,
                status: er.isShearPass ? 'PASS' : 'FAIL'
            });
            res.checks.push({
                type: 'DEFLECTION',
                name: 'Kiểm tra độ võng (Deflection Check)',
                utilization: deflUtil,
                status: er.isDeflectionPass ? 'PASS' : 'FAIL'
            });
            
            res.deflection = {
                value: er.defl_cm,
                limit: er.defl_limit,
                utilization: deflUtil
            };
            
            res.stability = {
                status: er.isStabilityPass ? 'PASS' : 'FAIL',
                utilization: null, // Legacy engine just says "braced by slab"
                governingMode: 'Ổn định xoắn-uốn (LTB)'
            };

            res.codeReference = ['TCVN 5575:2024'];
            res.calculationTrace = engineOutput.trace;

            return res;
            
        } catch(e) {
            console.error("BeamAdapter failed:", e);
            res.analysisStatus = 'NOT_ANALYZED';
            return res;
        }
    }
};