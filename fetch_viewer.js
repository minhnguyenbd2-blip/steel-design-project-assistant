const https = require('https');
const fs = require('fs');

https.get('https://minhnguyenbd2-blip.github.io/steel-design-project-assistant/js/components/Workspace3DViewer.jsx', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('downloaded_viewer.jsx', data, 'utf8');
        try {
            require('@babel/parser').parse(data, {sourceType: 'module', plugins: ['jsx']});
            console.log('Syntax OK');
        } catch(e) {
            console.error('ERROR AT:', e.loc.line, ':', e.loc.column);
            console.error(data.split('\n')[e.loc.line - 1]);
            console.error(e.message);
        }
    });
});