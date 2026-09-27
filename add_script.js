const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/index.html', 'utf8');

c = c.replace(
    /<script type="text\/babel" src="js\/components\/CalculationBlock\.jsx\?v=\d+"><\/script>/,
    `$&
    <script type="text/babel" src="js/components/ReportViewer.jsx?v=${Date.now()}"></script>`
);
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/index.html', c, 'utf8');