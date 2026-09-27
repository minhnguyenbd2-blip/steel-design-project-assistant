const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/adapters/engine_adapter.js', 'utf8');

c = c.replace(
    /const engineOutput = window\.SlabBeamEngine\.calculateBeam\(params\);\s*const er = engineOutput\.results;\s*dr\.analysisStatus = 'ANALYZED';\s*dr\.designStatus = er\.isAllPass \? 'PASS' : 'FAIL';\s*dr\.internalForces\.M = er\.Mmax;\s*dr\.internalForces\.V = er\.Vmax;\s*const momentUtil = er\.sigma \/ er\.sigma_allow;\s*const shearUtil = er\.tau \/ er\.tau_allow;\s*let deflUtil = 0;\s*if \(er\.defl_limit\) \{/m,
    `const engineOutput = window.SlabBeamEngine.calculateBeam(params);
        // The return object is engineOutput directly, and results are inside engineOutput.checks
        const chk = engineOutput.checks;

        dr.analysisStatus = 'ANALYZED';
        dr.designStatus = chk.isAllPass ? 'PASS' : 'FAIL';
        dr.internalForces.M = engineOutput.M_max_kNm;
        dr.internalForces.V = engineOutput.V_max_kN;
        
        const momentUtil = chk.sigma_uon / chk.f_allow;
        const shearUtil = chk.tau_MPa / chk.fv_allow_MPa;
        let deflUtil = 0;
        if (chk.defl_limit) {`
);

c = c.replace(
    /const limitParts = er\.defl_limit\.split\('\/'\);\s*if \(limitParts\.length === 2\) \{\s*const limitRatio = 1 \/ parseFloat\(limitParts\[1\]\);\s*const actualRatio = 1 \/ parseFloat\(er\.defl_ratio\.split\('\/'\)\[1\]\);\s*deflUtil = actualRatio \/ limitRatio;\s*\}\s*\}/,
    `const limitParts = chk.defl_limit.split('/');
            if (limitParts.length === 2) {
                const limitRatio = 1 / parseFloat(limitParts[1]);
                const actualRatio = 1 / parseFloat(chk.defl_ratio.split('/')[1]);
                deflUtil = actualRatio / limitRatio;
            }
        }`
);

c = c.replace(
    /dr\.calculationTrace = engineOutput\.trace;\s*dr\.deflection = \{ value: er\.defl_cm, limit: er\.defl_limit, utilization: deflUtil \};\s*dr\.checks = \[\s*\{ name: 'Uốn \(Bending\)', utilization: momentUtil, status: er\.isStrengthPass \? 'PASS' : 'FAIL' \},\s*\{ name: 'Cắt \(Shear\)', utilization: shearUtil, status: er\.isShearPass \? 'PASS' : 'FAIL' \},\s*\{ name: 'Độ võng \(Deflection\)', utilization: deflUtil, status: er\.isDeflectionPass \? 'PASS' : 'FAIL' \}\s*\];/,
    `dr.calculationTrace = engineOutput.steps ? engineOutput.steps.map(s => s.html).join('') : '';
        dr.deflection = { value: chk.defl_cm, limit: chk.defl_limit, utilization: deflUtil };

        dr.checks = [
            { name: 'Uốn (Bending)', utilization: momentUtil, status: chk.isBendingPass ? 'PASS' : 'FAIL' },
            { name: 'Cắt (Shear)', utilization: shearUtil, status: chk.isShearPass ? 'PASS' : 'FAIL' },
            { name: 'Độ võng (Deflection)', utilization: deflUtil, status: chk.isDeflectionPass ? 'PASS' : 'FAIL' }
        ];`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/adapters/engine_adapter.js', c, 'utf8');