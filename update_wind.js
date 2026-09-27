const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', 'utf8');

const windInitOld = `            if (windAnimMode === 'static') {
                const numArrows = Math.max(4, Math.floor(maxDim / 8));
                for(let i=0; i<numArrows; i++) {
                    for(let j=0; j<3; j++) { 
                        const ratio = (i + 0.5) / numArrows;
                        let ax = currentDir.includes('X') ? startX + 20 * arrowDir.x : -L/2 + L * ratio;
                        let az = currentDir.includes('Y') ? startZ + 20 * arrowDir.z : -B_total/2 + B_total * ratio;
                        const pos = new THREE.Vector3(ax, H_col * (0.2 + j*0.35), az);
                        const ah = new THREE.ArrowHelper(arrowDir, pos, 12, isDark ? 0x38bdf8 : 0x0284c7, 3, 1.5);
                        windGroup.add(ah);
                    }
                }
            } else {
                const streakCount = 150;
                const streakLength = 3.0;
                const streakGeom = new THREE.CylinderGeometry(0.04, 0.04, streakLength, 4);
                streakGeom.rotateX(Math.PI/2); // Align Z
                const streakMat = new THREE.MeshBasicMaterial({ color: isDark ? 0x38bdf8 : 0x0ea5e9, transparent: true, opacity: 0.6 });

                for(let i=0; i<streakCount; i++) {
                    const mesh = new THREE.Mesh(streakGeom, streakMat);
                    let px, pz;
                    if (currentDir.includes('X')) {
                        px = startX + Math.random() * 30 * arrowDir.x;
                        pz = -B_total/2 + Math.random() * B_total;
                    } else {
                        px = -L/2 + Math.random() * L;
                        pz = startZ + Math.random() * 30 * arrowDir.z;
                    }
                    const py = Math.random() * H_roof;
                    
                    mesh.position.set(px, py, pz);
                    mesh.lookAt(mesh.position.clone().add(arrowDir));
                    mesh.userData = { speed: 0.3 + Math.random() * 0.4 };
                    windGroup.add(mesh);
                    windElements.push(mesh);
                }
            }`;

const windInitNew = `            if (windAnimMode === 'static') {
                const numArrows = Math.max(4, Math.floor(maxDim / 8));
                for(let i=0; i<numArrows; i++) {
                    for(let j=0; j<3; j++) { 
                        const ratio = (i + 0.5) / numArrows;
                        let ax = currentDir.includes('X') ? startX + 20 * arrowDir.x : -L/2 + L * ratio;
                        let az = currentDir.includes('Y') ? startZ + 20 * arrowDir.z : -B_total/2 + B_total * ratio;
                        const pos = new THREE.Vector3(ax, H_col * (0.2 + j*0.35), az);
                        const ah = new THREE.ArrowHelper(arrowDir, pos, 12, isDark ? 0x38bdf8 : 0x0284c7, 3, 1.5);
                        windGroup.add(ah);
                    }
                }
            } else {
                const streakCount = 200;
                const streakLength = 4.0; // longer for better flow
                const streakGeom = new THREE.CylinderGeometry(0.015, 0.015, streakLength, 4);
                streakGeom.rotateX(Math.PI/2); // Align Z
                const streakMat = new THREE.MeshBasicMaterial({ color: isDark ? 0x7dd3fc : 0x38bdf8, transparent: true, opacity: 0.5 });

                for(let i=0; i<streakCount; i++) {
                    const mesh = new THREE.Mesh(streakGeom, streakMat);
                    
                    mesh.userData = { 
                        originalPos: new THREE.Vector3(
                            currentDir.includes('X') ? startX : -L/2 + Math.random() * L,
                            Math.random() * H_roof,
                            currentDir.includes('X') ? -B_total/2 + Math.random() * B_total : startZ
                        ),
                        speed: 0.15 + Math.random() * 0.15, // slower, natural
                        progress: Math.random() * 35, // random start position
                        phaseY: Math.random() * Math.PI * 2,
                        phaseZ: Math.random() * Math.PI * 2,
                        ampY: 0.1 + Math.random() * 0.3,
                        ampZ: 0.1 + Math.random() * 0.3,
                        freq: 0.15 + Math.random() * 0.2
                    };
                    
                    windGroup.add(mesh);
                    windElements.push(mesh);
                }
            }`;

const windLoopOld = `            if (windAnimMode === 'dynamic' && windElements.length > 0) {
                const arrowDir = new THREE.Vector3(
                    currentDir.includes('X') ? (currentDir.includes('+') ? 1 : -1) : 0, 
                    0, 
                    currentDir.includes('Y') ? (currentDir.includes('+') ? -1 : 1) : 0
                );

                windElements.forEach(mesh => {
                    mesh.position.addScaledVector(arrowDir, mesh.userData.speed);
                    
                    let hit = false;
                    const halfLen = 1.5; // half of streakLength
                    
                    if (currentDir === '+X' && mesh.position.x + halfLen > targetX) hit = true;
                    if (currentDir === '-X' && mesh.position.x - halfLen < targetX) hit = true;
                    if (currentDir === '+Y' && mesh.position.z + halfLen > targetZ) hit = true;
                    if (currentDir === '-Y' && mesh.position.z - halfLen < targetZ) hit = true;
                    
                    if (hit) {
                        if (currentDir.includes('X')) mesh.position.x = startX;
                        if (currentDir.includes('Y')) mesh.position.z = startZ;
                        mesh.position.y = Math.random() * H_roof;
                    }
                });
            }`;

const windLoopNew = `            if (windAnimMode === 'dynamic' && windElements.length > 0) {
                const arrowDir = new THREE.Vector3(
                    currentDir.includes('X') ? (currentDir.includes('+') ? 1 : -1) : 0, 
                    0, 
                    currentDir.includes('Y') ? (currentDir.includes('+') ? -1 : 1) : 0
                );
                
                const travelDist = 35; // Distance from startX to wall
                const timeSec = Date.now() * 0.001;
                const halfLen = 2.0; // half of streakLength 4.0

                windElements.forEach(mesh => {
                    const prevPos = mesh.position.clone();
                    
                    mesh.userData.progress += mesh.userData.speed;
                    
                    // Reset if hits wall (progress accounts for half length so tip stops exactly)
                    if (mesh.userData.progress > travelDist - halfLen) {
                        mesh.userData.progress = 0;
                        if (currentDir.includes('X')) mesh.userData.originalPos.z = -B_total/2 + Math.random() * B_total;
                        else mesh.userData.originalPos.x = -L/2 + Math.random() * L;
                        mesh.userData.originalPos.y = Math.random() * H_roof;
                    }
                    
                    const prog = mesh.userData.progress;
                    const basePos = mesh.userData.originalPos.clone().addScaledVector(arrowDir, prog);
                    
                    // Natural ripple
                    const rippleY = Math.sin(prog * mesh.userData.freq + mesh.userData.phaseY + timeSec) * mesh.userData.ampY;
                    const rippleZ = Math.cos(prog * mesh.userData.freq + mesh.userData.phaseZ + timeSec * 0.8) * mesh.userData.ampZ;
                    
                    if (currentDir.includes('X')) {
                        mesh.position.set(basePos.x, basePos.y + rippleY, basePos.z + rippleZ);
                    } else {
                        mesh.position.set(basePos.x + rippleZ, basePos.y + rippleY, basePos.z);
                    }
                    
                    // LookAt tangent
                    if (prog > mesh.userData.speed) {
                        const lookTarget = mesh.position.clone().add(mesh.position.clone().sub(prevPos));
                        mesh.lookAt(lookTarget);
                    } else {
                        mesh.lookAt(mesh.position.clone().add(arrowDir));
                    }
                    
                    // Seamless scale fading at spawn and wall hit to prevent popping
                    let scaleZ = 1.0;
                    if (prog < halfLen) scaleZ = Math.max(0.01, prog / halfLen);
                    else if (prog > travelDist - halfLen * 2) scaleZ = Math.max(0.01, (travelDist - halfLen - prog) / halfLen);
                    mesh.scale.set(1, 1, scaleZ);
                });
            }`;

c = c.replace(windInitOld, windInitNew);
c = c.replace(windLoopOld, windLoopNew);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Building3DViewer.jsx', c, 'utf8');