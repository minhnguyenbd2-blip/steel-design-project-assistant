const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/WorkspaceLayout.jsx', 'utf8');

c = c.replace(
    /<div className="flex justify-between"><span>Issues:<\/span> <span className=\{workspaceState\?\.validationResults\?\.issues\?\.length > 0 \? 'text-red-500 font-bold' : ''\}>\{workspaceState\?\.validationResults\?\.issues\?\.length \|\| 0\}<\/span><\/div>/,
    `<div className="flex justify-between"><span>Issues:</span> <span className={workspaceState?.validationResults?.issues?.length > 0 ? 'text-red-500 font-bold' : ''}>{workspaceState?.validationResults?.issues?.length || 0}</span></div>
                                <div className="flex justify-between mt-1 pt-1 border-t border-blue-200/30 dark:border-blue-800/30">
                                    <span>Analyzed:</span> 
                                    <span>{workspaceState?.designResults ? Object.values(workspaceState.designResults).filter(r => r.analysisStatus === 'ANALYZED').length : 0}</span>
                                </div>
                                <div className="flex justify-between text-red-500">
                                    <span>Failed:</span> 
                                    <span className="font-bold">{workspaceState?.designResults ? Object.values(workspaceState.designResults).filter(r => r.designStatus === 'FAIL').length : 0}</span>
                                </div>`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/WorkspaceLayout.jsx', c, 'utf8');