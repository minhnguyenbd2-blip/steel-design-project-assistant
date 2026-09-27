const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', 'utf8');

const regexMesh = /const material = new THREE\.MeshStandardMaterial\(\{[\s\S]*?mesh\.position\.copy\(midPoint\);/m;

const replacementMesh = `let colorHex = 0x94a3b8; // default slate-400
                    let depth = 0.4;
                    let width = 0.2;
                    let isCylinder = false;

                    if (m.role === 'PRIMARY') {
                        colorHex = m.type === 'column' ? 0x64748b : 0x475569; // darker slate
                        depth = 0.5;
                        width = 0.25;
                    } else if (m.role === 'SECONDARY') {
                        colorHex = 0x94a3b8; // slate-400
                        depth = 0.2;
                        width = 0.08;
                    } else if (m.role === 'BRACING') {
                        colorHex = 0xf87171; // red-400
                        isCylinder = true;
                        width = 0.05;
                    }

                    const dr = workspaceState.designResults ? workspaceState.designResults[m.id] : null;
                    if (dr && dr.analysisStatus === 'ANALYZED') {
                        if (dr.utilization <= 0.5) colorHex = 0x10b981; // Green
                        else if (dr.utilization <= 0.8) colorHex = 0xf59e0b; // Yellow
                        else if (dr.utilization <= 1.0) colorHex = 0xf97316; // Orange
                        else colorHex = 0xef4444; // Red
                    }

                    const material = new THREE.MeshStandardMaterial({ 
                        color: colorHex,
                        roughness: 0.6,
                        metalness: 0.2
                    });
                    
                    let geometry;
                    if (isCylinder) {
                        geometry = new THREE.CylinderGeometry(width, width, distance, 8);
                    } else {
                        // We align the depth along the local Y axis (strong axis)
                        // If it's a purlin/girt, we make it thin
                        geometry = new THREE.BoxGeometry(width, distance, depth);
                    }
                    
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.userData = { member: m };
                    
                    const midPoint = new THREE.Vector3().addVectors(startNode, endNode).multiplyScalar(0.5);
                    mesh.position.copy(midPoint);`;

c = c.replace(regexMesh, replacementMesh);
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', c, 'utf8');