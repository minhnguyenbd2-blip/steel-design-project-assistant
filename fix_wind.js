const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', 'utf8');

// Replace initialization
c = c.replace(
    /ax = arrowDir\.x \* -\(L\/2 \+ 25\);/g,
    'ax = arrowDir.x * -(L/2 + 30);'
);
c = c.replace(
    /az = arrowDir\.z \* -\(B_total\/2 \+ 25\);/g,
    'az = arrowDir.z * -(B_total/2 + 30);'
);
c = c.replace(
    /offset: Math\.random\(\) \* 40/g,
    'offset: Math.random() * 18'
);

// Replace render loop
c = c.replace(
    /const time = Date\.now\(\) \* 0\.02;/g,
    'const time = Date.now() * 0.015;'
);
c = c.replace(
    /const travelDist = 30;/g,
    'const travelDist = 18;'
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', c, 'utf8');