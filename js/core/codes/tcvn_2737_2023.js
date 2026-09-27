// js/core/codes/tcvn_2737_2023.js
// Tiêu chuẩn Tải trọng và Tác động (TCVN 2737:2023)

window.CodeManager_TCVN2737 = {
    codeName: 'TCVN 2737:2023',
    description: 'Tải trọng và tác động - Tiêu chuẩn thiết kế',
    
    // Auto-generate Load Combinations based on provided Load Cases
    generateCombinations: function(loadCases) {
        const combinations = [];
        let comboCount = 1;

        const deadCases = loadCases.filter(lc => lc.category === 'DEAD');
        const liveCases = loadCases.filter(lc => lc.category === 'LIVE' || lc.category === 'ROOF');
        const windCases = loadCases.filter(lc => lc.category === 'WIND');
        
        // Helper to format factors
        const createCombo = (name, type, activeCases, notes) => {
            return {
                id: `auto-${comboCount++}`,
                name: name,
                category: type, // ULS or SLS
                factors: activeCases.map(c => ({ caseId: c.lc.id, factor: c.factor })),
                codeReference: 'TCVN 2737:2023',
                legacyForce: null, // Marks it as auto-generated, not legacy mapped
                notes: notes
            };
        };

        // For ULS (Trạng thái giới hạn thứ nhất)
        
        // 1. Tĩnh tải duy nhất (Nếu không có hoạt tải)
        if (deadCases.length > 0 && liveCases.length === 0 && windCases.length === 0) {
            combinations.push(createCombo(
                `THCB1: Tĩnh tải`, 
                'ULS', 
                deadCases.map(lc => ({ lc, factor: lc.factor || 1.1 })), 
                'Tổ hợp cơ bản 1'
            ));
        }

        // 2. Tổ hợp cơ bản 1 (THCB1): 1 Tĩnh tải + 1 Hoạt tải (hoặc Gió)
        const allTransients = [...liveCases, ...windCases];
        allTransients.forEach(transient => {
            const active = deadCases.map(lc => ({ lc, factor: lc.factor || 1.1 }));
            active.push({ lc: transient, factor: transient.factor || 1.2 });
            
            combinations.push(createCombo(
                `THCB1: TT + ${transient.name}`, 
                'ULS', 
                active, 
                'THCB1 (1 Hoạt tải)'
            ));
        });

        // 3. Tổ hợp cơ bản 2 (THCB2): 1 Tĩnh tải + >= 2 Hoạt tải (hoặc Gió) (Hệ số tổ hợp 0.9)
        if (allTransients.length >= 2) {
            // For simplicity in Phase 4, we generate TT + TẤT CẢ Hoạt tải
            const active = deadCases.map(lc => ({ lc, factor: lc.factor || 1.1 }));
            allTransients.forEach(t => {
                active.push({ lc: t, factor: (t.factor || 1.2) * 0.9 });
            });
            combinations.push(createCombo(
                `THCB2: TT + 0.9*(Tất cả HT & Gió)`, 
                'ULS', 
                active, 
                'THCB2 (>=2 Hoạt tải)'
            ));
        }

        return combinations;
    },

    formatCombinationFormula: function(combo, loadCases) {
        if (!combo.factors || combo.factors.length === 0) {
            return combo.legacyForce ? combo.legacyForce.name : 'Empty';
        }
        
        return combo.factors.map(f => {
            const lc = loadCases.find(l => l.id === f.caseId);
            const lcName = lc ? lc.name : f.caseId;
            return `${f.factor.toFixed(2)} * [${lcName}]`;
        }).join(' + ');
    }
};