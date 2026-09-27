const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/WorkspaceLayout.jsx', 'utf8');

c = c.replace(
    /const WorkspaceLayout = \(\{ children, activeModule, onModuleChange, aiPanelOpen, toggleAiPanel, projectTitle \}\) => \{/,
    `const WorkspaceLayout = ({ children, activeModule, onModuleChange, aiPanelOpen, toggleAiPanel, projectTitle, workspaceState }) => {`
);

// Also fix the window.workspaceState -> workspaceState
c = c.replace(/window\.workspaceState/g, 'workspaceState');

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/components/WorkspaceLayout.jsx', c, 'utf8');