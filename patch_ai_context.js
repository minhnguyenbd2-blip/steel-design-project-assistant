const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/WorkspaceLayout.jsx', 'utf8');

c = c.replace(
    /<p>{window\.t\('aiContextDesc'\)}<\/p>/,
    `<p>{window.t('aiContextDesc')}</p>
                            
                            <div className="mt-3 space-y-1 text-xs opacity-80 border-t border-blue-200/50 dark:border-blue-800/50 pt-2 font-mono">
                                <div className="flex justify-between"><span>Nodes:</span> <span>{window.workspaceState?.nodes?.length || 0}</span></div>
                                <div className="flex justify-between"><span>Members:</span> <span>{window.workspaceState?.members?.length || 0}</span></div>
                                <div className="flex justify-between"><span>Combinations:</span> <span>{window.workspaceState?.loadCombinations?.length || 0}</span></div>
                                <div className="flex justify-between"><span>Issues:</span> <span className={window.workspaceState?.validationResults?.issues?.length > 0 ? 'text-red-500 font-bold' : ''}>{window.workspaceState?.validationResults?.issues?.length || 0}</span></div>
                            </div>`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/WorkspaceLayout.jsx', c, 'utf8');