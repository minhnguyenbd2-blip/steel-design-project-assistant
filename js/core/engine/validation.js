// Centralized Validation Layer for Steel Design Project Assistant
// Hỗ trợ kiểm tra dữ liệu đầu vào và báo lỗi trực quan theo từng ô nhập liệu (Field-level highlighting)

const FieldNames = {
    L: 'Nhịp khung ngang L (m)',
    B: 'Bước cột khung B (m)',
    length: 'Chiều dài công trình (m)',
    H_column: 'Chiều cao đỉnh cột H_column (m)',
    H_roof: 'Chiều cao đỉnh mái H_roof (m)',
    roofSlope: 'Độ dốc mái i (%)',
    windZone: 'Vùng gió (TCVN 2737:2023)',
    terrainCategory: 'Dạng địa hình (A, B, C)',
    steelGrade: 'Mác thép kết cấu (S235, S275, S355)'
};

const ValidationRules = {
    L: { required: true, min: 1, max: 150, type: 'number', message: 'Nhịp khung ngang (L) phải là số dương hợp lý (1m - 150m).' },
    B: { required: true, min: 1, max: 50, type: 'number', message: 'Bước cột khung (B) phải là số dương hợp lý (1m - 50m).' },
    length: { required: true, min: 1, max: 500, type: 'number', message: 'Chiều dài nhà phải là số dương hợp lý (1m - 500m).' },
    H_column: { required: true, min: 1, max: 50, type: 'number', message: 'Chiều cao đỉnh cột (H_column) phải lớn hơn 0 (1m - 50m).' },
    H_roof: { required: true, min: 1, max: 60, type: 'number', message: 'Chiều cao đỉnh mái (H_roof) phải lớn hơn 0 (1m - 60m).' },
    roofSlope: { required: false, min: 0, max: 100, type: 'number', message: 'Độ dốc mái (i) phải từ 0% đến 100%.' },
    windZone: { required: true, allowed: ['I', 'II', 'III', 'IV', 'V'], type: 'string', message: 'Vùng gió không hợp lệ (chỉ chấp nhận I, II, III, IV, V).' },
    terrainCategory: { required: true, allowed: ['A', 'B', 'C'], type: 'string', message: 'Dạng địa hình không hợp lệ (chỉ chấp nhận A, B, C theo Bảng 8 TCVN 2737:2023).' },
    steelGrade: { required: true, allowed: ['S235', 'S275', 'S355'], type: 'string', message: 'Mác thép không hợp lệ (chỉ hỗ trợ S235, S275, S355).' }
};

function validateInputs(inputs) {
    const errors = [];
    const fieldErrors = {};

    if (!inputs || typeof inputs !== 'object') {
        return {
            isValid: false,
            errors: ['Dữ liệu đầu vào không hợp lệ hoặc rỗng.'],
            fieldErrors: { global: 'Dữ liệu đầu vào rỗng.' }
        };
    }

    // Tự động tính toán hoặc đồng bộ roofSlope nếu thiếu nhưng có H_roof, H_column, L
    if (inputs.roofSlope === undefined || inputs.roofSlope === null || inputs.roofSlope === '') {
        const H_rf = Number(inputs.H_roof);
        const H_col = Number(inputs.H_column);
        const L_span = Number(inputs.L);
        if (!isNaN(H_rf) && !isNaN(H_col) && !isNaN(L_span) && L_span > 0) {
            const rise = Math.max(0, H_rf - H_col);
            inputs.roofSlope = Number(((rise / (L_span / 2)) * 100).toFixed(2));
        }
    }

    for (const [key, rules] of Object.entries(ValidationRules)) {
        const val = inputs[key];
        const fieldName = FieldNames[key] || key;
        
        if (rules.required && (val === null || val === undefined || val === '')) {
            const msg = `Vui lòng nhập: ${fieldName}`;
            errors.push(msg);
            fieldErrors[key] = msg;
            continue;
        }

        if (val !== null && val !== undefined && val !== '') {
            if (rules.type === 'number') {
                const numVal = Number(val);
                if (isNaN(numVal) || !isFinite(numVal)) {
                    const msg = `${fieldName} phải là một số hợp lệ.`;
                    errors.push(msg);
                    fieldErrors[key] = msg;
                    continue;
                }
                if (rules.min !== undefined && numVal < rules.min) {
                    errors.push(rules.message);
                    fieldErrors[key] = rules.message;
                    continue;
                }
                if (rules.max !== undefined && numVal > rules.max) {
                    errors.push(rules.message);
                    fieldErrors[key] = rules.message;
                    continue;
                }
            }

            if (rules.type === 'string' && rules.allowed) {
                if (!rules.allowed.includes(val)) {
                    errors.push(rules.message);
                    fieldErrors[key] = rules.message;
                    continue;
                }
            }
        }
    }

    // Logic kiểm tra tương quan hình học mái
    const H_col = Number(inputs.H_column);
    const H_rf = Number(inputs.H_roof);
    if (!isNaN(H_col) && !isNaN(H_rf)) {
        if (H_rf <= H_col) {
            const msg = `Lỗi hình học mái: Chiều cao đỉnh mái (H_roof = ${H_rf} m) phải lớn hơn chiều cao đỉnh cột (H_column = ${H_col} m) để tạo độ dốc thoát nước mái.`;
            errors.push(msg);
            fieldErrors['H_roof'] = `Phải lớn hơn chiều cao cột (${H_col} m)`;
            fieldErrors['H_column'] = `Phải nhỏ hơn chiều cao đỉnh mái (${H_rf} m)`;
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
        fieldErrors: fieldErrors
    };
}

window.validateInputs = validateInputs;
window.ValidationRules = ValidationRules;
window.FieldNames = FieldNames;
