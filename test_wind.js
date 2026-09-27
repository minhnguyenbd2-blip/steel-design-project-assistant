const fs = require('fs');

global.window = global;
global.StandardData = {};
global.createCalculationStep = function() { return {}; };
const f1 = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/standards/tcvn2737_2023.js', 'utf8');
eval(f1);
const f2 = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/standards/standard_data.js', 'utf8');
eval(f2);
const f3 = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/engine/wind_load.js', 'utf8');
eval(f3);

const testInputs = {
    length: 72,
    L: 25,
    B: 9,
    H_column: 8,
    H_roof: 9.25,
    windZone: 'II',
    terrainCategory: 'B',
    porosityPercent: 0,
    internalPressureSign: 'auto'
};

const result = global.calculateWindLoad(testInputs);
console.log(JSON.stringify({
    W3s10: result.loadCases['+X'].W3s_10,
    X_surfaces: result.loadCases['+X'].surfaces.map(s => ({ zone: s.zone, ce: s.ce, ci: s.ci, c_net: s.c_net, qd: s.frameLineLoad_d })),
    Y_surfaces: result.loadCases['+Y'].surfaces.map(s => ({ zone: s.zone, ce: s.ce, ci: s.ci, c_net: s.c_net, qd: s.frameLineLoad_d }))
}, null, 2));