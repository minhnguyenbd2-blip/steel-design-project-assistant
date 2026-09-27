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
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor; ctx.beginPath(); ctx.arc(128, 128, 118, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 15; ctx.stroke();
    ctx.font = "bold 120px Arial"; ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(message, 128, 138);
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 2, 1);
    return sprite;
}

function createDimensionText(message, size=1.5) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = "bold 60px Arial"; ctx.fillStyle = "#38bdf8"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
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
    const [windAnimMode, setWindAnimMode] = useState('dynamic'); 
    
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
        scene.fog = new THREE.FogExp2(bgColor, 0.003);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mountRef.current.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; controls.dampingFactor = 0.05; controls.maxPolarAngle = Math.PI / 2 - 0.01;

        const maxDim = Math.max(L, B_total, H_roof);
        if (cameraStateRef.current.position) {
            camera.position.copy(cameraStateRef.current.position);
            controls.target.copy(cameraStateRef.current.target);
        } else {
            camera.position.set(maxDim * 0.9, maxDim * 0.6, maxDim * 1.1);
            controls.target.set(0, H_col/2, 0);
        }
        controls.update();

        const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.7 : 1.1); scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.4 : 1.2);
        dirLight.position.set(50, 150, 100); dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 4096; dirLight.shadow.mapSize.height = 4096;
        dirLight.shadow.camera.left = -80; dirLight.shadow.camera.right = 80;
        dirLight.shadow.camera.top = 80; dirLight.shadow.camera.bottom = -80;
        dirLight.shadow.bias = -0.0005; scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4); fillLight.position.set(-50, 50, -50); scene.add(fillLight);

        const buildingGroup = new THREE.Group(); scene.add(buildingGroup);

        // Materials
        const steelColor = isDark ? 0x2563eb : 0x1d4ed8; 
        const steelMat = new THREE.MeshStandardMaterial({ color: steelColor, metalness: 0.7, roughness: 0.2 });
        const purlinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.4, roughness: 0.5 });
        const boltMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
        const jointMat = new THREE.MeshStandardMaterial({ color: isDark ? 0x475569 : 0x334155, metalness: 0.8, roughness: 0.2 }); // Darker for plates
        
        const wallMat = new THREE.MeshPhysicalMaterial({ color: isDark ? 0x1e293b : 0x94a3b8, transparent: true, opacity: 0.25, side: THREE.DoubleSide, clearcoat: 0.5, roughness: 0.4, wireframe: isGeometry });
        const roofMat = new THREE.MeshPhysicalMaterial({ color: isDark ? 0x334155 : 0x64748b, transparent: true, opacity: 0.35, side: THREE.DoubleSide, clearcoat: 0.8, roughness: 0.3, wireframe: isGeometry });
        const wireMat = new THREE.LineBasicMaterial({ color: isDark ? 0x38bdf8 : 0x0284c7, linewidth: 1, transparent: true, opacity: 0.5 });

        // Engineering Geometry Definitions
        const cDepth = 0.6, cWidth = 0.25;
        const colGeom = createIBeamGeometry(cDepth, cWidth, 0.012, 0.016, H_col);
        const roofRise = H_roof - H_col; const halfSpan = L / 2;
        const rafterAngle = Math.atan(roofRise / halfSpan);
        const rDepth = 0.5, rWidth = 0.25;
        
        // Accurate End Plate gaps
        const apexPlateThick = 0.02;
        const kneePlateThick = 0.02;
        const rafterMeshLength = Math.sqrt(halfSpan*halfSpan + roofRise*roofRise) - (apexPlateThick / Math.cos(rafterAngle)) - (kneePlateThick / Math.cos(rafterAngle));
        const rafterGeom = createIBeamGeometry(rDepth, rWidth, 0.01, 0.014, rafterMeshLength);
        
        const purlinSpacing = Number(inputs.purlinSpacing) || 1.2;
        const numPurlins = Math.floor((Math.sqrt(halfSpan*halfSpan + roofRise*roofRise)) / purlinSpacing) + 1;
        const purlinGeom = createZBeamGeometry(0.2, 0.07, 0.005, B_total);

        // Connection Details Geometries
        const basePlateGeom = new THREE.BoxGeometry(cDepth + 0.2, 0.04, cWidth + 0.2);
        const baseStiffenerGeom = new THREE.BoxGeometry(0.01, 0.15, 0.1);
        const kneePlateGeom = new THREE.BoxGeometry(0.02, rDepth + 0.6, rWidth + 0.04);
        const apexPlateGeom = new THREE.BoxGeometry(0.04, rDepth + 0.1, rWidth + 0.02);
        const purlinCleatGeom = new THREE.BoxGeometry(0.06, 0.15, 0.08); // Bọ xà gồ
        const gussetGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.01, 8); // Bản mã giằng

        const foundationGeom = new THREE.BoxGeometry(1.5, 1.2, 1.5);
        const foundationMat = new THREE.MeshStandardMaterial({ color: isDark ? 0x475569 : 0xcbd5e1, roughness: 0.9 }); 
        const boltGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6);

        const skeletonGroup = new THREE.Group();
        const numFrames = Math.max(2, Math.round(B_total / B_step) + 1);
        const actualStep = B_total / (numFrames - 1);
        const gridMat = new THREE.LineDashedMaterial({ color: isDark ? 0xef4444 : 0xdc2626, dashSize: 0.5, gapSize: 0.5 });
        const haunchLength = Math.min(L * 0.1, 3.0);
        const haunchDepth = rDepth * 0.8;

        const nodes = {}; const members = [];
        const addNode = (id, x, y, z) => { nodes[id] = new THREE.Vector3(x, y, z); };
        
        const dy = rDepth / 2 / Math.cos(rafterAngle); 
        const dx_apex = apexPlateThick; const dy_apex = dx_apex * Math.tan(rafterAngle);
        const dx_knee = cDepth/2 + kneePlateThick; const dy_knee = dx_knee * Math.tan(rafterAngle);

        for (let i = 0; i < numFrames; i++) {
            const z = -B_total/2 + i * actualStep;
            const pf = `F${i}`;
            
            addNode(`${pf}_BaseL`, -L/2, 0, z); addNode(`${pf}_BaseR`, L/2, 0, z);
            addNode(`${pf}_ColTopL`, -L/2, H_col, z); addNode(`${pf}_ColTopR`, L/2, H_col, z);
            
            // Nodes account for end plates
            addNode(`${pf}_RafStartL`, -L/2 + dx_knee, H_col + dy + dy_knee, z); 
            addNode(`${pf}_RafEndL`, -dx_apex, H_roof + dy - dy_apex, z);
            addNode(`${pf}_RafStartR`, L/2 - dx_knee, H_col + dy + dy_knee, z); 
            addNode(`${pf}_RafEndR`, dx_apex, H_roof + dy - dy_apex, z);
            addNode(`${pf}_Apex`, 0, H_roof + dy - rDepth/2, z);
            
            members.push({ id: `${pf}_ColL`, type: 'column', start: `${pf}_BaseL`, end: `${pf}_ColTopL`, up: new THREE.Vector3(-1,0,0) });
            members.push({ id: `${pf}_ColR`, type: 'column', start: `${pf}_BaseR`, end: `${pf}_ColTopR`, up: new THREE.Vector3(1,0,0) });
            members.push({ id: `${pf}_RafL`, type: 'rafter', start: `${pf}_RafStartL`, end: `${pf}_RafEndL`, up: new THREE.Vector3(0,1,0) });
            members.push({ id: `${pf}_RafR`, type: 'rafter', start: `${pf}_RafStartR`, end: `${pf}_RafEndR`, up: new THREE.Vector3(0,1,0) });
        }

        // Purlins & Girts
        for(let j=0; j<2; j++) {
            const sign = j===0 ? -1 : 1; const side = j===0 ? 'L' : 'R';
            for(let p=0; p<numPurlins; p++) {
                const ratio = p / (numPurlins - 1);
                const px = sign * L/2 * (1 - ratio);
                const py = H_col + roofRise * ratio;
                addNode(`Purlin_Roof_${side}_${p}_Start`, px, py + dy + 0.1, -B_total/2);
                addNode(`Purlin_Roof_${side}_${p}_End`, px, py + dy + 0.1, B_total/2);
                const nx = sign * Math.sin(rafterAngle); const ny = Math.cos(rafterAngle);
                members.push({ id: `Purlin_Roof_${side}_${p}`, type: 'purlin', start: `Purlin_Roof_${side}_${p}_Start`, end: `Purlin_Roof_${side}_${p}_End`, up: new THREE.Vector3(nx, ny, 0) });
            }
            const numGirts = Math.floor(H_col / purlinSpacing);
            const gx = sign * (L/2 + cDepth/2 + 0.1); 
            for(let g=1; g<=numGirts; g++) {
                const gy = g * purlinSpacing; if (gy >= H_col - 0.2) continue; 
                addNode(`Purlin_Wall_${side}_${g}_Start`, gx, gy, -B_total/2); addNode(`Purlin_Wall_${side}_${g}_End`, gx, gy, B_total/2);
                members.push({ id: `Purlin_Wall_${side}_${g}`, type: 'purlin', start: `Purlin_Wall_${side}_${g}_Start`, end: `Purlin_Wall_${side}_${g}_End`, up: new THREE.Vector3(sign, 0, 0) });
            }
        }

        const numBraces = 2;
        for (let idx=0; idx<numBraces; idx++) {
            const i = idx === 0 ? 0 : numFrames - 2;
            const pf1 = `F${i}`; const pf2 = `F${i+1}`;
            members.push({ id: `Brace_${pf1}_L_Up`, type: 'brace', start: `${pf1}_BaseL`, end: `${pf2}_ColTopL`, up: new THREE.Vector3(1,0,0) });
            members.push({ id: `Brace_${pf1}_L_Dn`, type: 'brace', start: `${pf1}_ColTopL`, end: `${pf2}_BaseL`, up: new THREE.Vector3(1,0,0) });
            members.push({ id: `Brace_${pf1}_R_Up`, type: 'brace', start: `${pf1}_BaseR`, end: `${pf2}_ColTopR`, up: new THREE.Vector3(1,0,0) });
            members.push({ id: `Brace_${pf1}_R_Dn`, type: 'brace', start: `${pf1}_ColTopR`, end: `${pf2}_BaseR`, up: new THREE.Vector3(1,0,0) });
        }

        const braceGeom = new THREE.CylinderGeometry(0.015, 0.015, Math.sqrt(actualStep*actualStep + H_col*H_col));
        braceGeom.rotateX(Math.PI/2); const braceMat = new THREE.MeshStandardMaterial({ color: isDark ? 0x94a3b8 : 0x64748b });

        members.forEach(member => {
            const p1 = nodes[member.start]; const p2 = nodes[member.end];
            if (!p1 || !p2) return;
            let mesh;
            if (member.type === 'column') mesh = new THREE.Mesh(colGeom, steelMat);
            else if (member.type === 'rafter') mesh = new THREE.Mesh(rafterGeom, steelMat);
            else if (member.type === 'purlin') mesh = new THREE.Mesh(purlinGeom, purlinMat);
            else if (member.type === 'brace') mesh = new THREE.Mesh(braceGeom, braceMat);
            if (mesh) { placeBeam(mesh, p1, p2, member.up); mesh.castShadow = true; mesh.receiveShadow = true; skeletonGroup.add(mesh); }
        });

        // DETAILED CONNECTIONS
        for (let i = 0; i < numFrames; i++) {
            const pf = `F${i}`;
            const z = nodes[`${pf}_BaseL`].z;
            
            // Foundation & Base Plate
            const fL = new THREE.Mesh(foundationGeom, foundationMat); fL.position.copy(nodes[`${pf}_BaseL`]).add(new THREE.Vector3(0, -0.6, 0)); skeletonGroup.add(fL);
            const fR = new THREE.Mesh(foundationGeom, foundationMat); fR.position.copy(nodes[`${pf}_BaseR`]).add(new THREE.Vector3(0, -0.6, 0)); skeletonGroup.add(fR);

            const baseL = new THREE.Mesh(basePlateGeom, jointMat); baseL.position.copy(nodes[`${pf}_BaseL`]).add(new THREE.Vector3(0, 0.02, 0)); skeletonGroup.add(baseL);
            const baseR = new THREE.Mesh(basePlateGeom, jointMat); baseR.position.copy(nodes[`${pf}_BaseR`]).add(new THREE.Vector3(0, 0.02, 0)); skeletonGroup.add(baseR);

            // Apex Splice Plate
            const apex = new THREE.Mesh(apexPlateGeom, jointMat); apex.position.copy(nodes[`${pf}_Apex`]); skeletonGroup.add(apex);

            // Knee End Plates
            const kneePlateL = new THREE.Mesh(kneePlateGeom, jointMat);
            kneePlateL.position.set(-L/2 + cDepth/2 + 0.01, H_col + dy - rDepth/2, z);
            skeletonGroup.add(kneePlateL);
            const kneePlateR = new THREE.Mesh(kneePlateGeom, jointMat);
            kneePlateR.position.set(L/2 - cDepth/2 - 0.01, H_col + dy - rDepth/2, z);
            skeletonGroup.add(kneePlateR);

            // Knee Haunches with Stiffeners
            const buildHaunch = (isLeft) => {
                const sign = isLeft ? 1 : -1;
                const startX = (isLeft ? -L/2 : L/2) + sign * cDepth/2;
                const endX = startX + sign * haunchLength;
                const startY_top = H_col + (cDepth/2) * Math.tan(rafterAngle);
                const endY = H_col + (cDepth/2 + haunchLength) * Math.tan(rafterAngle);
                const startY_bot = startY_top - haunchDepth;

                const shape = new THREE.Shape(); shape.moveTo(startX, startY_top); shape.lineTo(endX, endY); shape.lineTo(startX, startY_bot); shape.lineTo(startX, startY_top);
                const web = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: false }), steelMat);
                web.position.set(0, 0, z - 0.005); skeletonGroup.add(web);
                
                const flDist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY_bot, 2));
                const fl = new THREE.Mesh(new THREE.BoxGeometry(rWidth, 0.014, flDist), steelMat);
                placeBeam(fl, new THREE.Vector3(startX, startY_bot, z), new THREE.Vector3(endX, endY, z), new THREE.Vector3(0, 1, 0));
                skeletonGroup.add(fl);
            };
            buildHaunch(true); buildHaunch(false);

            // Purlin Cleats (Bọ xà gồ) - Frame Intersections
            for(let j=0; j<2; j++) {
                const sign = j===0 ? -1 : 1;
                for(let p=0; p<numPurlins; p++) {
                    const ratio = p / (numPurlins - 1);
                    const px = sign * L/2 * (1 - ratio); const py = H_col + roofRise * ratio;
                    const cleat = new THREE.Mesh(purlinCleatGeom, jointMat);
                    cleat.position.set(px, py + dy + 0.04, z - 0.04);
                    cleat.rotation.z = -sign * rafterAngle;
                    skeletonGroup.add(cleat);
                }
            }
        }
        buildingGroup.add(skeletonGroup);

        // Cladding Surfaces
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
        createQuad(R0, C1, C2, R1, 'roof', currentDir==='+X'?roofLeeward:roofWindward); 

        // CFD AERODYNAMIC WIND ENGINE (MASSIVE UPGRADE)
        const windElements = [];
        let targetX = null, targetZ = null;
        let startX = null, startZ = null;

        if (mode === 'wind') {
            const arrowDir = new THREE.Vector3(currentDir.includes('X') ? (currentDir.includes('+') ? 1 : -1) : 0, 0, currentDir.includes('Y') ? (currentDir.includes('+') ? -1 : 1) : 0);
            const windGroup = new THREE.Group();
            
            if (currentDir === '+X') { targetX = xMin; startX = xMin - 40; } 
            else if (currentDir === '-X') { targetX = xMax; startX = xMax + 40; } 
            else if (currentDir === '+Y') { targetZ = zMin; startZ = zMin - 40; } 
            else if (currentDir === '-Y') { targetZ = zMax; startZ = zMax + 40; }

            if (windAnimMode === 'static') {
                const numArrows = Math.max(4, Math.floor(maxDim / 8));
                for(let i=0; i<numArrows; i++) {
                    for(let j=0; j<4; j++) { 
                        const ratio = (i + 0.5) / numArrows;
                        let ax = currentDir.includes('X') ? startX + 25 * arrowDir.x : -L/2 + L * ratio;
                        let az = currentDir.includes('Y') ? startZ + 25 * arrowDir.z : -B_total/2 + B_total * ratio;
                        const ah = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(ax, H_col * (0.2 + j*0.3), az), 12, isDark ? 0x38bdf8 : 0x0284c7, 3, 1.5);
                        windGroup.add(ah);
                    }
                }
            } else {
                // CFD Streamlines
                const streakCount = 300; // Very dense
                const streakGeom = new THREE.CylinderGeometry(0.08, 0.08, 6.0, 6); // THICK and LONG glowing bands
                streakGeom.rotateX(Math.PI/2);
                const streakMat = new THREE.MeshBasicMaterial({ color: isDark ? 0x22d3ee : 0x06b6d4, transparent: true, opacity: 0.9 }); // Bright Cyan

                for(let i=0; i<streakCount; i++) {
                    const mesh = new THREE.Mesh(streakGeom, streakMat);
                    let px = currentDir.includes('X') ? startX : -L/2 - 10 + Math.random() * (L + 20);
                    let pz = currentDir.includes('X') ? -B_total/2 - 10 + Math.random() * (B_total + 20) : startZ;
                    let py = Math.random() * (H_roof + 10); // Spawn higher to flow over roof
                    
                    mesh.position.set(px, py, pz);
                    mesh.userData = { 
                        origin: new THREE.Vector3(px, py, pz),
                        speed: 0.4 + Math.random() * 0.3, // Fast flow
                        life: Math.random() * 100 // Randomized start phase
                    };
                    windGroup.add(mesh);
                    windElements.push(mesh);
                }
            }
            scene.add(windGroup);
        }

        const grid = new THREE.GridHelper(maxDim * 4, 80, isDark ? 0x334155 : 0xcbd5e1, isDark ? 0x1e293b : 0xe2e8f0);
        grid.position.y = -0.01; scene.add(grid);
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(maxDim * 5, maxDim * 5), new THREE.MeshStandardMaterial({ color: bgColor, depthWrite: false, roughness: 1, metalness: 0 }));
        ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);

        // Vector Field Deflection Function (CFD Logic)
        const getDeflection = (pos, dir) => {
            let v = dir.clone();
            // Stagnation Plane Center
            let cx = 0, cy = H_col/2, cz = 0;
            if (dir.x > 0) cx = xMin; if (dir.x < 0) cx = xMax;
            if (dir.z > 0) cz = zMin; if (dir.z < 0) cz = zMax;
            
            let distToWall = 999;
            if (dir.x !== 0 && pos.y < H_roof && pos.z > zMin && pos.z < zMax) distToWall = Math.abs(pos.x - cx);
            if (dir.z !== 0 && pos.y < H_roof && pos.x > xMin && pos.x < xMax) distToWall = Math.abs(pos.z - cz);

            // Aerodynamic Cushion (starts deflecting 15m away)
            if (distToWall < 15) {
                let force = 2.0 / (distToWall * 0.2 + 1.0); // Smooth exponential repulsion
                let defY = (pos.y > cy) ? force : force * 0.2; // Push up over roof
                let defZ = (pos.z > 0) ? force : -force; // Push around sides
                let defX = (pos.x > 0) ? force : -force;
                
                if (dir.x !== 0) v.add(new THREE.Vector3(0, defY, defZ));
                if (dir.z !== 0) v.add(new THREE.Vector3(defX, defY, 0));
            }
            return v.normalize();
        };

        const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
        const onMouseClick = (event) => {
            if(!showCladding || mode !== 'wind') return;
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactableMeshes);
            if (intersects.length > 0) setSelectedZone(intersects[0].object.userData);
            else setSelectedZone(null);
        };
        renderer.domElement.addEventListener('click', onMouseClick);

        let animationFrameId;
        const renderLoop = () => {
            controls.update();
            
            if (windAnimMode === 'dynamic' && windElements.length > 0) {
                const arrowDir = new THREE.Vector3(currentDir.includes('X') ? (currentDir.includes('+') ? 1 : -1) : 0, 0, currentDir.includes('Y') ? (currentDir.includes('+') ? -1 : 1) : 0);

                windElements.forEach(mesh => {
                    const prevPos = mesh.position.clone();
                    mesh.userData.life += mesh.userData.speed;
                    
                    // Deflect path using CFD logic
                    let flowVec = getDeflection(mesh.position, arrowDir);
                    mesh.position.addScaledVector(flowVec, mesh.userData.speed);
                    
                    // Boundary reset (if it flows past the building)
                    let reset = false;
                    if (currentDir === '+X' && mesh.position.x > xMax + 30) reset = true;
                    if (currentDir === '-X' && mesh.position.x < xMin - 30) reset = true;
                    if (currentDir === '+Y' && mesh.position.z > zMax + 30) reset = true;
                    if (currentDir === '-Y' && mesh.position.z < zMin - 30) reset = true;
                    
                    if (reset || mesh.userData.life > 200) {
                        mesh.position.copy(mesh.userData.origin);
                        mesh.userData.life = 0;
                    }

                    // LookAt tangent path
                    const moveDelta = mesh.position.clone().sub(prevPos);
                    if (moveDelta.lengthSq() > 0.0001) {
                        mesh.lookAt(mesh.position.clone().add(moveDelta));
                    }

                    // Fade in/out to prevent popping
                    let scale = 1.0;
                    if (mesh.userData.life < 10) scale = mesh.userData.life / 10;
                    if (mesh.userData.life > 190) scale = (200 - mesh.userData.life) / 10;
                    mesh.scale.set(scale, scale, scale); // Scale uniformly for fluid look
                });
            }

            renderer.render(scene, camera);
            animationFrameId = requestAnimationFrame(renderLoop);
        };
        renderLoop();

        const resizeObserver = new ResizeObserver(() => {
            if (!mountRef.current) return;
            const w = mountRef.current.clientWidth; const h = mountRef.current.clientHeight;
            if (w === 0 || h === 0) return;
            camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
        });
        resizeObserver.observe(mountRef.current);

        return () => {
            resizeObserver.disconnect();
            if (renderer && renderer.domElement) renderer.domElement.removeEventListener('click', onMouseClick);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            cameraStateRef.current.position = camera.position.clone();
            cameraStateRef.current.target = controls.target.clone();
        };
    }, [inputs, caseData, currentDir, showCladding, mode, theme, windAnimMode]);

    useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, [mode, currentDir, showCladding, isFullscreen, theme, windAnimMode]);

    const windDirs = ['+X', '-X', '+Y', '-Y'];
    const toggleFullscreen = () => { if (!document.fullscreenElement) { containerRef.current.requestFullscreen().catch(err => console.log(err)); setIsFullscreen(true); } else { document.exitFullscreen(); setIsFullscreen(false); } };

    const isGeometry = mode === 'geometry'; const isDark = theme === 'dark';
    const uiBg = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"; const textCol = isDark ? "text-slate-200" : "text-slate-800";
    const hudBg = isDark ? "bg-slate-900/80 border-slate-700/50" : "bg-white/90 border-slate-200/80"; const hudText = isDark ? "text-slate-300" : "text-slate-600";
    const btnBg = isDark ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900";

    return (
        <div ref={containerRef} className={`flex flex-col gap-3 ${isFullscreen ? (isDark ? 'bg-[#0b1121]' : 'bg-slate-50') + ' p-6 h-screen w-screen z-50 fixed inset-0' : ''}`}>
            <div className={`flex flex-wrap items-center justify-between p-3 rounded-xl border shadow-sm z-10 ${uiBg}`}>
                <div className="flex flex-wrap items-center gap-4">
                    <span className={`font-bold ${textCol}`}>{mode === 'wind' ? 'Phân tích Tải trọng Gió 3D' : 'Mô hình Kết cấu 3D (Node-Based)'}</span>
                    {mode === 'wind' && (
                        <>
                            <div className={`flex rounded-lg p-1 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                                {windDirs.map(d => (
                                    <button key={d} onClick={() => setCurrentDir(d)} className={`px-3 py-1 text-sm rounded-md transition-all font-semibold ${currentDir === d ? 'bg-blue-600 shadow text-white' : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')}`}>Hướng {d}</button>
                                ))}
                            </div>
                            <div className={`flex rounded-lg p-1 border ml-2 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                                <button onClick={() => setWindAnimMode('static')} className={`px-3 py-1 text-sm rounded-md transition-all font-semibold ${windAnimMode === 'static' ? 'bg-blue-600 shadow text-white' : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')}`}>Gió Tĩnh</button>
                                <button onClick={() => setWindAnimMode('dynamic')} className={`px-3 py-1 text-sm rounded-md transition-all font-semibold ${windAnimMode === 'dynamic' ? 'bg-blue-600 shadow text-white' : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')}`}>Luồng Gió Khí Động Học</button>
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className={`p-2 rounded-lg border transition-colors ${btnBg}`}><i data-lucide={isDark ? "sun" : "moon"} className="w-4 h-4"></i></button>
                    <button onClick={() => setShowCladding(!showCladding)} className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${showCladding ? 'bg-blue-600 text-white border-blue-700 shadow-inner' : btnBg}`}>{showCladding ? 'Ẩn lớp Bao che' : 'Hiện lớp Bao che'}</button>
                    <button onClick={toggleFullscreen} className={`p-2 rounded-lg border transition-colors ${btnBg}`}><i data-lucide={isFullscreen ? "minimize" : "maximize"} className="w-4 h-4"></i></button>
                </div>
            </div>

            <div className={`relative w-full ${isDark ? (isGeometry ? 'bg-[#0b1121]' : 'bg-slate-900') : 'bg-slate-50'} border ${isDark ? 'border-slate-800' : 'border-slate-200'} rounded-xl overflow-hidden shadow-inner ${isFullscreen ? 'flex-1' : 'h-[650px]'}`}>
                <div ref={mountRef} className="absolute inset-0" />
                <div className="absolute top-4 left-4 pointer-events-none">
                    <div className={`${hudBg} backdrop-blur-md p-4 rounded-lg shadow-lg border`}>
                        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'} flex items-center gap-2 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'} pb-2 mb-2`}>
                            {mode === 'wind' ? (<><i data-lucide="wind" className="text-blue-500 w-5 h-5"></i> Gió {currentDir}</>) : (<><i data-lucide="box" className="text-blue-500 w-5 h-5"></i> Hình học Tổng thể</>)}
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
                </div>
                {mode === 'wind' && selectedZone && showCladding && (
                    <div className={`absolute bottom-4 left-4 ${isDark ? 'bg-slate-900/95 text-slate-200 border-blue-500/30' : 'bg-white/95 text-slate-700 border-blue-400'} backdrop-blur p-4 rounded-xl shadow-2xl border w-64 text-sm z-10 animate-fade-in`}>
                        <h4 className={`font-bold border-b ${isDark ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'} pb-2 mb-3 flex justify-between items-center`}>
                            <span>Vùng {selectedZone.zone}</span>
                            <span className="text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-500/50 px-2 py-0.5 rounded-full">{selectedZone.surface}</span>
                        </h4>
                        <div className={`flex justify-between py-1.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Hệ số c_e:</span><span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{selectedZone.ce > 0 ? '+' : ''}{selectedZone.ce}</span></div>
                        <div className={`flex justify-between py-1.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}><span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Giá trị w_d:</span><span className={`font-mono font-bold ${selectedZone.pressure_d > 0 ? 'text-red-500' : 'text-blue-500'}`}>{selectedZone.pressure_d.toFixed(2)} kN/m²</span></div>
                    </div>
                )}
            </div>
        </div>
    );
}

window.Building3DViewer = Building3DViewer;
