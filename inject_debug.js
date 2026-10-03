// test_run.js
const fs = require('fs');

// We need to simulate the project state and run engine_adapter.js
// Since engine_adapter relies on window.WorkspaceModel and window.SlabBeamEngine, etc.
// it's easier to just find what fails by printing designResults.

// Let's modify engine_adapter.js temporarily to console.log any failing member!
let ea = fs.readFileSync('js/core/adapters/engine_adapter.js', 'utf8');

if (!ea.includes('if (dr.designStatus === "FAIL") console.log("FAILED MEMBER:", member.id, dr.governingCheck);')) {
    ea = ea.replace(
        'results[member.id] = dr;',
        'if (dr.designStatus === "FAIL") console.log("FAILED MEMBER:", member.id, dr.governingCheck);\n            results[member.id] = dr;'
    );
    fs.writeFileSync('js/core/adapters/engine_adapter.js', ea, 'utf8');
}
