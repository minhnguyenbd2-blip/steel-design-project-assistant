// Centralized Validation Layer

const ValidationRules = {
    L: { required: true, min: 1, max: 150, type: 'number', message: 'Nhịp khung (L) phải là số dương hợp lý (1m - 150m).' },
    B: { required: true, min: 1, max: 50, type: 'number', message: 'Bước cột (B) phải là số dương hợp lý (1m - 50m).' },
    length: { required: true, min: 1, type: 'number', message: 'Chiều dài nhà phải là số dương.' },
    H_column: { required: true, min: 1, type: 'number', message: 'Chiều cao đỉnh cột phải > 0.' },
    H_roof: { required: true, min: 1, type: 'number', message: 'Chiều cao đỉnh mái phải > 0.' },
    roofSlope: { required: true, min: 0, max: 100, type: 'number', message: 'Độ dốc mái phải từ 0% đến 100%.' },
    windZone: { required: true, allowed: ['I', 'II', 'III', 'IV', 'V'], type: 'string', message: 'Vùng gió không hợp lệ.' },
    terrainCategory: { required: true, allowed: ['A', 'B', 'C'], type: 'string', message: 'Dạng địa hình không hợp lệ.' },
    steelGrade: { required: true, allowed: ['S235', 'S275', 'S355'], type: 'string', message: 'Mác thép không hợp lệ hoặc chưa hỗ trợ.' }
};

function validateInputs(inputs) {
    const errors = [];
    
    for (const [key, rules] of Object.entries(ValidationRules)) {
        const val = inputs[key];
        
        if (rules.required && (val === null || val === undefined || val === '')) {
            errors.push(`Thiếu thông tin: ${key}`);
            continue;
        }

        if (rules.type === 'number') {
            if (isNaN(val) || !isFinite(val)) {
                errors.push(`Trường ${key} phải là một số hợp lệ.`);
                continue;
            }
            if (rules.min !== undefined && val <= rules.min) {
                errors.push(rules.message);
            }
            if (rules.max !== undefined && val > rules.max) {
                errors.push(rules.message);
            }
        }

        if (rules.type === 'string' && rules.allowed) {
            if (!rules.allowed.includes(val)) {
                errors.push(rules.message);
            }
        }
    }

    // Logic kiểm tra tương quan hình học
    if (inputs.H_roof !== null && inputs.H_column !== null) {
        if (inputs.H_roof < inputs.H_column) {
            errors.push('Lỗi cấu tạo: Chiều cao đỉnh mái không được nhỏ hơn chiều cao đỉnh cột.');
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

window.validateInputs = validateInputs;
