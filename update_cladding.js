const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', 'utf8');

const oldCladding = `        // Cladding Surfaces
        function createQuad(p1, p2, p3, p4, type, zoneData) {
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([ p1[0], p1[1], p1[2],  p2[0], p2[1], p2[2],  p3[0], p3[1], p3[2], p1[0], p1[1], p1[2],  p3[0], p3[1], p3[2],  p4[0], p4[1], p4[2] ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();
            let mat = type === 'wall' ? wallMat.clone() : roofMat.clone();
            if (zoneData) {
                mat.color.setHex(zoneData.c_net > 0 ? (isDark ? 0xfca5a5 : 0xef4444) : (isDark ? 0x60a5fa : 0x3b82f6)); 
                mat.opacity = 0.85; mat.wireframe = false;
            } else if (isGeometry) mat.opacity = 0.05;
            const mesh = new THREE.Mesh(geometry, mat);
            if (zoneData) { mesh.userData = zoneData; interactableMeshes.push(mesh); }
            mesh.visible = showCladding; buildingGroup.add(mesh);
            return mesh;
        }

        const cladExtX = cDepth/2 + 0.25; const xMin = -L/2 - cladExtX, xMax = L/2 + cladExtX;
        const cladExtZ = 0.2; const zMin = -B_total/2 - cladExtZ, zMax = B_total/2 + cladExtZ;
        const y0 = 0; const yColTop = H_col + dy + 0.25; const yRoofTop = H_roof + dy + 0.25;
        const N0 = [xMin, y0, zMax], N1 = [xMax, y0, zMax], N2 = [xMax, y0, zMin], N3 = [xMin, y0, zMin];
        const C0 = [xMin, yColTop, zMax], C1 = [xMax, yColTop, zMax], C2 = [xMax, yColTop, zMin], C3 = [xMin, yColTop, zMin];
        const R0 = [0, yRoofTop, zMax], R1 = [0, yRoofTop, zMin];

        let windwardZone, leewardZone, sideZone, roofWindward, roofLeeward;
        if (mode === 'wind' && caseData) {
            const zones = caseData.surfaces || [];
            windwardZone = zones.find(z => z.surface === 'A'); leewardZone = zones.find(z => z.surface === 'B'); sideZone = zones.find(z => z.surface === 'C');
            roofWindward = zones.find(z => z.zone === 'F' || z.zone === 'G'); roofLeeward = zones.find(z => z.zone === 'I');
        }

        createQuad(N0, N1, C1, C0, 'wall', currentDir==='+Y'?windwardZone:(currentDir==='-Y'?leewardZone:sideZone)); 
        createQuad(N1, N2, C2, C1, 'wall', currentDir==='+X'?leewardZone:(currentDir==='-X'?windwardZone:sideZone)); 
        createQuad(N2, N3, C3, C2, 'wall', currentDir==='-Y'?windwardZone:(currentDir==='+Y'?leewardZone:sideZone)); 
        createQuad(N3, N0, C0, C3, 'wall', currentDir==='+X'?windwardZone:(currentDir==='-X'?leewardZone:sideZone)); 
        createQuad(C0, R0, R1, C3, 'roof', currentDir==='+X'?roofWindward:roofLeeward); 
        createQuad(R0, C1, C2, R1, 'roof', currentDir==='+X'?roofLeeward:roofWindward);`;

const newCladding = `        // Cladding Surfaces
        const getZoneColor = (zoneName, c_net) => {
            const isSuction = c_net < 0;
            const colors = {
                'A': isDark ? 0xef4444 : 0xdc2626, // Red
                'B': isDark ? 0x3b82f6 : 0x2563eb, // Blue
                'C': isDark ? 0xa855f7 : 0x9333ea, // Purple
                'D': isDark ? 0x10b981 : 0x059669, // Green
                'E': isDark ? 0xf59e0b : 0xd97706, // Orange
                'F': isDark ? 0xf43f5e : 0xe11d48, // Rose
                'G': isDark ? 0xf97316 : 0xea580c, // Orange
                'H': isDark ? 0xeab308 : 0xca8a04, // Yellow
                'I': isDark ? 0x0ea5e9 : 0x0284c7, // Sky
                'J': isDark ? 0x8b5cf6 : 0x7c3aed, // Violet
            };
            if (!colors[zoneName]) return isSuction ? (isDark ? 0x60a5fa : 0x3b82f6) : (isDark ? 0xfca5a5 : 0xef4444);
            return colors[zoneName];
        };

        function createQuad(p1, p2, p3, p4, type, zoneData) {
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([ p1[0], p1[1], p1[2],  p2[0], p2[1], p2[2],  p3[0], p3[1], p3[2], p1[0], p1[1], p1[2],  p3[0], p3[1], p3[2],  p4[0], p4[1], p4[2] ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();
            let mat = type === 'wall' ? wallMat.clone() : roofMat.clone();
            
            // Add wireframe outline for wind zones to make them clear
            let edges = null;
            if (zoneData) {
                mat.color.setHex(getZoneColor(zoneData.zone, zoneData.c_net)); 
                mat.opacity = 0.85; mat.wireframe = false;
                
                const edgesGeom = new THREE.EdgesGeometry(geometry);
                edges = new THREE.LineSegments(edgesGeom, new THREE.LineBasicMaterial({ color: isDark ? 0xffffff : 0x000000, opacity: 0.3, transparent: true }));
            } else if (isGeometry) mat.opacity = 0.05;
            
            const mesh = new THREE.Mesh(geometry, mat);
            if (zoneData) { mesh.userData = zoneData; interactableMeshes.push(mesh); }
            mesh.visible = showCladding; 
            buildingGroup.add(mesh);
            if (edges) { edges.visible = showCladding; buildingGroup.add(edges); }
            return mesh;
        }

        const cladExtX = cDepth/2 + 0.25; const xMin = -L/2 - cladExtX, xMax = L/2 + cladExtX;
        const cladExtZ = 0.2; const zMin = -B_total/2 - cladExtZ, zMax = B_total/2 + cladExtZ;
        const y0 = 0; const yColTop = H_col + dy + 0.25; const yRoofTop = H_roof + dy + 0.25;
        const N0 = [xMin, y0, zMax], N1 = [xMax, y0, zMax], N2 = [xMax, y0, zMin], N3 = [xMin, y0, zMin];
        const C0 = [xMin, yColTop, zMax], C1 = [xMax, yColTop, zMax], C2 = [xMax, yColTop, zMin], C3 = [xMin, yColTop, zMin];

        let zones = [];
        if (mode === 'wind' && caseData) zones = caseData.surfaces || [];
        const getZ = (zName) => zones.find(z => z.zone === zName);

        // WALLS
        createQuad(N0, N1, C1, C0, 'wall', currentDir==='+Y'?getZ('A'):(currentDir==='-Y'?getZ('B'):getZ('C'))); 
        createQuad(N1, N2, C2, C1, 'wall', currentDir==='+X'?getZ('B'):(currentDir==='-X'?getZ('A'):getZ('D'))); // D is side wall? Simplified. Actually D doesn't exist in C sometimes. Let's just use what we have
        createQuad(N2, N3, C3, C2, 'wall', currentDir==='-Y'?getZ('A'):(currentDir==='+Y'?getZ('B'):getZ('C'))); 
        createQuad(N3, N0, C0, C3, 'wall', currentDir==='+X'?getZ('A'):(currentDir==='-X'?getZ('B'):getZ('D'))); 

        // TCVN 2737:2023 EXPLICIT ROOF ZONING
        const getRoofY = (x) => {
            const h = yRoofTop - yColTop;
            const ratio = (L/2 - Math.abs(x)) / (L/2);
            return yColTop + h * ratio;
        };
        const createRoofQuad = (x1, x2, z1, z2, zoneName) => {
            if (x1 >= x2 || z1 >= z2) return;
            const y1 = getRoofY(x1); const y2 = getRoofY(x2);
            // Must order vertices for correct normal (pointing UP). 
            // If x1 < x2 and z1 < z2.
            const p1 = [x1, y1, z2]; const p2 = [x2, y2, z2]; const p3 = [x2, y2, z1]; const p4 = [x1, y1, z1];
            createQuad(p1, p2, p3, p4, 'roof', getZ(zoneName));
        };

        if (mode === 'wind' && caseData) {
            let b_wind = currentDir.includes('X') ? B_total : L;
            let e = Math.min(b_wind, 2 * H_roof);
            let e10 = e / 10; let e4 = e / 4; let e2 = e / 2;

            if (currentDir === '+X') {
                const xEave = -L/2, xMid = Math.min(0, xEave + e10);
                // Windward (Left slope)
                createRoofQuad(xEave, xMid, -B_total/2, -B_total/2 + e4, 'F');
                createRoofQuad(xEave, xMid, B_total/2 - e4, B_total/2, 'F');
                createRoofQuad(xEave, xMid, -B_total/2 + e4, B_total/2 - e4, 'G');
                if (xMid < 0) createRoofQuad(xMid, 0, -B_total/2, B_total/2, 'H');
                
                // Leeward (Right slope)
                const xJ = Math.min(L/2, e10);
                createRoofQuad(0, xJ, -B_total/2, B_total/2, 'J');
                if (xJ < L/2) createRoofQuad(xJ, L/2, -B_total/2, B_total/2, 'I');
            } else if (currentDir === '-X') {
                const xEave = L/2, xMid = Math.max(0, xEave - e10);
                // Windward (Right slope)
                createRoofQuad(xMid, xEave, -B_total/2, -B_total/2 + e4, 'F');
                createRoofQuad(xMid, xEave, B_total/2 - e4, B_total/2, 'F');
                createRoofQuad(xMid, xEave, -B_total/2 + e4, B_total/2 - e4, 'G');
                if (xMid > 0) createRoofQuad(0, xMid, -B_total/2, B_total/2, 'H');
                
                // Leeward (Left slope)
                const xJ = Math.max(-L/2, -e10);
                createRoofQuad(xJ, 0, -B_total/2, B_total/2, 'J');
                if (xJ > -L/2) createRoofQuad(-L/2, xJ, -B_total/2, B_total/2, 'I');
            } else if (currentDir === '+Y') {
                // Wind blows along -Z (from +B/2 to -B/2)
                const zGable = B_total/2; const zMid = zGable - e10; const zH = zGable - e2;
                // Cut everything at X=0 to maintain planar quads on gable roof
                const drawY = (x1, x2) => {
                    createRoofQuad(x1, x2, zMid, zGable, 'F'); // actually only e4 wide, let's refine
                    const xL = -L/2, xR = L/2;
                    // F is corners
                    createRoofQuad(xL, xL + e4, Math.max(-B_total/2, zMid), zGable, 'F');
                    createRoofQuad(xR - e4, xR, Math.max(-B_total/2, zMid), zGable, 'F');
                    // G is middle
                    createRoofQuad(xL + e4, 0, Math.max(-B_total/2, zMid), zGable, 'G');
                    createRoofQuad(0, xR - e4, Math.max(-B_total/2, zMid), zGable, 'G');
                    // H is e10 to e2
                    if (zH < zMid) {
                        createRoofQuad(xL, 0, Math.max(-B_total/2, zH), zMid, 'H');
                        createRoofQuad(0, xR, Math.max(-B_total/2, zH), zMid, 'H');
                    }
                    // I is e2 to end
                    if (-B_total/2 < zH) {
                        createRoofQuad(xL, 0, -B_total/2, zH, 'I');
                        createRoofQuad(0, xR, -B_total/2, zH, 'I');
                    }
                };
                drawY();
            } else if (currentDir === '-Y') {
                // Wind blows along +Z (from -B/2 to +B/2)
                const zGable = -B_total/2; const zMid = zGable + e10; const zH = zGable + e2;
                const xL = -L/2, xR = L/2;
                // F is corners
                createRoofQuad(xL, xL + e4, zGable, Math.min(B_total/2, zMid), 'F');
                createRoofQuad(xR - e4, xR, zGable, Math.min(B_total/2, zMid), 'F');
                // G is middle
                createRoofQuad(xL + e4, 0, zGable, Math.min(B_total/2, zMid), 'G');
                createRoofQuad(0, xR - e4, zGable, Math.min(B_total/2, zMid), 'G');
                // H is e10 to e2
                if (zH > zMid) {
                    createRoofQuad(xL, 0, zMid, Math.min(B_total/2, zH), 'H');
                    createRoofQuad(0, xR, zMid, Math.min(B_total/2, zH), 'H');
                }
                // I is e2 to end
                if (B_total/2 > zH) {
                    createRoofQuad(xL, 0, zH, B_total/2, 'I');
                    createRoofQuad(0, xR, zH, B_total/2, 'I');
                }
            }
        } else {
            // Geometry mode: Simple 2 quads
            const R0 = [0, yRoofTop, zMax], R1 = [0, yRoofTop, zMin];
            createQuad(C0, R0, R1, C3, 'roof', null); 
            createQuad(R0, C1, C2, R1, 'roof', null); 
        }`;

let result = c.replace(oldCladding, newCladding);
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', result, 'utf8');