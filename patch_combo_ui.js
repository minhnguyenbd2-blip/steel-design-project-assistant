const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/LoadCombinationManager.jsx', 'utf8');

c = c.replace(
    /\{\/\* Fallback to legacy force name since true factors aren't generated yet \*\/\}\s*\{combo\.legacyForce \? combo\.legacyForce\.name : '1\.0 G \+ 1\.0 Q'\}/,
    `{window.TCVN2737_2023 && !combo.legacyForce ? window.TCVN2737_2023.formatCombinationFormula(combo, workspaceState.loadCases) : (combo.legacyForce ? combo.legacyForce.name : '--')}`
);

c = c.replace(
    /<td className="p-3 font-mono text-slate-500">\{combo\.id\}<\/td>/,
    `<td className="p-3 font-mono text-slate-500 text-xs">
                                            {combo.id}
                                            {combo.legacyForce && <span className="block mt-1 text-[10px] text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/30 px-1 rounded inline-block">LEGACY MAP</span>}
                                        </td>`
);

c = c.replace(
    /Các tổ hợp tải trọng trên hiện đang được ánh xạ trực tiếp từ bộ Tính toán Nội lực cũ để đảm bảo tính tương thích \(Regression Safety\)\. Trình tạo tổ hợp tự động \(Auto-Generator\) theo TCVN 2737:2023 sẽ được mở khóa ở bản cập nhật tiếp theo\./,
    `Trình tạo tổ hợp (Auto-Generator) theo TCVN 2737:2023 đã được kích hoạt. Các tổ hợp "auto-X" được sinh ra tự động từ các Load Cases. Các tổ hợp "comb-X" (LEGACY MAP) được ánh xạ từ hệ thống cũ để tương thích ngược.`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/LoadCombinationManager.jsx', c, 'utf8');