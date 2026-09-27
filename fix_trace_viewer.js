const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

c = c.replace(
    /<CalculationTraceViewer steps=\{projectState\.slabResult\.steps\} title="([^"]+)" \/>/g,
    `<div>
        <h3 className="font-bold text-lg mb-4 text-primary border-b pb-2">$1</h3>
        <div className="space-y-4">
            {projectState.slabResult.steps.map(step => <CalculationBlock key={step.stepId} step={step} />)}
        </div>
    </div>`
);

c = c.replace(
    /<CalculationTraceViewer steps=\{projectState\.beamResult\.steps\} title="([^"]+)" \/>/g,
    `<div>
        <h3 className="font-bold text-lg mb-4 text-primary border-b pb-2">$1</h3>
        <div className="space-y-4">
            {projectState.beamResult.steps.map(step => <CalculationBlock key={step.stepId} step={step} />)}
        </div>
    </div>`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');