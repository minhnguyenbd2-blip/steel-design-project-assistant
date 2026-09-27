const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

// Replace all occurrences of setProjectState that modify `inputs:` to also set `results: { ...prev.results, isStale: true }`
// But regex might be tricky. Let's do a more robust approach:
// We can just add a global hook for `onChange` or update the state setter.
// Or simply replace `{ ...prev.inputs, ` with `{ ...prev.inputs, ` and then append `results: { ...prev.results, isStale: true }, `
// Wait, `inputs: { ...prev.inputs` is safe to replace.
c = c.replace(/inputs: \{ \.\.\.prev\.inputs/g, 'results: { ...prev.results, isStale: true }, inputs: { ...prev.inputs');

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');