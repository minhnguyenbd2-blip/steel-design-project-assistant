const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', 'utf8');

const regexRaycaster = /let cHex = mesh\.userData\.member\.type === 'column' \? 0x64748b : 0x94a3b8;/;
const replaceRaycaster = `let cHex = 0x94a3b8;
                if (mesh.userData.member.role === 'PRIMARY') {
                    cHex = mesh.userData.member.type === 'column' ? 0x64748b : 0x475569;
                } else if (mesh.userData.member.role === 'SECONDARY') {
                    cHex = 0x94a3b8;
                } else if (mesh.userData.member.role === 'BRACING') {
                    cHex = 0xf87171;
                }`;

c = c.replace(regexRaycaster, replaceRaycaster);
fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', c, 'utf8');