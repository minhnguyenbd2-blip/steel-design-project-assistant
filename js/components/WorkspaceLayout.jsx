// js/components/WorkspaceLayout.jsx

const WorkspaceLayout = ({ children, activeModule, onModuleChange, aiPanelOpen, toggleAiPanel, projectTitle }) => {
    const modules = [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
        { id: 'project', label: 'Project', icon: 'folder-open' },
        { id: 'model', label: 'Structural Model', icon: 'box' },
        { id: 'loads', label: 'Loads & Combinations', icon: 'wind' },
        { id: 'analysis', label: 'Analysis', icon: 'activity' },
        { id: 'design', label: 'Member Design', icon: 'check-square' },
        { id: 'report', label: 'Report', icon: 'file-text' }
    ];

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-800 dark:text-slate-200">
            {/* LEFT SIDEBAR */}
            <div className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col z-20 shadow-sm">
                <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2 text-primary font-bold text-lg">
                        <i data-lucide="hexagon" className="w-6 h-6"></i>
                        <span>STEEL DESIGN</span>
                    </div>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Workspace</div>
                    <nav className="space-y-1">
                        {modules.map(mod => (
                            <button
                                key={mod.id}
                                onClick={() => onModuleChange(mod.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    activeModule === mod.id 
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                                }`}
                            >
                                <i data-lucide={mod.icon} className="w-4 h-4"></i>
                                {mod.label}
                            </button>
                        ))}
                    </nav>
                </div>
                
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-xs truncate font-medium text-slate-500" title={projectTitle}>
                        {projectTitle}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
                <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
                    <h1 className="text-xl font-bold">{modules.find(m => m.id === activeModule)?.label}</h1>
                    <div className="flex items-center gap-3">
                        <button className="text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors" title="Settings">
                            <i data-lucide="settings" className="w-5 h-5"></i>
                        </button>
                        <button 
                            onClick={toggleAiPanel}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                                aiPanelOpen 
                                ? 'bg-primary text-white shadow-md' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                            }`}
                        >
                            <i data-lucide="sparkles" className="w-4 h-4"></i>
                            Copilot
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 relative">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* RIGHT AI PANEL */}
            {aiPanelOpen && (
                <div className="w-80 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col z-20 shadow-xl transition-all">
                    <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="flex items-center gap-2 font-bold text-primary">
                            <i data-lucide="bot" className="w-5 h-5"></i>
                            Engineering Copilot
                        </div>
                        <button onClick={toggleAiPanel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <i data-lucide="x" className="w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 p-3 rounded-lg text-sm border border-blue-100 dark:border-blue-800/50">
                            <p className="font-bold mb-1 flex items-center gap-1"><i data-lucide="info" className="w-4 h-4"></i> Context active</p>
                            <p>I am connected to your structural model. You can ask me to explain calculations, review members, or suggest sections.</p>
                        </div>
                        {/* Placeholder chat messages */}
                    </div>

                    <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                        <div className="relative">
                            <input type="text" placeholder="Ask AI..." className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-2 pl-4 pr-10 text-sm outline-none focus:border-primary" />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-blue-700">
                                <i data-lucide="send" className="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

window.WorkspaceLayout = WorkspaceLayout;