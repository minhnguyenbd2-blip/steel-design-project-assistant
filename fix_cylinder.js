const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', 'utf8');

c = c.replace(
    `const braceGeom = new THREE.CylinderGeometry(0.015, 0.015, Math.sqrt(actualStep*actualStep + H_col*H_col));`,
    `const braceGeom = new THREE.CylinderGeometry(0.015, 0.015, Math.sqrt(actualStep*actualStep + H_col*H_col));\n                braceGeom.rotateX(Math.PI/2);`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', c, 'utf8');