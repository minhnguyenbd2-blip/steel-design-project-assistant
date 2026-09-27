const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', 'utf8');

c = c.replace(
    /createQuad\(C0, R0, R1, C3, 'roof', null\); \r?\n\s*createQuad\(R0, C1, C2, R1, 'roof', null\);/g,
    `createQuad(C0, C3, R1, R0, 'roof', null); // Left slope (counter-clockwise -> Normal UP)
            createQuad(R0, R1, C2, C1, 'roof', null); // Right slope (counter-clockwise -> Normal UP)`
);

// Increase opacity to make it more visible!
c = c.replace(
    /\} else if \(isGeometry\) \{ mat\.opacity = 0\.15; mat\.color\.setHex\(type === 'wall' \? \(isDark \? 0x38bdf8 : 0x0ea5e9\) : \(isDark \? 0x818cf8 : 0x6366f1\)\); \}/g,
    `} else if (isGeometry) { 
                mat.opacity = type === 'wall' ? 0.2 : 0.35; 
                mat.color.setHex(type === 'wall' ? (isDark ? 0x38bdf8 : 0x0ea5e9) : (isDark ? 0x818cf8 : 0x4f46e5)); // Indigo-600 for roof
            }`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', c, 'utf8');