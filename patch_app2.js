const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

c = c.replace(/const mat = null \/\* fallback to 23\.5 \*\/\(projectState\.inputs\.steelGrade\);/g, 'const mat = { f: 215, fv: 125, E: 2.1e5 };');
c = c.replace(/if \(\!mat\) return alert\("KhA'ng tAm thy thuTc tA-nh mAc thAcp\."\);/g, '');

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');