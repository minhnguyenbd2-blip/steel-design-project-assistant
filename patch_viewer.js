const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', 'utf8');

// 1. Restore purlins and cleats visibility
c = c.replace(
    /if \(member\.type === 'purlin' && !showCladding\) \{\s*\/\/[^\n]*\n\s*mesh\.visible = false;\s*\}/g,
    ""
);

c = c.replace(
    /cleat\.rotation\.z = -sign \* rafterAngle;\n\s*if \(!showCladding\) cleat\.visible = false;\n\s*skeletonGroup\.add\(cleat\);/g,
    "cleat.rotation.z = -sign * rafterAngle;\n                    skeletonGroup.add(cleat);"
);

// 2. Fix Geometry Mode Materials (Make them translucent instead of wireframe)
// Find the wallMat and roofMat definitions
// Currently: const wallMat = new THREE.MeshPhysicalMaterial({ color: isDark ? 0x1e293b : 0xe2e8f0, transparent: true, opacity: isGeometry ? 0.2 : 0.8, side: THREE.DoubleSide, wireframe: isGeometry });
c = c.replace(
    /const wallMat = new THREE\.MeshPhysicalMaterial\(\{.*?\}\);/g,
    "const wallMat = new THREE.MeshPhysicalMaterial({ color: isDark ? 0x334155 : 0x94a3b8, transparent: true, opacity: isGeometry ? 0.15 : 0.8, side: THREE.DoubleSide, roughness: 0.2, metalness: 0.1 });"
);
c = c.replace(
    /const roofMat = new THREE\.MeshPhysicalMaterial\(\{.*?\}\);/g,
    "const roofMat = new THREE.MeshPhysicalMaterial({ color: isDark ? 0x475569 : 0xcbd5e1, transparent: true, opacity: isGeometry ? 0.25 : 0.85, side: THREE.DoubleSide, roughness: 0.3, metalness: 0.1 });"
);

// 3. Fix the "isGeometry" condition in createQuad so it doesn't override opacity with 0.05
c = c.replace(
    /\} else if \(isGeometry\) mat\.opacity = 0\.05;/g,
    "} else if (isGeometry) { mat.opacity = 0.15; mat.color.setHex(type === 'wall' ? (isDark ? 0x38bdf8 : 0x0ea5e9) : (isDark ? 0x818cf8 : 0x6366f1)); }"
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', c, 'utf8');