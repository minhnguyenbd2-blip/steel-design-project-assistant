const { useRef, useEffect, useState, useMemo } = React;

function Wind3DViewer({ geom, loadCases, defaultDir = '+X' }) {
    const mountRef = useRef(null);
    const [selectedZone, setSelectedZone] = useState(null);
    const [currentDir, setCurrentDir] = useState(defaultDir);
    const [showCladding, setShowCladding] = useState(true);
    
    // Safety check
    if (!geom || !loadCases || !window.THREE) {
        return <div className="p-4 text-center text-slate-500">Đang tải 3D Engine hoặc thiếu dữ liệu...</div>;
    }

    const caseData = loadCases[currentDir];

    useEffect(() => {
        if (!mountRef.current || !caseData) return;
        
        // Cleanup previous
        while(mountRef.current.firstChild) {
            mountRef.current.removeChild(mountRef.current.firstChild);
        }

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf1f5f9);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        // Enable shadows
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mountRef.current.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        scene.add(dirLight);
        
        // Geometry specs
        const L = Number(geom.L) || 25;
        const B_total = Number(geom.d_total) || Number(geom.length) || 72; // length of building
        const B_step = Number(geom.B) || 6;
        const H_col = Number(geom.H_col) || Number(geom.H_column) || 8;
        const H_roof = Number(geom.H_rf) || Number(geom.H_roof) || 9.25;
        
        if (isNaN(L) || isNaN(B_total) || isNaN(H_col) || isNaN(H_roof)) {
            console.error('Wind3DViewer: Invalid geometry parameters', { L, B_total, H_col, H_roof });
            return;
        }

        const buildingGroup = new THREE.Group();
        scene.add(buildingGroup);

        // Materials
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 });
        const purlinMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.3, roughness: 0.6 });
        const wallMat = new THREE.MeshPhysicalMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.3, side: THREE.DoubleSide, clearcoat: 0.5 });
        const roofMat = new THREE.MeshPhysicalMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.4, side: THREE.DoubleSide, clearcoat: 0.8 });
        const wireMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 1 });
        
        const interactableMeshes = [];

        // 1. BUILD STEEL SKELETON
        const skeletonGroup = new THREE.Group();
        const numFrames = Math.max(2, Math.round(B_total / B_step) + 1);
        const actualStep = B_total / (numFrames - 1);
        
        const colSize = 0.4; // 400mm approx
        const beamSize = 0.3; // 300mm approx
        const colGeom = new THREE.BoxGeometry(colSize, H_col, colSize);
        // Rafter length
        const roofRise = H_roof - H_col;
        const halfSpan = L / 2;
        const rafterLength = Math.sqrt(halfSpan*halfSpan + roofRise*roofRise);
        const rafterGeom = new THREE.BoxGeometry(rafterLength, beamSize, colSize);
        const rafterAngle = Math.atan(roofRise / halfSpan);

        for (let i = 0; i < numFrames; i++) {
            const zPos = -B_total/2 + i * actualStep;
            
            // Left Column
            const colL = new THREE.Mesh(colGeom, steelMat);
            colL.position.set(-L/2, H_col/2, zPos);
            colL.castShadow = true; colL.receiveShadow = true;
            skeletonGroup.add(colL);
            
            // Right Column
            const colR = new THREE.Mesh(colGeom, steelMat);
            colR.position.set(L/2, H_col/2, zPos);
            colR.castShadow = true; colR.receiveShadow = true;
            skeletonGroup.add(colR);
            
            // Left Rafter
            const rafL = new THREE.Mesh(rafterGeom, steelMat);
            rafL.position.set(-L/4, H_col + roofRise/2, zPos);
            rafL.rotation.z = rafterAngle;
            rafL.castShadow = true; rafL.receiveShadow = true;
            skeletonGroup.add(rafL);
            
            // Right Rafter
            const rafR = new THREE.Mesh(rafterGeom, steelMat);
            rafR.position.set(L/4, H_col + roofRise/2, zPos);
            rafR.rotation.z = -rafterAngle;
            rafR.castShadow = true; rafR.receiveShadow = true;
            skeletonGroup.add(rafR);
        }

        // Purlins
        const numPurlins = 6; // per side
        const purlinGeom = new THREE.BoxGeometry(0.1, 0.15, B_total);
        for(let j=0; j<2; j++) {
            const sign = j===0 ? -1 : 1;
            for(let p=1; p<=numPurlins; p++) {
                const ratio = p / numPurlins;
                const px = sign * L/2 * (1 - ratio);
                const py = H_col + roofRise * ratio;
                const purlin = new THREE.Mesh(purlinGeom, purlinMat);
                purlin.position.set(px, py + 0.1, 0);
                purlin.rotation.z = sign * rafterAngle;
                purlin.castShadow = true; purlin.receiveShadow = true;
                skeletonGroup.add(purlin);
            }
        }
        buildingGroup.add(skeletonGroup);

        // 2. BUILD CLADDING (TÔN)
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
                // Color mapping: red for pressure (+), blue for suction (-)
                if (zoneData.c_net > 0) mat.color.setHex(0xfca5a5); // red
                else mat.color.setHex(0x93c5fd); // blue
                mat.opacity = 0.7; // make zones more visible
            }

            const mesh = new THREE.Mesh(geometry, mat);
            if (zoneData) {
                mesh.userData = zoneData;
                interactableMeshes.push(mesh);
            }
            mesh.visible = showCladding;
            buildingGroup.add(mesh);

            const edges = new THREE.EdgesGeometry(geometry);
            const line = new THREE.LineSegments(edges, wireMat);
            line.visible = showCladding;
            buildingGroup.add(line);
            
            return mesh;
        }

        const xMin = -L/2, xMax = L/2;
        const zMin = -B_total/2, zMax = B_total/2;
        const y0 = 0, yCol = H_col, yRoof = H_roof;

        const N0 = [xMin, y0, zMax];
        const N1 = [xMax, y0, zMax];
        const N2 = [xMax, y0, zMin];
        const N3 = [xMin, y0, zMin];

        const C0 = [xMin, yCol, zMax];
        const C1 = [xMax, yCol, zMax];
        const C2 = [xMax, yCol, zMin];
        const C3 = [xMin, yCol, zMin];

        const R0 = [0, yRoof, zMax];
        const R1 = [0, yRoof, zMin];

        // Fetch zone data
        const zones = caseData.surfaces || [];
        // Map zones to walls/roofs generically for visualization
        let windwardZone, leewardZone, sideZone, roofWindward, roofLeeward;
        if (currentDir.includes('X')) {
            windwardZone = zones.find(z => z.surface === 'A' || z.zone === 'A');
            leewardZone = zones.find(z => z.surface === 'B' || z.zone === 'B');
            sideZone = zones.find(z => z.surface === 'C' || z.zone === 'C');
            const sign = currentDir.includes('+') ? 1 : -1;
            // Roof F, G, H, I, J logic
            roofWindward = zones.find(z => z.zone === 'F' || z.zone === 'G' || z.zone === 'H');
            roofLeeward = zones.find(z => z.zone === 'I' || z.zone === 'J');
        }

        // Generic quads for now
        const w1 = createQuad(N0, N1, C1, C0, 'wall', sideZone); // Front (+Z)
        const w2 = createQuad(N1, N2, C2, C1, 'wall', currentDir==='+X'?leewardZone:windwardZone); // Right (+X)
        const w3 = createQuad(N2, N3, C3, C2, 'wall', sideZone); // Back (-Z)
        const w4 = createQuad(N3, N0, C0, C3, 'wall', currentDir==='+X'?windwardZone:leewardZone); // Left (-X)

        const r1 = createQuad(C0, R0, R1, C3, 'roof', currentDir==='+X'?roofWindward:roofLeeward); // Left Roof
        const r2 = createQuad(R0, C1, C2, R1, 'roof', currentDir==='+X'?roofLeeward:roofWindward); // Right Roof

        // 3. WIND ARROWS (MÔ PHỎNG GIÓ)
        const maxDim = Math.max(L, B_total, H_roof);
        const arrowDir = new THREE.Vector3(
            currentDir.includes('X') ? (currentDir.includes('+') ? 1 : -1) : 0, 
            0, 
            currentDir.includes('Y') ? (currentDir.includes('+') ? -1 : 1) : 0
        );
        
        // Draw multiple wind arrows hitting the windward face
        const numArrows = 5;
        const arrowGroup = new THREE.Group();
        for(let i=0; i<numArrows; i++) {
            const ratio = (i + 1) / (numArrows + 1);
            let ax, az;
            if(currentDir.includes('X')) {
                ax = arrowDir.x * -(L/2 + 10); // 10m away
                az = -B_total/2 + B_total * ratio;
            } else {
                az = arrowDir.z * -(B_total/2 + 10);
                ax = -L/2 + L * ratio;
            }
            const pos = new THREE.Vector3(ax, H_col * 0.7, az);
            const ah = new THREE.ArrowHelper(arrowDir, pos, 10, 0x0ea5e9, 2, 1);
            arrowGroup.add(ah);
        }
        scene.add(arrowGroup);

        // Adjust camera
        camera.position.set(maxDim * 1.2, maxDim * 0.8, maxDim * 1.2);
        camera.lookAt(0, H_col/2, 0);

        // Grid & Ground
        const grid = new THREE.GridHelper(maxDim * 3, 30, 0x94a3b8, 0xe2e8f0);
        scene.add(grid);
        
        const groundGeo = new THREE.PlaneGeometry(maxDim * 3, maxDim * 3);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, depthWrite: false });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Raycaster for clicking zones
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const onMouseClick = (event) => {
            if(!showCladding) return;
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactableMeshes);
            if (intersects.length > 0) {
                setSelectedZone(intersects[0].object.userData);
            } else {
                setSelectedZone(null);
            }
        };
        renderer.domElement.addEventListener('click', onMouseClick);

        // Animation Loop
        let animationFrameId;
        const renderLoop = () => {
            controls.update();
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
            if (renderer && renderer.domElement) {
                renderer.domElement.removeEventListener('click', onMouseClick);
            }
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            if(mountRef.current) mountRef.current.innerHTML = '';
        };
    }, [geom, caseData, currentDir, showCladding]);

    const windDirs = ['+X', '-X', '+Y', '-Y'];

    return (
        <div className="flex flex-col gap-3">
            {/* Control Panel */}
            <div className="flex flex-wrap items-center justify-between bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-600">Hướng gió:</span>
                    <div className="flex bg-slate-100 rounded p-1">
                        {windDirs.map(d => (
                            <button 
                                key={d}
                                onClick={() => setCurrentDir(d)}
                                className={\px-3 py-1 text-sm rounded transition-colors \\}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowCladding(!showCladding)}
                        className={\px-3 py-1.5 text-sm rounded border transition-colors \\}
                    >
                        {showCladding ? 'Ẩn lớp Tôn (Hiện khung)' : 'Hiện lớp Tôn & Vùng gió'}
                    </button>
                </div>
            </div>

            <div className="relative w-full h-[600px] bg-slate-50 border rounded-xl overflow-hidden shadow-inner">
                <div ref={mountRef} className="absolute inset-0" />
                
                <div className="absolute top-4 left-4 pointer-events-none">
                    <h3 className="font-bold text-slate-800 bg-white/90 p-2 rounded shadow border backdrop-blur">
                        Mô phỏng Gió 3D - Trường hợp {currentDir}
                    </h3>
                </div>
                
                <div className="absolute bottom-4 right-4 text-xs text-slate-500 bg-white/80 p-2 rounded shadow backdrop-blur border">
                    Sử dụng chuột: Xoay (Trái), Zoom (Cuộn), Di chuyển (Phải)
                    <br/>
                    {showCladding && <span className="text-blue-500 font-semibold">Click vào tường/mái để xem Áp lực</span>}
                </div>
                
                {selectedZone && showCladding && (
                    <div className="absolute bottom-4 left-4 bg-white p-4 rounded-xl shadow-xl border border-blue-100 w-64 text-sm z-10 animate-fade-in">
                        <h4 className="font-bold border-b pb-2 mb-2 text-blue-800">Vùng {selectedZone.zone}</h4>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-slate-500">Bề mặt:</span>
                            <span className="font-semibold">{selectedZone.surface}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-slate-500">c_e (Khí động):</span>
                            <span className="font-mono font-bold text-slate-700">{selectedZone.ce > 0 ? '+' : ''}{selectedZone.ce}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                            <span className="text-slate-500">Áp lực (w_d):</span>
                            <span className={\ont-mono font-bold \\}>
                                {selectedZone.pressure_d.toFixed(2)} kN/m²
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

window.Wind3DViewer = Wind3DViewer;