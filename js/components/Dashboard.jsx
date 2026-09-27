// js/components/Dashboard.jsx
const Dashboard = ({ workspaceState }) => {
    
    // Derived metrics
    const memberCount = workspaceState.members.length;
    const materialCount = workspaceState.materials.length;
    
    // Mocking status logic for now
    const statuses = [
        { name: window.t('modelDef'), complete: memberCount > 0 },
        { name: window.t('loadsApplied'), complete: workspaceState.loadCombinations.length > 0 },
        { name: window.t('analysisDone'), complete: Object.keys(workspaceState.analysisResults).length > 0 },
        { name: window.t('designDone'), complete: Object.keys(workspaceState.designResults).length > 0 },
    ];

    const warningCount = workspaceState.validationResults.issues.filter(i => i.severity === 'WARNING').length;
    const errorCount = workspaceState.validationResults.issues.filter(i => i.severity === 'ERROR').length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-between">
                        <span>{window.t('members')}</span>
                        <i data-lucide="layers" className="w-4 h-4 text-primary"></i>
                    </div>
                    <div className="text-3xl font-bold mt-2">{memberCount}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-between">
                        <span>{window.t('loadCombos')}</span>
                        <i data-lucide="wind" className="w-4 h-4 text-emerald-500"></i>
                    </div>
                    <div className="text-3xl font-bold mt-2">{workspaceState.loadCombinations.length}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-between">
                        <span>{window.t('maxUtilization')}</span>
                        <i data-lucide="activity" className="w-4 h-4 text-amber-500"></i>
                    </div>
                    <div className="text-3xl font-bold mt-2">--</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-between">
                        <span>{window.t('issues')}</span>
                        <i data-lucide="alert-triangle" className="w-4 h-4 text-red-500"></i>
                    </div>
                    <div className="text-3xl font-bold mt-2 text-red-500">{errorCount > 0 ? errorCount : warningCount}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                    <h3 className="font-bold text-lg border-b dark:border-slate-700 pb-3 mb-4">{window.t('workflowStatus')}</h3>
                    <div className="space-y-4">
                        {statuses.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-slate-700 dark:text-slate-300 font-medium">{s.name}</span>
                                {s.complete ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                                        <i data-lucide="check-circle" className="w-4 h-4"></i> {window.t('complete')}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        <i data-lucide="circle" className="w-4 h-4"></i> {window.t('pending')}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                    <h3 className="font-bold text-lg border-b dark:border-slate-700 pb-3 mb-4">{window.t('designSummary')}</h3>
                    <div className="flex flex-col items-center justify-center h-40 text-slate-500 dark:text-slate-400 text-sm text-center">
                        <i data-lucide="inbox" className="w-10 h-10 mb-2 opacity-50"></i>
                        <p className="whitespace-pre-line">{window.t('noDesignData')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.Dashboard = Dashboard;