const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/workspace_model.js', 'utf8');

c = c.replace(
    /\/\/ Run initial validation/,
    `// 5. RUN DESIGN CALCULATIONS (Phase 3 Integration)
        if (window.BeamAdapter) {
            p.members.forEach(m => {
                // In Phase 3, we only run the Beam adapter on the conceptual floor beam or actual rafters if needed.
                // Actually, the rafter logic is different (requires Frame analysis M, V, N).
                // We will run the Beam adapter on 'm-beam' (the explicit Floor Beam) and maybe rafters if they act as simple beams.
                if (m.type === 'beam' && m.id === 'm-beam') {
                    const dr = window.BeamAdapter.runDesign(m, p);
                    p.designResults[m.id] = dr;
                }
            });
        }
        
        // Run initial validation`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/workspace_model.js', c, 'utf8');