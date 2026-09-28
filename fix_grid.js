const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', 'utf8');

c = c.replace(
    /\s*\/\/ Helper Grid\s*const gridHelper = new THREE\.GridHelper\(100, 100, 0x000000, 0xe2e8f0\);\s*gridHelper\.position\.y = -0\.01;\s*scene\.add\(gridHelper\);/,
    ``
);

// We need to inject the dynamic grid computation after `nodeMap` is populated.
// The original code is:
/*
        const nodeMap = {};
        if (workspaceState && workspaceState.nodes) {
            workspaceState.nodes.forEach(n => {
                nodeMap[n.id] = new THREE.Vector3(n.x, n.z, -n.y); // Y is up in ThreeJS, Z is up in structural model
                
                // Draw node point
                const sphere = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15, 16, 16),
                    new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
                );
                sphere.position.copy(nodeMap[n.id]);
                scene.add(sphere);
            });
        }
*/

const searchStr = `        const nodeMap = {};
        if (workspaceState && workspaceState.nodes) {
            workspaceState.nodes.forEach(n => {
                nodeMap[n.id] = new THREE.Vector3(n.x, n.z, -n.y); // Y is up in ThreeJS, Z is up in structural model
                
                // Draw node point
                const sphere = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15, 16, 16),
                    new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
                );
                sphere.position.copy(nodeMap[n.id]);
                scene.add(sphere);
            });
        }`;

const replaceStr = `        let minX = 0, maxX = 0, minZ = 0, maxZ = 0;
        let hasNodes = false;
        
        const nodeMap = {};
        if (workspaceState && workspaceState.nodes) {
            workspaceState.nodes.forEach(n => {
                const vec = new THREE.Vector3(n.x, n.z, -n.y); // Y is up in ThreeJS, Z is up in structural model
                nodeMap[n.id] = vec;
                
                if (!hasNodes) {
                    minX = maxX = vec.x;
                    minZ = maxZ = vec.z;
                    hasNodes = true;
                } else {
                    if (vec.x < minX) minX = vec.x;
                    if (vec.x > maxX) maxX = vec.x;
                    if (vec.z < minZ) minZ = vec.z;
                    if (vec.z > maxZ) maxZ = vec.z;
                }
                
                // Draw node point
                const sphere = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15, 16, 16),
                    new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
                );
                sphere.position.copy(vec);
                scene.add(sphere);
            });
        }

        // Dynamic Helper Grid
        let gridSize = 100;
        let cx = 0;
        let cz = 0;
        
        if (hasNodes) {
            const width = maxX - minX;
            const depth = maxZ - minZ;
            gridSize = Math.max(width, depth) * 1.5;
            if (gridSize < 100) gridSize = 100;
            gridSize = Math.ceil(gridSize / 10) * 10;
            
            cx = (minX + maxX) / 2;
            cz = (minZ + maxZ) / 2;
        }

        // Create GridHelper with calculated size and divisions = gridSize (so each square is 1x1m)
        const gridHelper = new THREE.GridHelper(gridSize, gridSize, 0x000000, 0xe2e8f0);
        
        // Make grid look better in dark mode
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            gridHelper.material.color.setHex(0x334155);
            gridHelper.material.needsUpdate = true;
        }
        
        gridHelper.position.set(cx, -0.01, cz);
        scene.add(gridHelper);`;

c = c.replace(searchStr, replaceStr);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', c, 'utf8');