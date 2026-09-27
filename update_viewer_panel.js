const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', 'utf8');

c = c.replace(
    /<div>\s*<label className="text-xs text-slate-500 block">Loại \(Type\)<\/label>\s*<div className="font-medium capitalize">\{selectedMember\.type\}<\/div>\s*<\/div>/,
    `<div>
                                <label className="text-xs text-slate-500 block">Loại (Type)</label>
                                <div className="font-medium capitalize">{selectedMember.type}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block">Vai trò (Role)</label>
                                <div className="font-medium font-bold text-primary">{selectedMember.role || 'N/A'}</div>
                            </div>`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', c, 'utf8');