// js/core/workspace_model.js
// Mô hình dữ liệu chuẩn của Không gian làm việc (Canonical Workspace Model)
// Ngôn ngữ ưu tiên: Tiếng Việt, thuật ngữ Tiếng Anh nếu có đi kèm nằm trong dấu () kế bên.

const generateId = () => Math.random().toString(36).substr(2, 9);

window.WorkspaceModel = {
    createEmptyProject: function() {
        return {
            metadata: {
                id: generateId(),
                name: "Dự án mới (New Project)",
                description: "",
                author: "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            units: { length: "m", force: "kN", stress: "MPa", section: "cm" },
            designCode: { wind: "TCVN 2737:2023", steel: "TCVN 5575:2024", concrete: "TCVN 5574:2018" },
            materials: [],
            sections: [],
            nodes: [],
            members: [],
            supports: [],
            releases: [],
            loadCases: [],
            loads: [],
            loadCombinations: [],
            analysisResults: {},
            designResults: {},
            validationResults: { status: 'CHƯA RÕ (UNKNOWN)', issues: [] },
            auditLog: [],
            legacyInputs: {} 
        };
    },

    fromLegacyState: function(legacyState) {
        const p = this.createEmptyProject();
        p.metadata.name = legacyState.meta?.projectName || "Dự án mới (New Project)";
        p.metadata.author = legacyState.meta?.studentName || "Người dùng (User)";
        
        p.legacyInputs = JSON.parse(JSON.stringify(legacyState.inputs || {}));
        
        // 1. THƯ VIỆN VẬT LIỆU (MATERIAL LIBRARY)
        const steelGrade = p.legacyInputs.steelGrade || "S235";
        let fy = 235, fu = 360;
        if (steelGrade === 'S275') { fy = 275; fu = 430; }
        if (steelGrade === 'S355') { fy = 355; fu = 510; }
        
        p.materials.push({
            id: 'mat-steel-main',
            name: steelGrade,
            grade: steelGrade,
            type: 'steel',
            fy: fy,
            fu: fu,
            E: 210000,
            G: 80769,
            density: 7850,
            poisson: 0.3
        });

        // 2. THƯ VIỆN TIẾT DIỆN (SECTION LIBRARY)
        const legacyResults = legacyState.results || {};
        const colSec = legacyResults.selectedSections?.column;
        if (colSec) {
            p.sections.push({
                id: 'sec-col-main',
                name: colSec.name || 'Cột thép (Steel Column)',
                type: 'I',
                h: colSec.h, bf: colSec.b, tw: colSec.tw, tf: colSec.tf,
                area: colSec.A, Ix: colSec.Ix, Iy: colSec.Iy, Wx: colSec.Wx, Wy: colSec.Wy
            });
        } else {
            p.sections.push({
                id: 'sec-col-main', name: 'Tiết diện cột chưa chọn', type: 'unknown'
            });
        }

        const purlinId = p.legacyInputs.selectedPurlinId || "Z25019";
        p.sections.push({ id: 'sec-purlin', name: purlinId, type: 'Z' });

        // 3. HÌNH HỌC (NODES & MEMBERS in 3D)
        const L = parseFloat(p.legacyInputs.L) || 25;
        const B = parseFloat(p.legacyInputs.B) || 6;
        const totalL = parseFloat(p.legacyInputs.length) || 72;
        const H_col = parseFloat(p.legacyInputs.H_column) || 8;
        const H_roof = parseFloat(p.legacyInputs.H_roof) || 9.25;
        
        const numFrames = Math.max(2, Math.floor(totalL / B) + 1);
        const actualSpacing = totalL / (numFrames - 1);

        // Sinh các khung ngang và nút trong không gian 3D
        for (let i = 0; i < numFrames; i++) {
            const y = i * actualSpacing;
            const prefix = `f${i}-`;
            
            // Nút khung
            const n1 = { id: `${prefix}n1`, label: `Chân cột trái F${i}`, x: 0, y: y, z: 0 };
            const n2 = { id: `${prefix}n2`, label: `Chân cột phải F${i}`, x: L, y: y, z: 0 };
            const n3 = { id: `${prefix}n3`, label: `Đỉnh cột trái F${i}`, x: 0, y: y, z: H_col };
            const n4 = { id: `${prefix}n4`, label: `Đỉnh cột phải F${i}`, x: L, y: y, z: H_col };
            const n5 = { id: `${prefix}n5`, label: `Đỉnh mái F${i}`, x: L/2, y: y, z: H_roof };
            
            p.nodes.push(n1, n2, n3, n4, n5);

            // Liên kết gối tựa chân cột (Supports)
            p.supports.push({ id: `sup-${n1.id}`, nodeId: n1.id, type: 'fixed' });
            p.supports.push({ id: `sup-${n2.id}`, nodeId: n2.id, type: 'fixed' });

            // Cấu kiện kết cấu chính (Primary Members)
            p.members.push({ id: `${prefix}col1`, label: `Cột trái (Column) F${i}`, type: 'column', role: 'PRIMARY', startNode: n1.id, endNode: n3.id, materialId: 'mat-steel-main', sectionId: 'sec-col-main', length: H_col });
            p.members.push({ id: `${prefix}col2`, label: `Cột phải (Column) F${i}`, type: 'column', role: 'PRIMARY', startNode: n2.id, endNode: n4.id, materialId: 'mat-steel-main', sectionId: 'sec-col-main', length: H_col });
            
            const lenRaf = Math.sqrt(Math.pow(L/2, 2) + Math.pow(H_roof - H_col, 2));
            p.members.push({ id: `${prefix}raf1`, label: `Kèo trái (Rafter) F${i}`, type: 'rafter', role: 'PRIMARY', startNode: n3.id, endNode: n5.id, materialId: 'mat-steel-main', sectionId: 'sec-col-main', length: lenRaf });
            p.members.push({ id: `${prefix}raf2`, label: `Kèo phải (Rafter) F${i}`, type: 'rafter', role: 'PRIMARY', startNode: n4.id, endNode: n5.id, materialId: 'mat-steel-main', sectionId: 'sec-col-main', length: lenRaf });
        }

        // Sinh hệ Xà gồ mái (Roof Purlins) - SECONDARY
        const purlinSpacing = p.legacyInputs.purlinParams?.spacing || 1.2;
        const rafterLen = Math.sqrt(Math.pow(L/2, 2) + Math.pow(H_roof - H_col, 2));
        const numPurlinsPerSide = Math.floor(rafterLen / purlinSpacing);
        
        for (let i = 0; i < numFrames - 1; i++) {
            const y1 = i * actualSpacing;
            const y2 = (i + 1) * actualSpacing;
            
            for (let side = 0; side < 2; side++) { // 0: Trái, 1: Phải
                for (let j = 0; j <= numPurlinsPerSide; j++) {
                    const ratio = j / numPurlinsPerSide;
                    const dx = side === 0 ? ratio * (L/2) : L - ratio * (L/2);
                    const dz = H_col + ratio * (H_roof - H_col);
                    
                    const nStartId = `pnode-${i}-${side}-${j}-1`;
                    const nEndId = `pnode-${i}-${side}-${j}-2`;
                    
                    p.nodes.push({ id: nStartId, x: dx, y: y1, z: dz });
                    p.nodes.push({ id: nEndId, x: dx, y: y2, z: dz });
                    
                    p.members.push({
                        id: `purlin-${i}-${side}-${j}`,
                        label: `Xà gồ mái (Roof Purlin)`,
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

        // Sinh hệ Xà gồ tường (Wall Girts) - SECONDARY
        const girtSpacing = 1.5;
        const numGirts = Math.floor(H_col / girtSpacing);
        for (let i = 0; i < numFrames - 1; i++) {
            const y1 = i * actualSpacing;
            const y2 = (i + 1) * actualSpacing;
            
            for (let side = 0; side < 2; side++) { // 0: Trái, 1: Phải
                const dx = side === 0 ? 0 : L;
                for (let j = 1; j <= numGirts; j++) {
                    const dz = j * girtSpacing;
                    const nStartId = `gnode-${i}-${side}-${j}-1`;
                    const nEndId = `gnode-${i}-${side}-${j}-2`;
                    
                    p.nodes.push({ id: nStartId, x: dx, y: y1, z: dz });
                    p.nodes.push({ id: nEndId, x: dx, y: y2, z: dz });
                    
                    p.members.push({
                        id: `girt-${i}-${side}-${j}`,
                        label: `Xà gồ tường (Wall Girt)`,
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

        // Sinh Hệ giằng chữ X (Bracing System) - BRACING
        // Tuân thủ nghiêm ngặt yêu cầu: Hệ giằng chỉ bố trí ở 2 đầu hồi (gian đầu tiên và gian cuối cùng)
        const bracedBays = [];
        if (numFrames > 1) bracedBays.push(0); // Gian đầu tiên (First bay)
        if (numFrames > 2) bracedBays.push(numFrames - 2); // Gian cuối cùng (Last bay)

        bracedBays.forEach(bay => {
            // Giằng cột chữ X (Wall X-Bracing)
            for (let side = 0; side < 2; side++) {
                const n1_id = `f${bay}-${side === 0 ? 'n1' : 'n2'}`; // Dưới
                const n2_id = `f${bay+1}-${side === 0 ? 'n1' : 'n2'}`;
                const n3_id = `f${bay}-${side === 0 ? 'n3' : 'n4'}`; // Trên
                const n4_id = `f${bay+1}-${side === 0 ? 'n3' : 'n4'}`;
                
                p.members.push({ id: `wbr-${bay}-${side}-1`, label: 'Giằng tường (Wall Brace)', type: 'brace', role: 'BRACING', startNode: n1_id, endNode: n4_id, sectionId: 'sec-purlin' });
                p.members.push({ id: `wbr-${bay}-${side}-2`, label: 'Giằng tường (Wall Brace)', type: 'brace', role: 'BRACING', startNode: n2_id, endNode: n3_id, sectionId: 'sec-purlin' });
            }
            
            // Giằng mái chữ X (Roof X-Bracing)
            for (let side = 0; side < 2; side++) {
                const n3_id = `f${bay}-${side === 0 ? 'n3' : 'n4'}`; // Mép mái (Eave)
                const n4_id = `f${bay+1}-${side === 0 ? 'n3' : 'n4'}`;
                const n5_id = `f${bay}-n5`; // Đỉnh mái (Ridge)
                const n6_id = `f${bay+1}-n5`;
                
                p.members.push({ id: `rbr-${bay}-${side}-1`, label: 'Giằng mái (Roof Brace)', type: 'brace', role: 'BRACING', startNode: n3_id, endNode: n6_id, sectionId: 'sec-purlin' });
                p.members.push({ id: `rbr-${bay}-${side}-2`, label: 'Giằng mái (Roof Brace)', type: 'brace', role: 'BRACING', startNode: n4_id, endNode: n5_id, sectionId: 'sec-purlin' });
            }
        });

        // Dầm sàn (Floor Beam)
        p.members.push({ id: 'm-beam', label: 'Dầm sàn (Floor Beam)', type: 'beam', role: 'PRIMARY', length: p.legacyInputs.beamParams?.L_beam || 9 });

        // 4. TRƯỜNG HỢP TẢI TRỌNG VÀ TỔ HỢP TẢI TRỌNG (LOAD CASES & COMBINATIONS)
        p.loadCases.push({ id: 'lc-g', name: 'Tĩnh tải (Dead Load)', category: 'DEAD', factor: 1.05 });
        p.loadCases.push({ id: 'lc-q', name: 'Hoạt tải mái (Live Load)', category: 'LIVE', factor: 1.30 });
        p.loadCases.push({ id: 'lc-wX', name: 'Gió X (Wind X)', category: 'WIND', factor: 2.10 });
        p.loadCases.push({ id: 'lc-wY', name: 'Gió Y (Wind Y)', category: 'WIND', factor: 2.10 });

        // Tự động sinh tổ hợp TCVN 2737:2023
        if (window.CodeManager_TCVN2737) {
            const autoCombos = window.CodeManager_TCVN2737.generateCombinations(p.loadCases);
            p.loadCombinations.push(...autoCombos);
        }

        // Ánh xạ từ các trường hợp tải kế thừa
        if (legacyState.forces && legacyState.forces.length > 0) {
            legacyState.forces.forEach((f, idx) => {
                p.loadCombinations.push({
                    id: `comb-${idx+1}`,
                    name: f.name || `Tổ hợp tải trọng ${idx+1}`,
                    category: 'ULS (Cơ bản)',
                    legacyForce: f,
                    factors: []
                });
            });
        }

        // 5. CHẠY ĐỘNG CƠ TÍNH TOÁN (ENGINE ADAPTER INTEGRATION)
        if (window.EngineAdapter) {
            p.designResults = window.EngineAdapter.runAllCalculations(p);
        }
        
        // Kiểm tra hợp lệ ban đầu
        p.validationResults = this.validateProject(p);

        return p;
    },

    validateProject: function(p) {
        const issues = [];
        if (p.materials.length === 0) issues.push({ id: 'v1', severity: 'ERROR', category: 'MODEL', message: 'Thiếu vật liệu (Missing Material)' });
        if (p.sections.length === 0) issues.push({ id: 'v2', severity: 'WARNING', category: 'MODEL', message: 'Chưa có tiết diện (No Sections)' });
        if (p.nodes.length === 0) issues.push({ id: 'v3', severity: 'CRITICAL', category: 'MODEL', message: 'Mô hình chưa có nút (No Nodes)' });
        if (p.loadCombinations.length === 0) issues.push({ id: 'v4', severity: 'WARNING', category: 'LOAD', message: 'Chưa có tổ hợp tải trọng (No Load Combinations)' });

        const errorCount = issues.filter(i => i.severity === 'ERROR' || i.severity === 'CRITICAL').length;
        return {
            status: errorCount > 0 ? 'LỖI (ERROR)' : (issues.length > 0 ? 'CẢNH BÁO (WARNING)' : 'ĐẠT (PASS)'),
            issues: issues
        };
    },

    logAudit: function(project, action, object, oldValue, newValue, user = "Hệ thống (System)") {
        project.auditLog.push({
            id: generateId(),
            timestamp: new Date().toISOString(),
            user,
            action,
            object,
            oldValue,
            newValue
        });
    }
};