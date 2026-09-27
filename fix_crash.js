const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', 'utf8');
c = c.replace(
    /const wireMat = new THREE\.LineBasicMaterial\(\{ color: isDark \? 0x38bdf8 : 0x0284c7, linewidth: 1, transparent: true, opacity: 0\.5 \}\);/g,
    'const wireMat = new THREE.LineBasicMaterial({ color: isDark ? 0x38bdf8 : 0x0284c7, linewidth: 1, transparent: true, opacity: 0.5 });\n        const interactableMeshes = [];'
);
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', c, 'utf8');