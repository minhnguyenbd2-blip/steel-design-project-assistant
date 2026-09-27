const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', 'utf8');

c = c.replace(
    /const \[selectedMember, setSelectedMember\] = useState\(null\);/,
    `const [selectedMember, setSelectedMember] = useState(null);
    const [viewMode, setViewMode] = useState('UTILIZATION'); // MODEL, UTILIZATION`
);

// We need to use viewMode inside the mesh creation. But mesh creation runs inside useEffect.
// Actually, useEffect currently depends on [workspaceState]. We should add viewMode.
c = c.replace(
    /\}, \[workspaceState\]\);/,
    `}, [workspaceState, viewMode]);`
);

c = c.replace(
    /const dr = workspaceState\.designResults \? workspaceState\.designResults\[m\.id\] : null;\s*if \(dr && dr\.analysisStatus === 'ANALYZED'\) \{[\s\S]*?\}/,
    `const dr = workspaceState.designResults ? workspaceState.designResults[m.id] : null;
                    if (viewMode === 'UTILIZATION' && dr && dr.analysisStatus === 'ANALYZED') {
                        if (dr.utilization <= 0.5) colorHex = 0x10b981; // Green
                        else if (dr.utilization <= 0.8) colorHex = 0xf59e0b; // Yellow
                        else if (dr.utilization <= 1.0) colorHex = 0xf97316; // Orange
                        else colorHex = 0xef4444; // Red
                    }`
);

// Raycaster color reset logic
c = c.replace(
    /const dr = workspaceState\.designResults \? workspaceState\.designResults\[mesh\.userData\.member\.id\] : null;\s*if \(dr && dr\.analysisStatus === 'ANALYZED'\) \{[\s\S]*?\}/,
    `const dr = workspaceState.designResults ? workspaceState.designResults[mesh.userData.member.id] : null;
                if (viewMode === 'UTILIZATION' && dr && dr.analysisStatus === 'ANALYZED') {
                    if (dr.utilization <= 0.5) cHex = 0x10b981;
                    else if (dr.utilization <= 0.8) cHex = 0xf59e0b;
                    else if (dr.utilization <= 1.0) cHex = 0xf97316;
                    else cHex = 0xef4444;
                }`
);

// Add Mode Toggle UI
c = c.replace(
    /<div className="absolute top-4 left-4 bg-white\/90 backdrop-blur dark:bg-slate-800\/90 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm z-10">/,
    `<div className="absolute top-4 left-4 bg-white/90 backdrop-blur dark:bg-slate-800/90 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm z-10">
                    <div className="flex gap-2 mb-2">
                        <button onClick={() => setViewMode('MODEL')} className={"px-2 py-1 text-xs font-bold rounded " + (viewMode === 'MODEL' ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300")}>Model</button>
                        <button onClick={() => setViewMode('UTILIZATION')} className={"px-2 py-1 text-xs font-bold rounded " + (viewMode === 'UTILIZATION' ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300")}>Utilization</button>
                    </div>`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/Workspace3DViewer.jsx', c, 'utf8');