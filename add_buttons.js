const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

c = c.replace(/\{rResults\.slabResult && rResults\.slabResult\.steps && \(/g, `
<div className="mt-8 flex justify-center print:hidden">
    <button onClick={runCalculations} className="bg-primary hover:bg-blue-700 text-white px-8 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95">
        <i data-lucide="calculator" className="w-5 h-5"></i> Cập nhật & Tính toán Sàn BTCT
    </button>
</div>
{rResults.slabResult && rResults.slabResult.steps && (`);

c = c.replace(/\{rResults\.beamResult && rResults\.beamResult\.steps && \(/g, `
<div className="mt-8 flex justify-center print:hidden">
    <button onClick={runCalculations} className="bg-primary hover:bg-blue-700 text-white px-8 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95">
        <i data-lucide="calculator" className="w-5 h-5"></i> Cập nhật & Tính toán Dầm Thép
    </button>
</div>
{rResults.beamResult && rResults.beamResult.steps && (`);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');