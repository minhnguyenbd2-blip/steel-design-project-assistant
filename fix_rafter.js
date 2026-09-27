const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', 'utf8');

const oldRafterCode = `            // Rafters
            const rafL = new THREE.Mesh(rafterGeom, steelMat);
            rafL.position.set(-L/4, H_col + roofRise/2, zPos);
            rafL.rotation.y = Math.PI/2; 
            rafL.rotation.x = -rafterAngle; 
            rafL.castShadow = true; rafL.receiveShadow = true; skeletonGroup.add(rafL);
            
            const rafR = new THREE.Mesh(rafterGeom, steelMat);
            rafR.position.set(L/4, H_col + roofRise/2, zPos);
            rafR.rotation.y = -Math.PI/2;
            rafR.rotation.x = -rafterAngle;
            rafR.castShadow = true; rafR.receiveShadow = true; skeletonGroup.add(rafR);`;

const newRafterCode = `            // Rafters (Fixed Rotation with lookAt)
            const p1L = new THREE.Vector3(-L/2, H_col, zPos);
            const p2L = new THREE.Vector3(0, H_roof, zPos);
            const rafL = new THREE.Mesh(rafterGeom, steelMat);
            rafL.position.copy(p1L).lerp(p2L, 0.5);
            rafL.lookAt(p2L);
            rafL.castShadow = true; rafL.receiveShadow = true; skeletonGroup.add(rafL);
            
            const p1R = new THREE.Vector3(L/2, H_col, zPos);
            const p2R = new THREE.Vector3(0, H_roof, zPos);
            const rafR = new THREE.Mesh(rafterGeom, steelMat);
            rafR.position.copy(p1R).lerp(p2R, 0.5);
            rafR.lookAt(p2R);
            rafR.castShadow = true; rafR.receiveShadow = true; skeletonGroup.add(rafR);`;

c = c.replace(oldRafterCode, newRafterCode);
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', c, 'utf8');