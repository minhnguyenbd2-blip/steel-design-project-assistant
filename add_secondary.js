const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/workspace_model.js', 'utf8');

const regex = /\/\/ Generate 3D Nodes and Frames[\s\S]*?\/\/ 4\. LOAD CASES & COMBINATIONS/;

const replacement = `// Generate 3D Nodes and Frames
        const roofSlope = H_roof > H_col ? (H_roof - H_col) / (L / 2) : 0.1;
        
        for (let i = 0; i < numFrames; i++) {
            const y = i * actualSpacing;
            const prefix = \`f\${i}-\`;
            
            // Nodes
            const n1 = { id: \`\${prefix}n1\`, label: \`Chân cột trái F\${i}\`, x: 0, y: y, z: 0 };
            const n2 = { id: \`\${prefix}n2\`, label: \`Chân cột phải F\${i}\`, x: L, y: y, z: 0 };
            const n3 = { id: \`\${prefix}n3\`, label: \`Đỉnh cột trái F\${i}\`, x: 0, y: y, z: H_col };
            const n4 = { id: \`\${prefix}n4\`, label: \`Đỉnh cột phải F\${i}\`, x: L, y: y, z: H_col };
            const n5 = { id: \`\${prefix}n5\`, label: \`Đỉnh mái F\${i}\`, x: L/2, y: y, z: H_roof };
            
            p.nodes.push(n1, n2, n3, n4, n5);

            // Supports
            p.supports.push({ id: \`sup-\${n1.id}\`, nodeId: n1.id, type: 'fixed' });
            p.supports.push({ id: \`sup-\${n2.id}\`, nodeId: n2.id, type: 'fixed' });

            // Primary Members
            p.members.push({ id: \`\${prefix}col1\`, label: \`Cột trái (Column) F\${i}\`, type: 'column', role: 'PRIMARY', startNode: n1.id, endNode: n3.id, materialId: 'mat-steel-main', sectionId: 'sec-col-main', length: H_col });
            p.members.push({ id: \`\${prefix}col2\`, label: \`Cột phải (Column) F\${i}\`, type: 'column', role: 'PRIMARY', startNode: n2.id, endNode: n4.id, materialId: 'mat-steel-main', sectionId: 'sec-col-main', length: H_col });
            
            const lenRaf = Math.sqrt(Math.pow(L/2, 2) + Math.pow(H_roof - H_col, 2));
            p.members.push({ id: \`\${prefix}raf1\`, label: \`Kèo trái (Rafter) F\${i}\`, type: 'rafter', role: 'PRIMARY', startNode: n3.id, endNode: n5.id, materialId: 'mat-steel-main', sectionId: 'sec-col-main', length: lenRaf });
            p.members.push({ id: \`\${prefix}raf2\`, label: \`Kèo phải (Rafter) F\${i}\`, type: 'rafter', role: 'PRIMARY', startNode: n4.id, endNode: n5.id, materialId: 'mat-steel-main', sectionId: 'sec-col-main', length: lenRaf });
        }

        // Generate Purlins (Xà gồ mái) - SECONDARY
        const purlinSpacing = p.legacyInputs.purlinParams?.spacing || 1.2;
        const rafterLen = Math.sqrt(Math.pow(L/2, 2) + Math.pow(H_roof - H_col, 2));
        const numPurlinsPerSide = Math.floor(rafterLen / purlinSpacing);
        
        for (let i = 0; i < numFrames - 1; i++) {
            const y1 = i * actualSpacing;
            const y2 = (i + 1) * actualSpacing;
            
            for (let side = 0; side < 2; side++) { // 0: Left, 1: Right
                for (let j = 0; j <= numPurlinsPerSide; j++) {
                    const ratio = j / numPurlinsPerSide;
                    const dx = side === 0 ? ratio * (L/2) : L - ratio * (L/2);
                    const dz = H_col + ratio * (H_roof - H_col);
                    
                    const nStartId = \`pnode-\${i}-\${side}-\${j}-1\`;
                    const nEndId = \`pnode-\${i}-\${side}-\${j}-2\`;
                    
                    p.nodes.push({ id: nStartId, x: dx, y: y1, z: dz });
                    p.nodes.push({ id: nEndId, x: dx, y: y2, z: dz });
                    
                    p.members.push({
                        id: \`purlin-\${i}-\${side}-\${j}\`,
                        label: \`Xà gồ mái (Roof Purlin)\`,
                        type: 'purlin',
                        role: 'SECONDARY',
                        startNode: nStartId,
                        endNode: nEndId,
                        materialId: 'mat-steel-main',
                        sectionId: 'sec-purlin',
                        length: actualSpacing
                    });
                }
            }
        }

        // Generate Girts (Xà gồ tường) - SECONDARY
        const girtSpacing = 1.5;
        const numGirts = Math.floor(H_col / girtSpacing);
        for (let i = 0; i < numFrames - 1; i++) {
            const y1 = i * actualSpacing;
            const y2 = (i + 1) * actualSpacing;
            
            for (let side = 0; side < 2; side++) { // 0: Left, 1: Right
                const dx = side === 0 ? 0 : L;
                for (let j = 1; j <= numGirts; j++) {
                    const dz = j * girtSpacing;
                    const nStartId = \`gnode-\${i}-\${side}-\${j}-1\`;
                    const nEndId = \`gnode-\${i}-\${side}-\${j}-2\`;
                    
                    p.nodes.push({ id: nStartId, x: dx, y: y1, z: dz });
                    p.nodes.push({ id: nEndId, x: dx, y: y2, z: dz });
                    
                    p.members.push({
                        id: \`girt-\${i}-\${side}-\${j}\`,
                        label: \`Xà gồ tường (Wall Girt)\`,
                        type: 'girt',
                        role: 'SECONDARY',
                        startNode: nStartId,
                        endNode: nEndId,
                        materialId: 'mat-steel-main',
                        sectionId: 'sec-purlin',
                        length: actualSpacing
                    });
                }
            }
        }

        // Generate Bracing (Hệ giằng) - BRACING
        // Bracing is typically in the first and last bays, and maybe middle bay
        const bracedBays = [];
        if (numFrames > 1) bracedBays.push(0); // First bay
        if (numFrames > 2) bracedBays.push(numFrames - 2); // Last bay
        if (numFrames > 5) bracedBays.push(Math.floor((numFrames - 1) / 2)); // Middle bay

        bracedBays.forEach(bay => {
            // Wall Bracing (X-bracing)
            for (let side = 0; side < 2; side++) {
                const n1_id = \`f\${bay}-\${side === 0 ? 'n1' : 'n2'}\`; // Bottom left/right
                const n2_id = \`f\${bay+1}-\${side === 0 ? 'n1' : 'n2'}\`;
                const n3_id = \`f\${bay}-\${side === 0 ? 'n3' : 'n4'}\`; // Top left/right
                const n4_id = \`f\${bay+1}-\${side === 0 ? 'n3' : 'n4'}\`;
                
                p.members.push({ id: \`wbr-\${bay}-\${side}-1\`, label: 'Giằng tường (Wall Brace)', type: 'brace', role: 'BRACING', startNode: n1_id, endNode: n4_id, sectionId: 'sec-purlin' });
                p.members.push({ id: \`wbr-\${bay}-\${side}-2\`, label: 'Giằng tường (Wall Brace)', type: 'brace', role: 'BRACING', startNode: n2_id, endNode: n3_id, sectionId: 'sec-purlin' });
            }
            
            // Roof Bracing (X-bracing)
            for (let side = 0; side < 2; side++) {
                const n3_id = \`f\${bay}-\${side === 0 ? 'n3' : 'n4'}\`; // Eave
                const n4_id = \`f\${bay+1}-\${side === 0 ? 'n3' : 'n4'}\`;
                const n5_id = \`f\${bay}-n5\`; // Ridge
                const n6_id = \`f\${bay+1}-n5\`;
                
                p.members.push({ id: \`rbr-\${bay}-\${side}-1\`, label: 'Giằng mái (Roof Brace)', type: 'brace', role: 'BRACING', startNode: n3_id, endNode: n6_id, sectionId: 'sec-purlin' });
                p.members.push({ id: \`rbr-\${bay}-\${side}-2\`, label: 'Giằng mái (Roof Brace)', type: 'brace', role: 'BRACING', startNode: n4_id, endNode: n5_id, sectionId: 'sec-purlin' });
            }
        });

        // Floor Beam (Conceptual or single if applicable)
        p.members.push({ id: 'm-beam', label: 'Dầm sàn (Floor Beam)', type: 'beam', role: 'PRIMARY', length: p.legacyInputs.beamParams?.L_beam || 9 });

        // 4. LOAD CASES & COMBINATIONS
`;

c = c.replace(regex, replacement);
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/core/workspace_model.js', c, 'utf8');