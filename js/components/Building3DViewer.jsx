const { useRef, useEffect, useState, useMemo } = React;

function createIBeamGeometry(depth, width, tw, tf, length) {
    const shape = new THREE.Shape();
    shape.moveTo(-width/2, -depth/2);
    shape.lineTo(width/2, -depth/2);
    shape.lineTo(width/2, -depth/2 + tf);
    shape.lineTo(tw/2, -depth/2 + tf);
    shape.lineTo(tw/2, depth/2 - tf);
    shape.lineTo(width/2, depth/2 - tf);
    shape.lineTo(width/2, depth/2);
    shape.lineTo(-width/2, depth/2);
    shape.lineTo(-width/2, depth/2 - tf);
    shape.lineTo(-tw/2, depth/2 - tf);
    shape.lineTo(-tw/2, -depth/2 + tf);
    shape.lineTo(-width/2, -depth/2 + tf);
    shape.lineTo(-width/2, -depth/2);
    const extrudeSettings = { depth: length, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    return geometry;
}

function createZBeamGeometry(depth, width, t, length) {
    const shape = new THREE.Shape();
    shape.moveTo(-width/2, -depth/2);
    shape.lineTo(width/2, -depth/2);
    shape.lineTo(width/2, -depth/2 + t);
    shape.lineTo(-width/2 + t, -depth/2 + t);
    shape.lineTo(-width/2 + t, depth/2 - t);
    shape.lineTo(width/2, depth/2 - t);
    shape.lineTo(width/2, depth/2);
    shape.lineTo(-width/2, depth/2);
    shape.lineTo(-width/2, -depth/2);
    const extrudeSettings = { depth: length, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    return geometry;
}

function placeBeam(mesh, p1, p2, up = new THREE.Vector3(0, 1, 0)) {
    mesh.position.copy(p1).lerp(p2, 0.5);
    mesh.up.copy(up);
    mesh.lookAt(p2);
}

function createTextSprite(message, color = "#ef4444", bgColor = "rgba(0,0,0,0.8)") {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 10, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 15;
    ctx.stroke();

    ctx.font = "bold 120px Arial";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(message, size/2, size/2 + 10);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 2, 1);
    return sprite;
}

function createDimensionText(message, size=1.5) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = "bold 60px Arial";
    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(message, 256, 64);
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(size * 4, size, 1);
    return sprite;
}

function Building3DViewer({ inputs, mode = 'geometry', loadCases, defaultDir = '+X' }) {
    const mountRef = useRef(null);
    const containerRef = useRef(null);
    const [selectedZone, setSelectedZone] = useState(null);
    const [currentDir, setCurrentDir] = useState(defaultDir);
    const [showCladding, setShowCladding] = useState(mode === 'wind');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [theme, setTheme] = useState('light');
    
    // PERSIST CAMERA STATE ACROSS RERENDERS
    const cameraStateRef = useRef({ position: null, target: null });

    const L = Number(inputs.L) || 25;
    const B_step = Number(inputs.B) || 6;
    const B_total = Number(inputs.length) || 72;
    const H_col = Number(inputs.H_column) || 8;
    const H_roof = Number(inputs.H_roof) || 9.25;

    const caseData = mode === 'wind' && loadCases ? loadCases[currentDir] : null;

    useEffect(() => {
        if (!mountRef.current || !window.THREE) return;
        while(mountRef.current.firstChild) mountRef.current.removeChild(mountRef.current.firstChild);

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        const scene = new THREE.Scene();
        const isGeometry = mode === 'geometry';
        const isDark = theme === 'dark';
        
        const bgColor = isDark ? (isGeometry ? 0x0b1121 : 0x0f172a) : 0xf8fafc;
        scene.background = new THREE.Color(bgColor);
        scene.fog = new THREE.FogExp2(bgColor, 0.004); // Smooth horizon fade

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // WOW shadows
        mountRef.current.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.01; // Prevent going strictly below ground

        // Restore Camera State OR Initialize
        const maxDim = Math.max(L, B_total, H_roof);
        if (cameraStateRef.current.position) {
            camera.position.copy(cameraStateRef.current.position);
            controls.target.copy(cameraStateRef.current.target);
        } else {
            camera.position.set(maxDim * 0.9, maxDim * 0.6, maxDim * 1.1);
            controls.target.set(0, H_col/2, 0);
        }
        controls.update();

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.7 : 1.1);
        scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.2 : 1.2);
        dirLight.position.set(50, 150, 100);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 4096;
        dirLight.shadow.mapSize.height = 4096;
        dirLight.shadow.camera.left = -80;
        dirLight.shadow.camera.right = 80;
        dirLight.shadow.camera.top = 80;
        dirLight.shadow.camera.bottom = -80;
        dirLight.shadow.bias = -0.0005;
        scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
        fillLight.position.set(-50, 50, -50);
        scene.add(fillLight);

        const buildingGroup = new THREE.Group();
        scene.add(buildingGroup);

        // Materials
        const steelColor = isDark ? 0x2563eb : 0x1d4ed8; 
        const steelMat = new THREE.MeshStandardMaterial({ color: steelColor, metalness: 0.6, roughness: 0.3 });
        
        const purlinColor = 0xf59e0b;
        const purlinMat = new THREE.MeshStandardMaterial({ color: purlinColor, metalness: 0.4, roughness: 0.5 });
        
        const boltMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
        
        const wallMat = new THREE.MeshPhysicalMaterial({ 
            color: isDark ? 0x1e293b : 0x94a3b8, transparent: true, opacity: 0.3, side: THREE.DoubleSide, 
            clearcoat: 0.5, roughness: 0.4, wireframe: isGeometry 
        });
        const roofMat = new THREE.MeshPhysicalMaterial({ 
            color: isDark ? 0x334155 : 0x64748b, transparent: true, opacity: 0.4, side: THREE.DoubleSide, 
            clearcoat: 0.8, roughness: 0.3, wireframe: isGeometry
        });
        const wireMat = new THREE.LineBasicMaterial({ color: isDark ? 0x38bdf8 : 0x0284c7, linewidth: 1, transparent: true, opacity: 0.5 });
        const interactableMeshes = [];

        // Geometries
        const cDepth = 0.6, cWidth = 0.25;
        const colGeom = createIBeamGeometry(cDepth, cWidth, 0.012, 0.016, H_col);
        
        const roofRise = H_roof - H_col;
        const halfSpan = L / 2;
        const rafterLength = Math.sqrt(halfSpan*halfSpan + roofRise*roofRise);
        const rafterAngle = Math.atan(roofRise / halfSpan);
        const rDepth = 0.5, rWidth = 0.25;
        const rafterGeom = createIBeamGeometry(rDepth, rWidth, 0.01, 0.014, rafterLength);
        
        const purlinSpacing = Number(inputs.purlinSpacing) || 1.2;
        const numPurlins = Math.floor(rafterLength / purlinSpacing) + 1;
        const purlinGeom = createZBeamGeometry(0.2, 0.07, 0.005, B_total);

        const basePlateGeom = new THREE.BoxGeometry(0.7, 0.04, 0.7);
        const basePlateMat = new THREE.MeshStandardMaterial({ color: isDark ? 0x94a3b8 : 0x475569, metalness: 0.8, roughness: 0.2 });
        const foundationGeom = new THREE.BoxGeometry(1.5, 1.2, 1.5);
        const foundationMat = new THREE.MeshStandardMaterial({ color: isDark ? 0x475569 : 0xcbd5e1, roughness: 0.9 }); 

        const apexGeom = new THREE.BoxGeometry(rWidth, rDepth + 0.05, 0.04);
        const boltGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.1, 6); // Hexagonal bolt

        const skeletonGroup = new THREE.Group();
        const numFrames = Math.max(2, Math.round(B_total / B_step) + 1);
        const actualStep = B_total / (numFrames - 1);

        const gridMat = new THREE.LineDashedMaterial({ color: isDark ? 0xef4444 : 0xdc2626, dashSize: 0.5, gapSize: 0.5 });
        
        const haunchLength = Math.min(L * 0.1, 3.0);
        const haunchDepth = rDepth * 0.8;
        const tw = 0.01, tf = 0.014;

        // Bolts setup helpers
        const addBaseBolts = (baseMesh) => {
            const positions = [[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25], [0.25, -0.25]];
            positions.forEach(pos => {
                const bolt = new THREE.Mesh(boltGeom, boltMat);
                bolt.position.set(pos[0], 0.04, pos[1]);
                baseMesh.add(bolt);
            });
        };
        const addApexBolts = (apexMesh) => {
            const positions = [[-0.08, 0.15], [0.08, 0.15], [-0.08, -0.15], [0.08, -0.15], [-0.08, 0], [0.08, 0]];
            positions.forEach(pos => {
                const bolt = new THREE.Mesh(boltGeom, boltMat);
                bolt.rotation.x = Math.PI/2; 
                bolt.position.set(pos[0], pos[1], 0);
                apexMesh.add(bolt);
            });
        };

        for (let i = 0; i < numFrames; i++) {
            const zPos = -B_total/2 + i * actualStep;
            
            if (isGeometry) {
                const axisGeo = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(-L/2 - 2, 0, zPos), new THREE.Vector3(L/2 + 2, 0, zPos)
                ]);
                const axisLine = new THREE.Line(axisGeo, gridMat);
                axisLine.computeLineDistances(); scene.add(axisLine);
                const label1 = createTextSprite(`${i+1}`);
                label1.position.set(-L/2 - 3, 0.1, zPos); scene.add(label1);
            }

            // Foundations
            const fL = new THREE.Mesh(foundationGeom, foundationMat);
            fL.position.set(-L/2, -0.6, zPos);
            fL.receiveShadow = true; skeletonGroup.add(fL);

            const fR = new THREE.Mesh(foundationGeom, foundationMat);
            fR.position.set(L/2, -0.6, zPos);
            fR.receiveShadow = true; skeletonGroup.add(fR);

            // Base plates
            const baseL = new THREE.Mesh(basePlateGeom, basePlateMat);
            baseL.position.set(-L/2, 0.02, zPos);
            baseL.castShadow = true; baseL.receiveShadow = true; addBaseBolts(baseL); skeletonGroup.add(baseL);

            const baseR = new THREE.Mesh(basePlateGeom, basePlateMat);
            baseR.position.set(L/2, 0.02, zPos);
            baseR.castShadow = true; baseR.receiveShadow = true; addBaseBolts(baseR); skeletonGroup.add(baseR);

            // Columns
            const colL = new THREE.Mesh(colGeom, steelMat);
            placeBeam(colL, new THREE.Vector3(-L/2, 0, zPos), new THREE.Vector3(-L/2, H_col, zPos), new THREE.Vector3(-1, 0, 0));
            colL.castShadow = true; colL.receiveShadow = true; skeletonGroup.add(colL);
            
            const colR = new THREE.Mesh(colGeom, steelMat);
            placeBeam(colR, new THREE.Vector3(L/2, 0, zPos), new THREE.Vector3(L/2, H_col, zPos), new THREE.Vector3(1, 0, 0));
            colR.castShadow = true; colR.receiveShadow = true; skeletonGroup.add(colR);
            
            // Rafters
            const dy = rDepth / 2 / Math.cos(rafterAngle);
            const pApex = new THREE.Vector3(0, H_roof + dy, zPos);
            
            const rafL = new THREE.Mesh(rafterGeom, steelMat);
            const p1L = new THREE.Vector3(-L/2, H_col + dy, zPos);
            placeBeam(rafL, p1L, pApex, new THREE.Vector3(0, 1, 0));
            rafL.castShadow = true; rafL.receiveShadow = true; skeletonGroup.add(rafL);
            
            const rafR = new THREE.Mesh(rafterGeom, steelMat);
            const p1R = new THREE.Vector3(L/2, H_col + dy, zPos);
            placeBeam(rafR, p1R, pApex, new THREE.Vector3(0, 1, 0));
            rafR.castShadow = true; rafR.receiveShadow = true; skeletonGroup.add(rafR);

            // Apex Splice
            const apex = new THREE.Mesh(apexGeom, basePlateMat);
            apex.position.set(0, H_roof + dy - rDepth/2, zPos);
            apex.castShadow = true; apex.receiveShadow = true; addApexBolts(apex); skeletonGroup.add(apex);

            // Knee Haunches (Vút nách)
            const buildHaunch = (isLeft) => {
                const sign = isLeft ? 1 : -1;
                const startX = (isLeft ? -L/2 : L/2) + sign * cDepth/2;
                const endX = startX + sign * haunchLength;
                const startY_top = H_col + (cDepth/2) * Math.tan(rafterAngle);
                const endY = H_col + (cDepth/2 + haunchLength) * Math.tan(rafterAngle);
                const startY_bot = startY_top - haunchDepth;

                const shape = new THREE.Shape();
                shape.moveTo(startX, startY_top);
                shape.lineTo(endX, endY);
                shape.lineTo(startX, startY_bot);
                shape.lineTo(startX, startY_top);

                const web = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: tw, bevelEnabled: false }), steelMat);
                web.position.set(0, 0, zPos - tw/2);
                web.castShadow = true; web.receiveShadow = true; skeletonGroup.add(web);

                const flDist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY_bot, 2));
                const fl = new THREE.Mesh(new THREE.BoxGeometry(rWidth, tf, flDist), steelMat);
                placeBeam(fl, new THREE.Vector3(startX, startY_bot, zPos), new THREE.Vector3(endX, endY, zPos), new THREE.Vector3(0, 1, 0));
                fl.castShadow = true; fl.receiveShadow = true; skeletonGroup.add(fl);
            };
            buildHaunch(true);
            buildHaunch(false);

            // X Bracing
            if (i === 0 || i === numFrames - 2) {
                const zBraceCenter = -B_total/2 + i * actualStep + actualStep/2;
                const braceGeom = new THREE.CylinderGeometry(0.015, 0.015, Math.sqrt(actualStep*actualStep + H_col*H_col));
                braceGeom.rotateX(Math.PI/2);
                const braceMat = new THREE.MeshStandardMaterial({ color: isDark ? 0x94a3b8 : 0x64748b });
                const addX = (xPos) => {
                    const b1 = new THREE.Mesh(braceGeom, braceMat);
                    placeBeam(b1, new THREE.Vector3(xPos, 0, zPos), new THREE.Vector3(xPos, H_col, zPos + actualStep), new THREE.Vector3(1,0,0));
                    skeletonGroup.add(b1);
                    const b2 = new THREE.Mesh(braceGeom, braceMat);
                    placeBeam(b2, new THREE.Vector3(xPos, H_col, zPos), new THREE.Vector3(xPos, 0, zPos + actualStep), new THREE.Vector3(1,0,0));
                    skeletonGroup.add(b2);
                };
                addX(-L/2); addX(L/2);
            }
        }

        // Axis Line A, B
        if (isGeometry) {
            const addAxis = (x, label) => {
                const geo = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(x, 0, -B_total/2 - 2), new THREE.Vector3(x, 0, B_total/2 + 2)
                ]);
                const line = new THREE.Line(geo, gridMat); line.computeLineDistances(); scene.add(line);
                const txt = createTextSprite(label); txt.position.set(x, 0.1, B_total/2 + 3); scene.add(txt);
            };
            addAxis(-L/2, "A"); addAxis(L/2, "B");
            
            const dimMat = new THREE.LineBasicMaterial({ color: isDark ? 0x38bdf8 : 0x0284c7 });
            const dimGeoL = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-L/2, -1, B_total/2 + 1), new THREE.Vector3(L/2, -1, B_total/2 + 1)
            ]);
            scene.add(new THREE.Line(dimGeoL, dimMat));
            const dimTextL = createDimensionText(`L = ${L}m`);
            dimTextL.position.set(0, -0.5, B_total/2 + 1); scene.add(dimTextL);

            const dimGeoH = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-L/2 - 2, 0, B_total/2), new THREE.Vector3(-L/2 - 2, H_col, B_total/2)
            ]);
            scene.add(new THREE.Line(dimGeoH, dimMat));
            const dimTextH = createDimensionText(`H = ${H_col}m`);
            dimTextH.position.set(-L/2 - 3, H_col/2, B_total/2); scene.add(dimTextH);
        }

        // Purlins & Wall Girts (Hệ Xà gồ mái & vách)
        const dy = rDepth/2 / Math.cos(rafterAngle);
        for(let j=0; j<2; j++) {
            const sign = j===0 ? -1 : 1;
            // Roof purlins
            for(let p=0; p<numPurlins; p++) {
                const ratio = p / (numPurlins - 1);
                const px = sign * L/2 * (1 - ratio);
                const py = H_col + roofRise * ratio;
                
                const purlin = new THREE.Mesh(purlinGeom, purlinMat);
                const p1P = new THREE.Vector3(px, py + dy + 0.1, -B_total/2);
                const p2P = new THREE.Vector3(px, py + dy + 0.1, B_total/2);
                
                const nx = sign * Math.sin(rafterAngle);
                const ny = Math.cos(rafterAngle);
                placeBeam(purlin, p1P, p2P, new THREE.Vector3(nx, ny, 0));
                
                purlin.castShadow = true; purlin.receiveShadow = true;
                skeletonGroup.add(purlin);
            }
            
            // Wall Girts (Xà gồ vách) - WOW Detail Upgrade
            const numGirts = Math.floor(H_col / purlinSpacing);
            const gx = sign * (L/2 + cDepth/2 + 0.1); // Outside column face + half purlin depth
            for(let g=1; g<=numGirts; g++) {
                const gy = g * purlinSpacing;
                if (gy >= H_col - 0.2) continue; // Avoid clashing with eaves
                const girt = new THREE.Mesh(purlinGeom, purlinMat);
                const p1G = new THREE.Vector3(gx, gy, -B_total/2);
                const p2G = new THREE.Vector3(gx, gy, B_total/2);
                // Normal points outward horizontally
                placeBeam(girt, p1G, p2G, new THREE.Vector3(sign, 0, 0));
                girt.castShadow = true; girt.receiveShadow = true;
                skeletonGroup.add(girt);
            }
        }
        buildingGroup.add(skeletonGroup);

        // CLADDING
        function createQuad(p1, p2, p3, p4, type, zoneData) {
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                p1[0], p1[1], p1[2],  p2[0], p2[1], p2[2],  p3[0], p3[1], p3[2],
                p1[0], p1[1], p1[2],  p3[0], p3[1], p3[2],  p4[0], p4[1], p4[2]
            ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();

            let mat = type === 'wall' ? wallMat.clone() : roofMat.clone();
            if (zoneData) {
                if (zoneData.c_net > 0) mat.color.setHex(isDark ? 0xfca5a5 : 0xef4444); 
                else mat.color.setHex(isDark ? 0x60a5fa : 0x3b82f6); 
                mat.opacity = 0.85; 
                mat.wireframe = false;
            } else if (isGeometry) {
                mat.opacity = 0.05; 
            }

            const mesh = new THREE.Mesh(geometry, mat);
            if (zoneData) {
                mesh.userData = zoneData;
                interactableMeshes.push(mesh);
            }
            mesh.visible = showCladding;
            buildingGroup.add(mesh);

            const edges = new THREE.EdgesGeometry(geometry);
            const lineMat = isGeometry ? wireMat : new THREE.LineBasicMaterial({ color: isDark ? 0x94a3b8 : 0x64748b, opacity: 0.3, transparent: true });
            const line = new THREE.LineSegments(edges, lineMat);
            line.visible = showCladding;
            buildingGroup.add(line);
            
            return mesh;
        }

        // Offset cladding to wrap outside the columns and girts (cDepth = 0.6, purlin = 0.2)
        const cladExtX = cDepth/2 + 0.25;
        const xMin = -L/2 - cladExtX, xMax = L/2 + cladExtX;
        const cladExtZ = 0.2;
        const zMin = -B_total/2 - cladExtZ, zMax = B_total/2 + cladExtZ;
        const y0 = 0;
        
        // Cladding points wrapping over roof purlins
        const yColTop = H_col + dy + 0.25; 
        const yRoofTop = H_roof + dy + 0.25;

        const N0 = [xMin, y0, zMax], N1 = [xMax, y0, zMax], N2 = [xMax, y0, zMin], N3 = [xMin, y0, zMin];
        const C0 = [xMin, yColTop, zMax], C1 = [xMax, yColTop, zMax], C2 = [xMax, yColTop, zMin], C3 = [xMin, yColTop, zMin];
        const R0 = [0, yRoofTop, zMax], R1 = [0, yRoofTop, zMin];

        let windwardZone, leewardZone, sideZone, roofWindward, roofLeeward;
        if (mode === 'wind' && caseData) {
            const zones = caseData.surfaces || [];
            if (currentDir.includes('X')) {
                windwardZone = zones.find(z => z.surface === 'A' || z.zone === 'A');
                leewardZone = zones.find(z => z.surface === 'B' || z.zone === 'B');
                sideZone = zones.find(z => z.surface === 'C' || z.zone === 'C');
                roofWindward = zones.find(z => z.zone === 'F' || z.zone === 'G' || z.zone === 'H');
                roofLeeward = zones.find(z => z.zone === 'I' || z.zone === 'J');
            } else {
                windwardZone = zones.find(z => z.surface === 'A' || z.zone === 'D');
                leewardZone = zones.find(z => z.surface === 'B' || z.zone === 'E');
                sideZone = zones.find(z => z.surface === 'C' || z.zone === 'A');
            }
        }

        createQuad(N0, N1, C1, C0, 'wall', currentDir==='+Y'?windwardZone:(currentDir==='-Y'?leewardZone:sideZone)); 
        createQuad(N1, N2, C2, C1, 'wall', currentDir==='+X'?leewardZone:(currentDir==='-X'?windwardZone:sideZone)); 
        createQuad(N2, N3, C3, C2, 'wall', currentDir==='-Y'?windwardZone:(currentDir==='+Y'?leewardZone:sideZone)); 
        createQuad(N3, N0, C0, C3, 'wall', currentDir==='+X'?windwardZone:(currentDir==='-X'?leewardZone:sideZone)); 

        createQuad(C0, R0, R1, C3, 'roof', currentDir==='+X'?roofWindward:roofLeeward); 
        createQuad(R0, C1, C2, R1, 'roof', currentDir==='+X'?roofLeeward:roofWindward); 

        // WIND VISUALIZATION (WOW Animated Flow Update)
        const windArrows = [];
        if (mode === 'wind') {
            const arrowDir = new THREE.Vector3(
                currentDir.includes('X') ? (currentDir.includes('+') ? 1 : -1) : 0, 
                0, 
                currentDir.includes('Y') ? (currentDir.includes('+') ? -1 : 1) : 0
            );
            
            const numArrows = Math.max(4, Math.floor(maxDim / 8));
            const arrowGroup = new THREE.Group();
            for(let i=0; i<numArrows; i++) {
                for(let j=0; j<3; j++) { 
                    const ratio = (i + 0.5) / numArrows;
                    let ax, az;
                    if(currentDir.includes('X')) {
                        ax = arrowDir.x * -(L/2 + 25); 
                        az = -B_total/2 + B_total * ratio;
                    } else {
                        az = arrowDir.z * -(B_total/2 + 25);
                        ax = -L/2 + L * ratio;
                    }
                    const pos = new THREE.Vector3(ax, H_col * (0.2 + j*0.35), az);
                    const ah = new THREE.ArrowHelper(arrowDir, pos, 12, isDark ? 0x38bdf8 : 0x0284c7, 3, 1.5);
                    ah.userData = { originalPos: pos.clone(), offset: Math.random() * 40 };
                    arrowGroup.add(ah);
                    windArrows.push(ah);
                }
            }
            scene.add(arrowGroup);
        }

        const gridColor = isDark ? 0x1e293b : 0xe2e8f0;
        const gridCenterColor = isDark ? 0x334155 : 0xcbd5e1;
        const grid = new THREE.GridHelper(maxDim * 4, 80, gridCenterColor, gridColor);
        grid.position.y = -0.01;
        scene.add(grid);
        
        const groundGeo = new THREE.PlaneGeometry(maxDim * 5, maxDim * 5);
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: bgColor, depthWrite: false, roughness: 1, metalness: 0
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true;
        scene.add(ground);

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const onMouseClick = (event) => {
            if(!showCladding || mode !== 'wind') return;
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactableMeshes);
            if (intersects.length > 0) setSelectedZone(intersects[0].object.userData);
            else setSelectedZone(null);
        };
        renderer.domElement.addEventListener('click', onMouseClick);

        let animationFrameId;
        const renderLoop = () => {
            controls.update();
            
            // Animate Wind Flow
            if (windArrows.length > 0) {
                const time = Date.now() * 0.02; // Speed
                windArrows.forEach(ah => {
                    const travelDist = 30; // Distance to travel
                    const progress = (time + ah.userData.offset) % travelDist;
                    ah.position.copy(ah.userData.originalPos).addScaledVector(ah.dir, progress);
                });
            }

            renderer.render(scene, camera);
            animationFrameId = requestAnimationFrame(renderLoop);
        };
        renderLoop();

        const resizeObserver = new ResizeObserver(() => {
            if (!mountRef.current) return;
            const w = mountRef.current.clientWidth;
            const h = mountRef.current.clientHeight;
            if (w === 0 || h === 0) return;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
        resizeObserver.observe(mountRef.current);

        return () => {
            resizeObserver.disconnect();
            if (renderer && renderer.domElement) renderer.domElement.removeEventListener('click', onMouseClick);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            
            // SAVE CAMERA STATE FOR PERSISTENCE
            cameraStateRef.current.position = camera.position.clone();
            cameraStateRef.current.target = controls.target.clone();
        };
    }, [inputs, caseData, currentDir, showCladding, mode, theme]);

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [mode, currentDir, showCladding, isFullscreen, theme]);

    const windDirs = ['+X', '-X', '+Y', '-Y'];

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => console.log(err));
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const isGeometry = mode === 'geometry';
    const isDark = theme === 'dark';
    
    const uiBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
    const textCol = isDark ? "text-slate-200" : "text-slate-800";
    const hudBg = isDark ? "bg-slate-900/80 border-slate-700/50" : "bg-white/90 border-slate-200/80";
    const hudText = isDark ? "text-slate-300" : "text-slate-600";
    const btnBg = isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900";

    return (
        <div ref={containerRef} className={`flex flex-col gap-3 ${isFullscreen ? (isDark ? 'bg-[#0b1121]' : 'bg-slate-50') + ' p-6 h-screen w-screen z-50 fixed inset-0' : ''}`}>
            <div className={`flex flex-wrap items-center justify-between p-3 rounded-xl border shadow-sm z-10 ${uiBg}`}>
                <div className="flex items-center gap-4">
                    <span className={`font-bold ${textCol}`}>
                        {mode === 'wind' ? 'Phân tích Tải trọng Gió 3D' : 'Mô hình Kết cấu 3D (CAD/BIM View)'}
                    </span>
                    
                    {mode === 'wind' && (
                        <div className={`flex rounded-lg p-1 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                            {windDirs.map(d => (
                                <button 
                                    key={d} onClick={() => setCurrentDir(d)}
                                    className={`px-3 py-1 text-sm rounded-md transition-all font-semibold ${currentDir === d ? 'bg-blue-600 shadow text-white' : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')}`}
                                >
                                    Hướng {d}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        className={`p-2 rounded-lg border transition-colors ${btnBg}`}
                        title="Đổi giao diện Sáng/Tối"
                    >
                        <i data-lucide={isDark ? "sun" : "moon"} className="w-4 h-4"></i>
                    </button>
                    <button 
                        onClick={() => setShowCladding(!showCladding)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${showCladding ? 'bg-blue-600 text-white border-blue-700 shadow-inner' : btnBg}`}
                    >
                        {showCladding ? 'Ẩn lớp Bao che' : 'Hiện lớp Bao che'}
                    </button>
                    <button onClick={toggleFullscreen} className={`p-2 rounded-lg border transition-colors ${btnBg}`}>
                        <i data-lucide={isFullscreen ? "minimize" : "maximize"} className="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <div className={`relative w-full ${isDark ? (isGeometry ? 'bg-[#0b1121]' : 'bg-slate-900') : 'bg-slate-50'} border ${isDark ? 'border-slate-800' : 'border-slate-200'} rounded-xl overflow-hidden shadow-inner ${isFullscreen ? 'flex-1' : 'h-[650px]'}`}>
                <div ref={mountRef} className="absolute inset-0" />
                
                <div className="absolute top-4 left-4 pointer-events-none">
                    <div className={`${hudBg} backdrop-blur-md p-4 rounded-lg shadow-lg border`}>
                        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'} flex items-center gap-2 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'} pb-2 mb-2`}>
                            {mode === 'wind' ? (
                                <><i data-lucide="wind" className="text-blue-500 w-5 h-5"></i> Gió {currentDir}</>
                            ) : (
                                <><i data-lucide="box" className="text-blue-500 w-5 h-5"></i> Hình học Tổng thể</>
                            )}
                        </h3>
                        <div className={`text-xs ${hudText} space-y-1.5 font-mono`}>
                            <p className="flex justify-between gap-6"><span>Nhịp (L):</span> <b className="text-blue-500">{inputs.L || 25} m</b></p>
                            <p className="flex justify-between gap-6"><span>Bước cột (B):</span> <b className="text-blue-500">{inputs.B || 6} m</b></p>
                            <p className="flex justify-between gap-6"><span>Chiều dài:</span> <b className="text-blue-500">{inputs.length || 72} m</b></p>
                            <p className="flex justify-between gap-6"><span>Cao cột (H):</span> <b className="text-blue-500">{inputs.H_column || 8} m</b></p>
                            <p className="flex justify-between gap-6"><span>Cao mái:</span> <b className="text-blue-500">{inputs.H_roof || 9.25} m</b></p>
                            <p className="flex justify-between gap-6"><span>Khoảng cách Xà gồ:</span> <b className="text-orange-500">{inputs.purlinSpacing || 1.2} m</b></p>
                        </div>
                    </div>
                </div>
                
                <div className={`absolute bottom-4 right-4 text-xs ${hudText} ${hudBg} backdrop-blur p-2.5 rounded-lg shadow border`}>
                    <span className="flex items-center gap-2"><i data-lucide="mouse-pointer-2" className="w-4 h-4"></i> Xoay (Trái) • Zoom (Cuộn) • Di chuyển (Phải)</span>
                    {mode === 'wind' && showCladding && <span className="text-blue-500 font-semibold block mt-1.5 border-t border-slate-200/20 pt-1.5">Click vào tường/mái để xem Áp lực</span>}
                </div>
                
                {mode === 'wind' && selectedZone && showCladding && (
                    <div className={`absolute bottom-4 left-4 ${isDark ? 'bg-slate-900/95 text-slate-200 border-blue-500/30' : 'bg-white/95 text-slate-700 border-blue-400'} backdrop-blur p-4 rounded-xl shadow-2xl border w-64 text-sm z-10 animate-fade-in`}>
                        <h4 className={`font-bold border-b ${isDark ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'} pb-2 mb-3 flex justify-between items-center`}>
                            <span>Vùng {selectedZone.zone}</span>
                            <span className="text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-500/50 px-2 py-0.5 rounded-full">{selectedZone.surface}</span>
                        </h4>
                        <div className={`flex justify-between py-1.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Hệ số c_e:</span>
                            <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{selectedZone.ce > 0 ? '+' : ''}{selectedZone.ce}</span>
                        </div>
                        <div className={`flex justify-between py-1.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Giá trị w_d:</span>
                            <span className={`font-mono font-bold ${selectedZone.pressure_d > 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                {selectedZone.pressure_d.toFixed(2)} kN/m²
                            </span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Phân loại:</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${selectedZone.pressure_d > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                {selectedZone.pressure_d > 0 ? 'Áp lực Đẩy (+)' : 'Áp lực Hút (-)'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

window.Building3DViewer = Building3DViewer;
