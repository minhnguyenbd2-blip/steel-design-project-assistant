const { useRef, useEffect, useState, useMemo } = React;

function Wind3DViewer({ geom, loadCases, currentDir = '+X' }) {
    const mountRef = useRef(null);
    const [selectedZone, setSelectedZone] = useState(null);
    const sceneRef = useRef(null);
    
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
        scene.background = new THREE.Color(0xf8fafc);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        mountRef.current.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(50, 100, 50);
        scene.add(dirLight);
        
        // Geometry specs
        const L = geom.L;
        const B = geom.d_total || geom.length || 72; // length of building
        const H_col = geom.H_col || geom.H_column;
        const H_roof = geom.H_rf || geom.H_roof;

        // Group for building
        const buildingGroup = new THREE.Group();
        scene.add(buildingGroup);

        // Materials
        const wallMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
        const roofMat = new THREE.MeshLambertMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
        const wireMat = new THREE.LineBasicMaterial({ color: 0x475569, linewidth: 2 });
        const hoverMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.6, side: THREE.DoubleSide });

        // Let's create an array to store raycastable meshes
        const interactableMeshes = [];

        // Helper to draw a quad surface
        function createQuad(p1, p2, p3, p4, type, zoneData) {
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                ...p1, ...p2, ...p3,
                ...p1, ...p3, ...p4
            ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();

            // Color logic based on pressure
            let mat = type === 'wall' ? wallMat.clone() : roofMat.clone();
            
            if (zoneData) {
                // Determine color by pressure
                if (zoneData.c_net > 0) {
                    mat.color.setHex(0xfca5a5); // red-ish for pressure
                } else {
                    mat.color.setHex(0x93c5fd); // blue-ish for suction
                }
            }

            const mesh = new THREE.Mesh(geometry, mat);
            if (zoneData) {
                mesh.userData = zoneData;
                interactableMeshes.push(mesh);
            }
            buildingGroup.add(mesh);

            // Edges
            const edges = new THREE.EdgesGeometry(geometry);
            const line = new THREE.LineSegments(edges, wireMat);
            buildingGroup.add(line);
            
            return mesh;
        }

        // Vertices (center at 0,0,0 ground)
        // X = width (L), Z = depth (B), Y = height (H)
        const xMin = -L/2, xMax = L/2;
        const zMin = -B/2, zMax = B/2;
        const y0 = 0, yCol = H_col, yRoof = H_roof;

        // Node definitions
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

        // Retrieve zones for current direction
        const zones = caseData.surfaces || [];
        // Helper to find zone by ID, e.g., 'A', 'B', 'F'
        // But our geometry divides walls. If +X wind, Wall A is xMin, Wall B is xMax, C/D are sides.
        // Wait, TCVN 2737:2023 divides Wall A/B/C/D based on B and D.
        // Since this is a simple visualization, we map 1 quad per wall and assign the primary zone, or we can just render the bounding box with a generic texture.
        // For a full 3D viewer, we would split the quads by zone.
        // For now, let's keep it simple: whole wall = primary zone.
        
        // We'll just build a single box for the walls and color them generically.
        const w1 = createQuad(N0, N1, C1, C0, 'wall'); // Front (+Z)
        const w2 = createQuad(N1, N2, C2, C1, 'wall'); // Right (+X)
        const w3 = createQuad(N2, N3, C3, C2, 'wall'); // Back (-Z)
        const w4 = createQuad(N3, N0, C0, C3, 'wall'); // Left (-X)

        const r1 = createQuad(C0, R0, R1, C3, 'roof'); // Left Roof
        const r2 = createQuad(R0, C1, C2, R1, 'roof'); // Right Roof

        // Adjust camera
        const maxDim = Math.max(L, B, H_roof);
        camera.position.set(maxDim * 1.5, maxDim, maxDim * 1.5);
        camera.lookAt(0, H_col/2, 0);

        // Grid
        const grid = new THREE.GridHelper(maxDim * 3, 20);
        scene.add(grid);
        
        // Axes
        const axesHelper = new THREE.AxesHelper(maxDim);
        scene.add(axesHelper);

        // Wind Arrow
        const arrowDir = new THREE.Vector3(currentDir.includes('X') ? (currentDir === '+X' ? 1 : -1) : 0, 0, currentDir.includes('Y') ? (currentDir === '+Y' ? -1 : 1) : 0);
        const arrowPos = new THREE.Vector3(arrowDir.x * -maxDim, H_col/2, arrowDir.z * -maxDim);
        const arrow = new THREE.ArrowHelper(arrowDir, arrowPos, maxDim*0.8, 0x0ea5e9, maxDim*0.2, maxDim*0.1);
        scene.add(arrow);

        // Raycaster for clicking zones
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseClick = (event) => {
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
    }, [geom, caseData, currentDir]);

    return (
        <div className="relative w-full h-[500px] bg-slate-50 border rounded-xl overflow-hidden shadow-inner">
            <div ref={mountRef} className="absolute inset-0" />
            
            {/* Overlay Info */}
            <div className="absolute top-4 left-4 pointer-events-none">
                <h3 className="font-bold text-slate-800 bg-white/80 p-2 rounded shadow backdrop-blur-sm border">
                    Mô hình 3D - Hướng gió {currentDir}
                </h3>
            </div>
            
            <div className="absolute bottom-4 right-4 text-xs text-slate-500 bg-white/80 p-2 rounded shadow backdrop-blur-sm">
                Sử dụng chuột: Xoay (Trái), Zoom (Cuộn), Di chuyển (Phải)
            </div>
            
            {selectedZone && (
                <div className="absolute bottom-4 left-4 bg-white p-4 rounded-xl shadow-lg border w-64 text-sm z-10">
                    <h4 className="font-bold border-b pb-2 mb-2">Vùng {selectedZone.zone}</h4>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Loại:</span>
                        <span className="font-semibold">{selectedZone.surface}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">c_e (Khí động):</span>
                        <span className="font-mono font-bold">{selectedZone.ce > 0 ? '+' : ''}{selectedZone.ce}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Áp lực (w_d):</span>
                        <span className="font-mono text-amber-600">{selectedZone.pressure_d.toFixed(2)} kN/m²</span>
                    </div>
                </div>
            )}
        </div>
    );
}

window.Wind3DViewer = Wind3DViewer;