const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

const target = "</main>\r\n        </div>\r\n    );\r\n}\r\n\r\nclass ErrorBoundary";
const replacement = `</main>
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

// We must accommodate \n or \r\n
c = c.replace(/<\/main>[\s\r\n]*<\/div>[\s\r\n]*\);[\s\r\n]*\}[\s\r\n]*class ErrorBoundary/, replacement);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');