window.i18n = {
    vi: {
        // Sidebar & Layout
        workspace: "WORKSPACE",
        dashboard: "Tổng quan (Dashboard)",
        project: "Dự án (Project)",
        model: "Mô hình Kết cấu (Structural Model)",
        loads: "Tải trọng & Tổ hợp (Loads & Combinations)",
        analysis: "Phân tích (Analysis)",
        design: "Thiết kế Cấu kiện (Member Design)",
        report: "Thuyết minh (Report)",
        settings: "Cài đặt (Settings)",
        copilot: "Trợ lý AI (Copilot)",
        
        // Dashboard
        members: "Phần tử (Members)",
        loadCombos: "Tổ hợp tải (Load Combos)",
        maxUtilization: "Hệ số SD lớn nhất (Max Utilization)",
        issues: "Vấn đề (Issues)",
        workflowStatus: "Trạng thái Dự án (Workflow Status)",
        modelDef: "Định nghĩa Mô hình",
        loadsApplied: "Gán Tải trọng",
        analysisDone: "Phân tích Kết cấu",
        designDone: "Kiểm tra Thiết kế",
        complete: "Hoàn thành",
        pending: "Chờ xử lý",
        designSummary: "Tóm tắt Thiết kế (Design Summary)",
        noDesignData: "Chưa có kết quả thiết kế.\nVui lòng chạy tính toán để xem tóm tắt.",
        
        // AI Copilot
        aiTitle: "Trợ lý Kỹ thuật (Engineering Copilot)",
        aiContextActive: "Đã kết nối dữ liệu (Context active)",
        aiContextDesc: "Tôi đã được kết nối với mô hình kết cấu của bạn. Bạn có thể yêu cầu tôi giải thích tính toán, kiểm tra cấu kiện hoặc đề xuất tiết diện.",
        aiPlaceholder: "Hỏi AI Copilot...",
        
        // General Status & Warnings
        pass: "ĐẠT (PASS)",
        fail: "KHÔNG ĐẠT (FAIL)",
        warning: "CẢNH BÁO (WARNING)",
        error: "LỖI (ERROR)",
        critical: "NGHIÊM TRỌNG (CRITICAL)",
        notAnalyzed: "CHƯA PHÂN TÍCH (NOT ANALYZED)",
        noData: "CHƯA CÓ DỮ LIỆU (NO DATA)",
        calculating: "ĐANG TÍNH (CALCULATING)"
    }
};

window.t = (key) => {
    return window.i18n.vi[key] || key;
};