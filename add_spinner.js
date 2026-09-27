const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

c = c.replace(
    /\{\/\* Ph.*?n footer \*\/\}/g,
    `{isCalculating && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Đang tổng hợp nội lực & thiết kế...</h3>
                <p className="text-sm text-slate-500 mt-1">Hệ thống đang kiểm tra tự động hàng trăm tiết diện...</p>
            </div>
        </div>
    )}
    {/* Phần footer */}`
);

fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');