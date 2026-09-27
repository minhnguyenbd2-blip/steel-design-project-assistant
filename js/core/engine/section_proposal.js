// Section Recommendation Engine

function proposeSectionsForDesign(forces, materialProps, L0x_m, L0y_m, options = {}) {
    // forces: { N, Mx, Vx } (Governing forces)
    
    // 1. Candidate Generation
    const candidates = [];
    
    const h_list = [300, 400, 500, 600, 700, 800, 900];
    const b_list = [200, 250, 300, 350, 400];
    const tw_list = [6, 8, 10, 12, 14];
    const tf_list = [8, 10, 12, 14, 16, 20];

    for (let h of h_list) {
        for (let b of b_list) {
            for (let tw of tw_list) {
                for (let tf of tf_list) {
                    if (b/h > 0.6 || b/h < 0.2) continue;
                    if (tf < tw) continue;
                    
                    const sec = createSectionRecord("I", `I Tổ hợp ${h}x${b}x${tw}x${tf}`, h, b, tw, tf, "Built-up Section");
                    candidates.push(sec);
                }
            }
        }
    }
    
    const validSections = [];
    
    // 2. Candidate Verification
    // Đánh giá tất cả candidates qua bộ kiểm tra tiết diện (bao gồm Bền, Ổn định tổng thể, Ổn định cục bộ)
    for (let sec of candidates) {
        const checkResult = checkSectionCapacity(sec, forces.N, forces.Mx, forces.Vx, materialProps, L0x_m, L0y_m);
        
        if (checkResult.isAllPass) {
            validSections.push({
                section: sec,
                source: sec.category,
                status: "PASS",
                massPerMeter: sec.massPerMeter,
                utilization: checkResult.utilization,
                checkResult: checkResult
            });
        }
    }
    
    // 3. Xếp hạng theo khối lượng
    validSections.sort((a, b) => a.section.massPerMeter - b.section.massPerMeter);
    
    // Trả về top 5
    return {
        candidates: validSections.slice(0, 5)
    };
}

var globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
globalScope.proposeSectionsForDesign = proposeSectionsForDesign;
