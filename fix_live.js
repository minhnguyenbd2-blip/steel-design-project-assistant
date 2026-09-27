const fs = require('fs');
let c = fs.readFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', 'utf8');

const injection = `
                        {/* Kết quả kiểm tra Tôn & Xà gồ (Tính toán trực tiếp - Live) */}
                        {(() => {
                            const liveCladdingProfile = StandardData.TCVN2737_2023.PurlinAndCladding.sheetProfiles.find(s => s.id === rInputs.selectedCladdingId) || StandardData.TCVN2737_2023.PurlinAndCladding.sheetProfiles[4];
                            const livePurlinProfile = StandardData.TCVN2737_2023.PurlinAndCladding.purlinProfiles.find(p => p.id === rInputs.selectedPurlinId) || StandardData.TCVN2737_2023.PurlinAndCladding.purlinProfiles[9];
                            const W0_val = StandardData.TCVN2737_2023.Wind.BasicWind.getW0(rInputs.windZone).value;
                            const kz_roof = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(rInputs.H_roof, rInputs.terrainCategory).value;
                            const alphaDeg = Math.atan((rInputs.H_roof - rInputs.H_column) / (rInputs.L / 2)) * 180 / Math.PI;
                            let minCnet = -1.372;
                            if (rResults.traces && rResults.traces.windCases && rResults.traces.windCases['+X']) {
                                const roofZones = rResults.traces.windCases['+X'].surfaces.filter(s => s.surface === 'Mái');
                                if(roofZones.length > 0) minCnet = Math.min(...roofZones.map(r => r.c_net));
                            }
                            const liveCladdingResult = PurlinCladdingEngine.designRoofCladding(liveCladdingProfile, rInputs.purlinSpacing, alphaDeg, W0_val, kz_roof, minCnet);
                            const livePurlinResult = PurlinCladdingEngine.designPurlin(livePurlinProfile, liveCladdingProfile, rInputs.purlinSpacing, rInputs.B, alphaDeg, W0_val, kz_roof, minCnet);

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t dark:border-slate-700">
                                    <div className="p-4 bg-blue-50 dark:bg-slate-900/80 rounded-lg border border-blue-200 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-white">Kiểm tra Tôn lợp: {liveCladdingResult.profile.name}</h4>
                                            <span className={\`text-xs px-2 py-0.5 rounded font-bold \${liveCladdingResult.isAllPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                                                {liveCladdingResult.isAllPass ? 'ĐẠT YÊU CẦU' : 'KHÔNG ĐẠT'}
                                            </span>
                                        </div>
                                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                            <div>• <strong>Tổ hợp 1 (TT tôn + Gió hút):</strong> M = {liveCladdingResult.combo1.M.toFixed(3)} kNm | σ = {liveCladdingResult.combo1.sigma.toFixed(2)} kN/cm² ≤ [f]={liveCladdingResult.profile.Ma} kN/cm² ({liveCladdingResult.combo1.isStrengthPass ? 'Đạt' : 'Kém bền'})</div>
                                            <div>• Độ võng gió: f/a = 1/{Math.round(1/liveCladdingResult.combo1.deflRatio)} ≤ [f/a]=1/150 ({liveCladdingResult.combo1.isDeflPass ? 'Đạt võng' : 'Võng lớn'})</div>
                                            <div className="text-[10px] italic pt-1">Ghi chú: Tổ hợp tính toán tôn không cộng trọng lượng xà gồ (đúng thực tế).</div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-emerald-50 dark:bg-slate-900/80 rounded-lg border border-emerald-200 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-white">Kiểm tra Xà gồ: {livePurlinResult.purlin.name}</h4>
                                            <span className={\`text-xs px-2 py-0.5 rounded font-bold \${livePurlinResult.isAllPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                                                {livePurlinResult.isAllPass ? 'ĐẠT YÊU CẦU' : 'KHÔNG ĐẠT'}
                                            </span>
                                        </div>
                                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                            <div>• <strong>Tổ hợp 1 (Gió hút nhổ):</strong> Mx = {livePurlinResult.combo1.Mx.toFixed(2)} kNm | σ = {livePurlinResult.combo1.sigma.toFixed(2)} kN/cm² ≤ {livePurlinResult.combo1.f_allow} kN/cm² ({livePurlinResult.combo1.isStrengthPass ? 'Đạt' : 'Vượt'})</div>
                                            <div>• <strong>Tổ hợp 2 (TT + HT mái):</strong> Mx = {livePurlinResult.combo2.Mx.toFixed(2)} kNm | σ = {livePurlinResult.combo2.sigma.toFixed(2)} kN/cm² ({livePurlinResult.combo2.isStrengthPass ? 'Đạt' : 'Vượt'})</div>
                                            <div>• Độ võng tổng hợp: f/B = 1/{Math.round(1/livePurlinResult.combo2.deflRatio)} ≤ [f/B]=1/200 ({livePurlinResult.combo2.isDeflPass ? 'Đạt võng' : 'Võng lớn'})</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
`;

const regex = /\{rResults\.claddingResult && rResults\.purlinResult && \([\s\S]*?\}\)\}\s*<\/div>\s*<\/div>/;

if (regex.test(c)) {
    c = c.replace(regex, `${injection}\n                      </div>`);
    fs.writeFileSync('e:/Model antigravity/Đồ án Thép/steel-design-assistant/js/app.jsx', c, 'utf8');
    console.log('Replaced successfully');
} else {
    console.log('Regex did not match');
}
