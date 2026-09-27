const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', 'utf8');

c = c.replace(
    'const xMin = -L/2, xMax = L/2;',
    `// Offset cladding to wrap outside the columns (cDepth = 0.6)\n        const cladExtX = cDepth/2 + 0.05;\n        const xMin = -L/2 - cladExtX, xMax = L/2 + cladExtX;`
);

c = c.replace(
    'const zMin = -B_total/2, zMax = B_total/2;',
    `const cladExtZ = 0.2;\n        const zMin = -B_total/2 - cladExtZ, zMax = B_total/2 + cladExtZ;`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', c, 'utf8');