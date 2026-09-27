const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', 'utf8');

// Fix styling issue where arbitrary tailwind class h-[600px] might not work
c = c.replace(
    /className="flex h-\[600px\] border border-slate-200/,
    `className="flex border border-slate-200" style={{ height: 'calc(100vh - 10rem)', minHeight: '600px' }}`
);

// Fix camera position to better frame the building
c = c.replace(
    /camera\.position\.set\(40, 30, 50\);/,
    `camera.position.set(50, 40, 50);`
);
c = c.replace(
    /controls\.target\.set\(12\.5, 5, 0\);/,
    `controls.target.set(12.5, 5, -30);`
);

// Also handle resize correctly
c = c.replace(
    /const animate = function \(\) \{/,
    `
        const onWindowResize = () => {
            if (!mountRef.current || !renderer) return;
            const w = mountRef.current.clientWidth;
            const h = mountRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onWindowResize);

        const animate = function () {`
);

c = c.replace(
    /renderer\.dispose\(\);/,
    `renderer.dispose();
            window.removeEventListener('resize', onWindowResize);`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', c, 'utf8');