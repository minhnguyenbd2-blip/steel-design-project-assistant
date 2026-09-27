const { useRef, useEffect, useState, useMemo } = React;

function createIBeamGeometry(height, width, tw, tf, length) {
    const shape = new THREE.Shape();
    shape.moveTo(-width/2, -height/2);
    shape.lineTo(width/2, -height/2);
    shape.lineTo(width/2, -height/2 + tf);
    shape.lineTo(tw/2, -height/2 + tf);
    shape.lineTo(tw/2, height/2 - tf);
    shape.lineTo(width/2, height/2 - tf);
    shape.lineTo(width/2, height/2);
    shape.lineTo(-width/2, height/2);
    shape.lineTo(-width/2, height/2 - tf);
    shape.lineTo(-tw/2, height/2 - tf);
    shape.lineTo(-tw/2, -height/2 + tf);
    shape.lineTo(-width/2, -height/2 + tf);
    shape.lineTo(-width/2, -height/2);
    
    const extrudeSettings = { depth: length, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    return geometry;
}

function createZBeamGeometry(height, width, t, length) {
    const shape = new THREE.Shape();
    shape.moveTo(-width/2, -height/2);
    shape.lineTo(width/2, -height/2);
    shape.lineTo(width/2, -height/2 + t);
    shape.lineTo(-width/2 + t, -height/2 + t);
    shape.lineTo(-width/2 + t, height/2 - t);
    shape.lineTo(width/2, height/2 - t);
    shape.lineTo(width/2, height/2);
    shape.lineTo(-width/2, height/2);
    shape.lineTo(-width/2, -height/2);

    const extrudeSettings = { depth: length, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    return geometry;
}

function Building3DViewer({ inputs, mode = 'geometry', loadCases, defaultDir = '+X' }) {
    const mountRef = useRef(null);
    const [selectedZone, setSelectedZone] = useState(null);
    const [currentDir, setCurrentDir] = useState(defaultDir);
    const [showCladding, setShowCladding] = useState(mode === 'wind');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef(null);

    // Parse geometry
    const L = Number(inputs.L) || 25;
    const B_step = Number(inputs.B) || 6;
    const B_total = Number(inputs.length) || 72;
    const H_col = Number(inputs.H_column) || 8;
    const H_roof = Number(inputs.H_roof) || 9.25;

    const caseData = mode === 'wind' && loadCases ? loadCases[currentDir] : null;

    useEffect(() => {
        if (!mountRef.current || !window.THREE) return;
        
        while(mountRef.current.firstChild) {
            mountRef.current.removeChild(mountRef.current.firstChild);
        }

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc);
        scene.fog = new THREE.Fog(0xf8fafc, 50, 300);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mountRef.current.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Lighting (Studio setup)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 150, 100);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.left = -60;
        dirLight.shadow.camera.right = 60;
        dirLight.shadow.camera.top = 60;
        dirLight.shadow.camera.bottom = -60;
        dirLight.shadow.bias = -0.001;
        scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0xcbd5e1, 0.4);
        fillLight.position.set(-50, 50, -50);
        scene.add(fillLight);

        const buildingGroup = new THREE.Group();
        scene.add(buildingGroup);

        // Materials
        const steelColor = 0x3b82f6; // A nice industrial blue
        const steelMat = new THREE.MeshStandardMaterial({ 
            color: steelColor, 
            metalness: 0.5, 
            roughness: 0.5,
        });
        const purlinMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
        const wallMat = new THREE.MeshPhysicalMaterial({ 
            color: 0xf1f5f9, 
            transparent: true, 
            opacity: 0.4, 
            side: THREE.DoubleSide, 
            clearcoat: 1.0,
            roughness: 0.2
        });
        const roofMat = new THREE.MeshPhysicalMaterial({ 
            color: 0xe2e8f0, 
            transparent: true, 
            opacity: 0.6, 
            side: THREE.DoubleSide,
            clearcoat: 1.0,
            roughness: 0.2
        });
        const wireMat = new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 1 });
        const interactableMeshes = [];

        // Geometries
        const colGeom = createIBeamGeometry(0.5, 0.25, 0.01, 0.015, H_col);
        
        const roofRise = H_roof - H_col;
        const halfSpan = L / 2;
        const rafterLength = Math.sqrt(halfSpan*halfSpan + roofRise*roofRise);
        const rafterAngle = Math.atan(roofRise / halfSpan);
        const rafterGeom = createIBeamGeometry(0.4, 0.2, 0.008, 0.012, rafterLength);
        
        const purlinSpacing = Number(inputs.purlinSpacing) || 1.2;
        const numPurlins = Math.floor(rafterLength / purlinSpacing) + 1;
        const purlinGeom = createZBeamGeometry(0.2, 0.07, 0.004, B_total);

        const basePlateGeom = new THREE.BoxGeometry(0.5, 0.05, 0.5);
        const basePlateMat = new THREE.MeshStandardMaterial({ color: 0x475569 });

        const skeletonGroup = new THREE.Group();
        const numFrames = Math.max(2, Math.round(B_total / B_step) + 1);
        const actualStep = B_total / (numFrames - 1);

        for (let i = 0; i < numFrames; i++) {
            const zPos = -B_total/2 + i * actualStep;
            
            // Base plates
            const baseL = new THREE.Mesh(basePlateGeom, basePlateMat);
            baseL.position.set(-L/2, 0.025, zPos);
            baseL.castShadow = true; baseL.receiveShadow = true;
            skeletonGroup.add(baseL);

            const baseR = new THREE.Mesh(basePlateGeom, basePlateMat);
            baseR.position.set(L/2, 0.025, zPos);
            baseR.castShadow = true; baseR.receiveShadow = true;
            skeletonGroup.add(baseR);

            // Left Column
            const colL = new THREE.Mesh(colGeom, steelMat);
            colL.position.set(-L/2, H_col/2, zPos);
            colL.rotation.x = Math.PI/2; // Orient ExtrudeGeometry upwards
            colL.castShadow = true; colL.receiveShadow = true;
            skeletonGroup.add(colL);
            
            // Right Column
            const colR = new THREE.Mesh(colGeom, steelMat);
            colR.position.set(L/2, H_col/2, zPos);
            colR.rotation.x = Math.PI/2;
            colR.castShadow = true; colR.receiveShadow = true;
            skeletonGroup.add(colR);
            
            // Left Rafter
            const rafL = new THREE.Mesh(rafterGeom, steelMat);
            rafL.position.set(-L/4, H_col + roofRise/2, zPos);
            rafL.rotation.y = Math.PI/2; // Orient along X
            rafL.rotation.x = -rafterAngle; // Slant
            rafL.castShadow = true; rafL.receiveShadow = true;
            skeletonGroup.add(rafL);
            
            // Right Rafter
            const rafR = new THREE.Mesh(rafterGeom, steelMat);
            rafR.position.set(L/4, H_col + roofRise/2, zPos);
            rafR.rotation.y = -Math.PI/2;
            rafR.rotation.x = -rafterAngle;
            rafR.castShadow = true; rafR.receiveShadow = true;
            skeletonGroup.add(rafR);
            
            // Wall Bracing (X) on first and last bay
            if (i === 0 || i === numFrames - 2) {
                const zBraceCenter = -B_total/2 + i * actualStep + actualStep/2;
                const braceLength = Math.sqrt(actualStep*actualStep + H_col*H_col);
                const braceAngle = Math.atan(actualStep / H_col);
                const braceGeom = new THREE.CylinderGeometry(0.02, 0.02, braceLength);
                
                // Left X
                const brL1 = new THREE.Mesh(braceGeom, steelMat);
                brL1.position.set(-L/2, H_col/2, zBraceCenter);
                brL1.rotation.x = Math.PI/2 - braceAngle;
                skeletonGroup.add(brL1);
                
                const brL2 = new THREE.Mesh(braceGeom, steelMat);
                brL2.position.set(-L/2, H_col/2, zBraceCenter);
                brL2.rotation.x = Math.PI/2 + braceAngle;
                skeletonGroup.add(brL2);
                
                // Right X
                const brR1 = new THREE.Mesh(braceGeom, steelMat);
                brR1.position.set(L/2, H_col/2, zBraceCenter);
                brR1.rotation.x = Math.PI/2 - braceAngle;
                skeletonGroup.add(brR1);
                
                const brR2 = new THREE.Mesh(braceGeom, steelMat);
                brR2.position.set(L/2, H_col/2, zBraceCenter);
                brR2.rotation.x = Math.PI/2 + braceAngle;
                skeletonGroup.add(brR2);
            }
        }

        // Purlins (Xà gồ mái)
        for(let j=0; j<2; j++) {
            const sign = j===0 ? -1 : 1;
            for(let p=0; p<numPurlins; p++) {
                const ratio = p / (numPurlins - 1);
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
                // Color mapping for Wind Visualization
                if (zoneData.c_net > 0) mat.color.setHex(0xfca5a5); // Pressure -> Red
                else mat.color.setHex(0x93c5fd); // Suction -> Blue
                mat.opacity = 0.8; 
            } else if (mode === 'geometry') {
                mat.opacity = 0.15; // highly transparent in geometry mode
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

        const N0 = [xMin, y0, zMax], N1 = [xMax, y0, zMax], N2 = [xMax, y0, zMin], N3 = [xMin, y0, zMin];
        const C0 = [xMin, yCol, zMax], C1 = [xMax, yCol, zMax], C2 = [xMax, yCol, zMin], C3 = [xMin, yCol, zMin];
        const R0 = [0, yRoof, zMax], R1 = [0, yRoof, zMin];

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
                windwardZone = zones.find(z => z.surface === 'A' || z.zone === 'D'); // Approx
                leewardZone = zones.find(z => z.surface === 'B' || z.zone === 'E');
                sideZone = zones.find(z => z.surface === 'C' || z.zone === 'A');
            }
        }

        createQuad(N0, N1, C1, C0, 'wall', currentDir==='+Y'?windwardZone:(currentDir==='-Y'?leewardZone:sideZone)); // Front (+Z)
        createQuad(N1, N2, C2, C1, 'wall', currentDir==='+X'?leewardZone:(currentDir==='-X'?windwardZone:sideZone)); // Right (+X)
        createQuad(N2, N3, C3, C2, 'wall', currentDir==='-Y'?windwardZone:(currentDir==='+Y'?leewardZone:sideZone)); // Back (-Z)
        createQuad(N3, N0, C0, C3, 'wall', currentDir==='+X'?windwardZone:(currentDir==='-X'?leewardZone:sideZone)); // Left (-X)

        createQuad(C0, R0, R1, C3, 'roof', currentDir==='+X'?roofWindward:roofLeeward); // Left Roof
        createQuad(R0, C1, C2, R1, 'roof', currentDir==='+X'?roofLeeward:roofWindward); // Right Roof

        // WIND VISUALIZATION
        if (mode === 'wind') {
            const maxDim = Math.max(L, B_total, H_roof);
            const arrowDir = new THREE.Vector3(
                currentDir.includes('X') ? (currentDir.includes('+') ? 1 : -1) : 0, 
                0, 
                currentDir.includes('Y') ? (currentDir.includes('+') ? -1 : 1) : 0
            );
            
            const numArrows = 6;
            const arrowGroup = new THREE.Group();
            for(let i=0; i<numArrows; i++) {
                for(let j=0; j<3; j++) { // Multi-level arrows
                    const ratio = (i + 0.5) / numArrows;
                    let ax, az;
                    if(currentDir.includes('X')) {
                        ax = arrowDir.x * -(L/2 + 12); 
                        az = -B_total/2 + B_total * ratio;
                    } else {
                        az = arrowDir.z * -(B_total/2 + 12);
                        ax = -L/2 + L * ratio;
                    }
                    const pos = new THREE.Vector3(ax, H_col * (0.3 + j*0.3), az);
                    const ah = new THREE.ArrowHelper(arrowDir, pos, 12, 0x0284c7, 2, 1);
                    arrowGroup.add(ah);
                }
            }
            scene.add(arrowGroup);
        }

        // Camera setup
        const maxDim = Math.max(L, B_total, H_roof);
        camera.position.set(maxDim * 1.0, maxDim * 0.7, maxDim * 1.0);
        camera.lookAt(0, H_col/2, 0);

        // Ground
        const grid = new THREE.GridHelper(maxDim * 2.5, 40, 0xcbd5e1, 0xe2e8f0);
        scene.add(grid);
        
        const groundGeo = new THREE.PlaneGeometry(maxDim * 4, maxDim * 4);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, depthWrite: false });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const onMouseClick = (event) => {
            if(!showCladding || mode !== 'wind') return;
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
        };
    }, [inputs, caseData, currentDir, showCladding, mode]);

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [mode, currentDir, showCladding, isFullscreen]);
    
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

    return (
        <div ref={containerRef} className={`flex flex-col gap-3 ${isFullscreen ? 'bg-slate-100 p-6 h-screen w-screen z-50 fixed inset-0' : ''}`}>
            {/* Control Panel */}
            <div className="flex flex-wrap items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-700">
                        {mode === 'wind' ? 'Phân tích Tải trọng Gió 3D' : 'Mô hình Kết cấu 3D'}
                    </span>
                    
                    {mode === 'wind' && (
                        <div className="flex bg-slate-100 rounded-lg p-1 border">
                            {windDirs.map(d => (
                                <button 
                                    key={d}
                                    onClick={() => setCurrentDir(d)}
                                    className={`px-3 py-1 text-sm rounded-md transition-all font-semibold ${currentDir === d ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    Hướng {d}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowCladding(!showCladding)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${showCladding ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                        {showCladding ? 'Ẩn lớp Bao che' : 'Hiện lớp Bao che'}
                    </button>
                    <button onClick={toggleFullscreen} className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 rounded-lg border">
                        <i data-lucide={isFullscreen ? "minimize" : "maximize"} className="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <div className={`relative w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner ${isFullscreen ? 'flex-1' : 'h-[600px]'}`}>
                <div ref={mountRef} className="absolute inset-0" />
                
                {/* Floating HUD */}
                <div className="absolute top-4 left-4 pointer-events-none">
                    <div className="bg-white/80 backdrop-blur-md p-3 rounded-lg shadow-lg border border-slate-200/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            {mode === 'wind' ? (
                                <><i data-lucide="wind" className="text-blue-500 w-5 h-5"></i> Gió {currentDir}</>
                            ) : (
                                <><i data-lucide="box" className="text-indigo-500 w-5 h-5"></i> Hình học Tổng thể</>
                            )}
                        </h3>
                        <div className="text-xs text-slate-500 mt-1 space-y-1">
                            <p>Nhịp L: <b>{inputs.L || 25}m</b></p>
                            <p>Bước cột B: <b>{inputs.B || 6}m</b></p>
                            <p>Chiều dài: <b>{inputs.length || 72}m</b></p>
                            <p>Cao cột: <b>{inputs.H_column || 8}m</b></p>
                            <p>Cao mái: <b>{inputs.H_roof || 9.25}m</b></p>
                        </div>
                    </div>
                </div>
                
                <div className="absolute bottom-4 right-4 text-xs text-slate-500 bg-white/70 backdrop-blur p-2 rounded-lg shadow border border-slate-200/50">
                    <span className="flex items-center gap-1"><i data-lucide="mouse-pointer-2" className="w-3 h-3"></i> Xoay (Trái), Zoom (Cuộn), Di chuyển (Phải)</span>
                    {mode === 'wind' && showCladding && <span className="text-blue-600 font-semibold block mt-1">Click vào tường/mái để xem Áp lực</span>}
                </div>
                
                {mode === 'wind' && selectedZone && showCladding && (
                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur p-4 rounded-xl shadow-2xl border border-blue-200 w-64 text-sm z-10 animate-fade-in">
                        <h4 className="font-bold border-b border-blue-100 pb-2 mb-2 text-blue-800 flex justify-between">
                            <span>Vùng {selectedZone.zone}</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{selectedZone.surface}</span>
                        </h4>
                        <div className="flex justify-between py-1.5 border-b border-slate-50">
                            <span className="text-slate-500">Hệ số c_e:</span>
                            <span className="font-mono font-bold text-slate-700">{selectedZone.ce > 0 ? '+' : ''}{selectedZone.ce}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-50">
                            <span className="text-slate-500">Giá trị w_d:</span>
                            <span className={`font-mono font-bold ${selectedZone.pressure_d > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                {selectedZone.pressure_d.toFixed(2)} kN/m²
                            </span>
                        </div>
                        <div className="flex justify-between py-1.5">
                            <span className="text-slate-500">Phân loại:</span>
                            <span className="text-xs font-semibold text-slate-600">{selectedZone.pressure_d > 0 ? 'Áp lực Đẩy (+)' : 'Áp lực Hút (-)'}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

window.Building3DViewer = Building3DViewer;
