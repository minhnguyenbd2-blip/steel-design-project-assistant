// workspace_model.js
const generateId = () => Math.random().toString(36).substr(2, 9);

window.WorkspaceModel = {
    createEmptyProject: function() {
        return {
            metadata: {
                id: generateId(),
                name: "New Project",
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
            validationResults: { status: 'UNKNOWN', issues: [] },
            auditLog: [],
            // Preserve legacy inputs to feed to the existing engine without breaking it
            legacyInputs: {} 
        };
    },

    // Convert legacy ProjectState to new Canonical Data Model
    fromLegacyState: function(legacyState) {
        const p = this.createEmptyProject();
        p.metadata.name = legacyState.meta?.projectName || "Migrated Project";
        p.metadata.author = legacyState.meta?.studentName || "User";
        
        p.legacyInputs = JSON.parse(JSON.stringify(legacyState.inputs || {}));
        
        // Populate base materials
        const steelGrade = p.legacyInputs.steelGrade || "S235";
        p.materials.push({
            id: 'mat-steel-main',
            name: steelGrade,
            type: 'steel'
        });

        // Map Geometry to Nodes & Members
        const L = p.legacyInputs.L || 25;
        const H_col = p.legacyInputs.H_column || 8;
        const H_roof = p.legacyInputs.H_roof || 9.25;

        // Create main frame nodes (2D X-Z plane)
        p.nodes = [
            { id: 'n1', x: 0, y: 0, z: 0, label: 'Base L' },
            { id: 'n2', x: L, y: 0, z: 0, label: 'Base R' },
            { id: 'n3', x: 0, y: 0, z: H_col, label: 'Eave L' },
            { id: 'n4', x: L, y: 0, z: H_col, label: 'Eave R' },
            { id: 'n5', x: L/2, y: 0, z: H_roof, label: 'Apex' }
        ];

        // Create Supports
        p.supports = [
            { id: 'sup1', nodeId: 'n1', type: 'fixed' },
            { id: 'sup2', nodeId: 'n2', type: 'fixed' }
        ];

        // Create Members
        p.members = [
            { id: 'm-col1', label: 'Column Left', type: 'column', startNode: 'n1', endNode: 'n3', materialId: 'mat-steel-main' },
            { id: 'm-col2', label: 'Column Right', type: 'column', startNode: 'n2', endNode: 'n4', materialId: 'mat-steel-main' },
            { id: 'm-raf1', label: 'Rafter Left', type: 'beam', startNode: 'n3', endNode: 'n5', materialId: 'mat-steel-main' },
            { id: 'm-raf2', label: 'Rafter Right', type: 'beam', startNode: 'n5', endNode: 'n4', materialId: 'mat-steel-main' },
            // Disconnected conceptual members for legacy checking
            { id: 'm-purlin', label: 'Roof Purlin', type: 'purlin', length: p.legacyInputs.B || 9 },
            { id: 'm-beam', label: 'Floor Beam', type: 'beam', length: p.legacyInputs.beamParams?.L_beam || 9 },
            { id: 'm-slab', label: 'Floor Slab', type: 'slab', lengthX: p.legacyInputs.slabParams?.L1, lengthY: p.legacyInputs.slabParams?.L2 }
        ];

        // Legacy forces mapped to combinations
        if (legacyState.forces && legacyState.forces.length > 0) {
            legacyState.forces.forEach((f, idx) => {
                p.loadCombinations.push({
                    id: `comb-${idx+1}`,
                    name: f.name || `Tổ hợp ${idx+1}`,
                    type: 'ULS',
                    legacyForce: f
                });
            });
        }

        return p;
    },

    logAudit: function(project, action, object, oldValue, newValue, user = "System") {
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