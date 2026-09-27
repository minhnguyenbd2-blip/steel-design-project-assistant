const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

// We need to inject state hooks for the new WorkspaceLayout at the top of App()
const hookInjection = `
    // WORKSPACE MIGRATION STATES
    const [activeModule, setActiveModule] = useState('dashboard');
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [workspaceState, setWorkspaceState] = useState(() => (window.WorkspaceModel ? window.WorkspaceModel.fromLegacyState(ProjectState) : null));

    // Update workspaceState whenever projectState changes (migration bridge)
    useEffect(() => {
        if (window.WorkspaceModel) {
            setWorkspaceState(window.WorkspaceModel.fromLegacyState(projectState));
        }
    }, [projectState]);

    const handleModuleChange = (modId) => {
        setActiveModule(modId);
        // Sync legacy tabs
        if (modId === 'project' || modId === 'model') setActiveTab('input');
        if (modId === 'loads') setActiveTab('loads');
        if (modId === 'combinations' || modId === 'analysis') setActiveTab('forces');
        if (modId === 'design') setActiveTab('slab'); // Default to slab
        if (modId === 'report') setActiveTab('report');
    };
`;

c = c.replace(/const \[activeTab, setActiveTab\] = usePersistentState[^;]+;/, "$&\n" + hookInjection);

// Now wrap the return in WorkspaceLayout.
// Find the main `return (` and replace it.
const returnPattern = /return \(\s*<div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 text-slate-800 dark:text-slate-200 font-sans">/;

// We will inject the WorkspaceLayout opening, and then if activeModule is dashboard, render Dashboard. Else render the legacy UI.
const layoutStart = `
    const legacyUI = (
        <div className="w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-200 text-slate-800 dark:text-slate-200 font-sans">
`;
c = c.replace(returnPattern, layoutStart);

// At the very end of the App component, we close legacyUI and return WorkspaceLayout.
const endOfAppPattern = /}(\s*)<\/div>\s*\);\s*}\s*class ErrorBoundary/;
const layoutEnd = `}
        </div>
    );

    const WorkspaceLayout = window.WorkspaceLayout || (({children}) => <div>{children}</div>);
    const Dashboard = window.Dashboard || (() => <div>Loading Dashboard...</div>);

    return (
        <WorkspaceLayout 
            activeModule={activeModule} 
            onModuleChange={handleModuleChange}
            aiPanelOpen={aiPanelOpen}
            toggleAiPanel={() => setAiPanelOpen(!aiPanelOpen)}
            projectTitle={rMeta.projectName || "Steel Design Project"}
        >
            {activeModule === 'dashboard' ? (
                workspaceState ? <Dashboard workspaceState={workspaceState} /> : <div>Initializing Workspace...</div>
            ) : (
                legacyUI
            )}
        </WorkspaceLayout>
    );
}
class ErrorBoundary`;
c = c.replace(endOfAppPattern, layoutEnd);

// Also, the legacy UI has a sticky header and nav bar that we might want to hide when using Workspace layout, but for now, it's fine. We can add a class to hide them if activeModule is used.
c = c.replace(/<header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-20 print:hidden shadow-sm">/, '<header className="hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-20 print:hidden shadow-sm">');

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');