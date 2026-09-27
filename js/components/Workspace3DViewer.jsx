const { useRef, useEffect, useState } = React;

function Workspace3DViewer({ workspaceState }) {
    const mountRef = useRef(null);
    const [selectedMember, setSelectedMember] = useState(null);

    useEffect(() => {
        if (!mountRef.current || !window.THREE) return;
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(50, 40, 50);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        mountRef.current.appendChild(renderer.domElement);

        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(12.5, 5, -30);

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 50, 20);
        scene.add(dirLight);

        // Helper Grid
        const gridHelper = new THREE.GridHelper(100, 100, 0x000000, 0xe2e8f0);
        gridHelper.position.y = -0.01;
        scene.add(gridHelper);

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

        const memberMeshes = [];
        if (workspaceState && workspaceState.members) {
            workspaceState.members.forEach(m => {
                if (m.startNode && m.endNode) {
                    const p1 = nodeMap[m.startNode];
                    const p2 = nodeMap[m.endNode];
                    if (!p1 || !p2) return;

                    const length = p1.distanceTo(p2);
                    
                    // Simple box representation for now
                    const geometry = new THREE.BoxGeometry(0.3, 0.3, length);
                    geometry.translate(0, 0, length / 2); // Pivot at start
                    
                    let colorHex = m.type === 'column' ? 0x64748b : 0x94a3b8;
                    const dr = workspaceState.designResults ? workspaceState.designResults[m.id] : null;
                    if (dr && dr.analysisStatus === 'ANALYZED') {
                        if (dr.utilization <= 0.5) colorHex = 0x10b981; // Green
                        else if (dr.utilization <= 0.8) colorHex = 0xf59e0b; // Yellow
                        else if (dr.utilization <= 1.0) colorHex = 0xf97316; // Orange
                        else colorHex = 0xef4444; // Red
                    }

                    const material = new THREE.MeshStandardMaterial({ 
                        color: colorHex,
                        roughness: 0.4
                    });
                    
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.position.copy(p1);
                    mesh.lookAt(p2);
                    
                    mesh.userData = { member: m };
                    scene.add(mesh);
                    memberMeshes.push(mesh);
                }
            });
        }

        // Raycaster for selection
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onClick = (event) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(memberMeshes);
            
            // Reset colors
            memberMeshes.forEach(mesh => {
                let cHex = mesh.userData.member.type === 'column' ? 0x64748b : 0x94a3b8;
                const dr = workspaceState.designResults ? workspaceState.designResults[mesh.userData.member.id] : null;
                if (dr && dr.analysisStatus === 'ANALYZED') {
                    if (dr.utilization <= 0.5) cHex = 0x10b981;
                    else if (dr.utilization <= 0.8) cHex = 0xf59e0b;
                    else if (dr.utilization <= 1.0) cHex = 0xf97316;
                    else cHex = 0xef4444;
                }
                mesh.material.color.setHex(cHex);
                mesh.material.emissive.setHex(0x000000);
            });

            if (intersects.length > 0) {
                const selectedMesh = intersects[0].object;
                selectedMesh.material.color.setHex(0x3b82f6);
                selectedMesh.material.emissive.setHex(0x1d4ed8);
                setSelectedMember(selectedMesh.userData.member);
            } else {
                setSelectedMember(null);
            }
        };

        renderer.domElement.addEventListener('click', onClick);

        
        const onWindowResize = () => {
            if (!mountRef.current || !renderer) return;
            const w = mountRef.current.clientWidth;
            const h = mountRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onWindowResize);

        const animate = function () {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            window.removeEventListener('resize', onWindowResize);
        };
    }, [workspaceState]);

    return (
        <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 relative shadow-sm" style={{ height: 'calc(100vh - 10rem)', minHeight: '600px' }}>
            <div className="flex-1 relative" ref={mountRef}>
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur dark:bg-slate-800/90 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm z-10">
                    <h3 className="font-bold text-sm mb-1">{window.t('model')} 3D</h3>
                    <p className="text-xs text-slate-500">Kéo chuột để xoay. Click vào phần tử để xem thông tin.</p>
                </div>
            </div>
            
            {/* Contextual Member Information Panel */}
            <div className={`w-80 bg-slate-50 dark:bg-slate-900/50 border-l border-slate-200 dark:border-slate-700 p-4 overflow-y-auto transition-transform ${selectedMember ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full'}`}>
                {selectedMember ? (
                    <div>
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-primary">PHẦN TỬ (MEMBER)</h3>
                            <span className="text-xs font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">{selectedMember.id}</span>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="text-xs text-slate-500 block">Tên (Label)</label>
                                <div className="font-medium">{selectedMember.label || 'Không tên'}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block">Loại (Type)</label>
                                <div className="font-medium capitalize">{selectedMember.type}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block">Chiều dài (Length)</label>
                                <div className="font-medium font-mono">{selectedMember.length ? selectedMember.length.toFixed(3) : '--'} m</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block">Tiết diện (Section)</label>
                                <div className="font-medium font-mono text-blue-600 dark:text-blue-400">{selectedMember.sectionId || '--'}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block">Vật liệu (Material)</label>
                                <div className="font-medium">{selectedMember.materialId || '--'}</div>
                            </div>
                            
                            {(() => {
                                const dr = workspaceState?.designResults ? workspaceState.designResults[selectedMember.id] : null;
                                if (!dr || dr.analysisStatus !== 'ANALYZED') {
                                    return (
                                        <div className="mt-6 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Kết quả (Status)</h4>
                                            <div className="flex justify-between items-center mb-1">
                                                <span>Hệ số SD (Utilization)</span>
                                                <span className="font-mono font-bold text-slate-400">N/A</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span>Đánh giá</span>
                                                <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded font-bold">CHƯA PHÂN TÍCH</span>
                                            </div>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <div className="mt-6 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Kết quả (Status)</h4>
                                        <div className="flex justify-between items-center mb-2">
                                            <span>Hệ số SD (Utilization)</span>
                                            <span className={"font-mono font-bold " + (dr.utilization > 1 ? "text-red-500" : (dr.utilization > 0.8 ? "text-orange-500" : "text-emerald-500"))}>
                                                {dr.utilization.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mb-3 pb-3 border-b dark:border-slate-700">
                                            <span>Đánh giá</span>
                                            <span className={"text-xs px-2 py-0.5 rounded font-bold " + (dr.designStatus === 'PASS' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" : "bg-red-100 text-red-700 dark:bg-red-900/30")}>
                                                {dr.designStatus === 'PASS' ? 'ĐẠT (PASS)' : 'KHÔNG ĐẠT (FAIL)'}
                                            </span>
                                        </div>
                                        
                                        {dr.governingCheck && (
                                            <div className="mb-2">
                                                <div className="text-xs text-slate-500">Điều kiện chi phối (Governing)</div>
                                                <div className="text-sm font-bold truncate" title={dr.governingCheck}>{dr.governingCheck}</div>
                                            </div>
                                        )}
                                        
                                        {dr.governingCombinationId && (
                                            <div>
                                                <div className="text-xs text-slate-500">Tổ hợp chi phối (Combo)</div>
                                                <div className="text-sm font-mono">{dr.governingCombinationId}</div>
                                            </div>
                                        )}
                                        
                                        {dr.calculationTrace && (
                                            <button 
                                                onClick={() => {
                                                    const win = window.open('', '_blank');
                                                    win.document.write('<html><head><title>Calculation Trace</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"></head><body style="font-family:sans-serif;padding:20px;line-height:1.6;max-width:800px;margin:0 auto;"><h2>Chi tiết tính toán - ' + selectedMember.id + '</h2>' + dr.calculationTrace + '</body></html>');
                                                }}
                                                className="mt-4 w-full py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-xs font-bold transition-colors"
                                            >
                                                <i data-lucide="file-search" className="w-3 h-3 inline mr-1"></i> Xem chi tiết (Trace)
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                        <i data-lucide="mouse-pointer-click" className="w-10 h-10 mb-3 opacity-50"></i>
                        <p className="text-sm">Chưa chọn phần tử nào.</p>
                        <p className="text-xs mt-1">Click vào một cấu kiện trên mô hình 3D để xem thông tin chi tiết.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

window.Workspace3DViewer = Workspace3DViewer;