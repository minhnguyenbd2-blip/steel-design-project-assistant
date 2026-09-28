const fs = require('fs');
const parser = require('@babel/parser');
const path = require('path');

function checkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            checkDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            try {
                parser.parse(fs.readFileSync(fullPath, 'utf8'), {sourceType: 'module', plugins: ['jsx']});
            } catch(e) {
                console.error(`SYNTAX ERROR IN ${fullPath}:`);
                console.error(e.message);
            }
        }
    }
}
checkDir('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js');
console.log('Done checking all JS/JSX files.');