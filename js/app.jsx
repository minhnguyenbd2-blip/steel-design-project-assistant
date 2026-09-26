// Main App Component with Workflow

const { useState, useEffect, useCallback } = React;

const STORAGE_KEY = "steel_design_assistant_project";

function usePersistentState(key, defaultValue) {
    const [state, setState] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved !== null) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Local storage read error", e);
        }
        return defaultValue;
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (e) {
            console.error("Local storage save error", e);
        }
    }, [key, state]);

    return [state, setState];
}

function App() {
    const [activeTab, setActiveTab] = usePersistentState(`${STORAGE_KEY}_tab`, 'input');
    const [theme, setTheme] = usePersistentState(`${STORAGE_KEY}_theme`, 'light');
    
    const [projectState, setProjectState] = usePersistentState(STORAGE_KEY, {
        ...ProjectState,
        inputs: { ...TestCase01.inputs },
        meta: { ...TestCase01.meta },
        roofComponents: [ ...TestCase01.roofComponents ],
        forces: [ ...TestCase01.forces ],
        assumptions: [ ...ProjectState.assumptions ]
    });

    const [validationErrors, setValidationErrors] = useState([]);
    
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [activeTab, projectState.results.traces, projectState.assumptions]); 

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const markStale = useCallback(() => {
        setProjectState(prev => {
            if (prev.results.isStale) return prev;
            return {
                ...prev,
                results: { ...prev.results, isStale: true }
            };
        });
    }, [setProjectState]);

    const handleInputChange = (key, value, type) => {
        setProjectState(prev => ({
            ...prev,
            inputs: {
                ...prev.inputs,
                [key]: type === 'boolean' ? value : (type === 'number' ? (parseFloat(value) || 0) : value)
            }
        }));
        markStale();
    };

    const handleMetaChange = (key, value) => {
        setProjectState(prev => ({
            ...prev,
            meta: { ...prev.meta, [key]: value }
        }));
    };

    const handleForceChange = (index, key, value) => {
        const newForces = [...projectState.forces];
        newForces[index][key] = parseFloat(value) || 0;
        setProjectState(prev => ({
            ...prev,
            forces: newForces
        }));
        markStale();
    };

    const toggleAssumptionStatus = (index) => {
        const newAssumptions = [...projectState.assumptions];
        const current = newAssumptions[index].status;
        if (current === "NEEDS REVIEW" || current === "NEEDS VERIFICATION") {
            newAssumptions[index].status = "USER CONFIRMED";
        } else {
            newAssumptions[index].status = "NEEDS REVIEW";
        }
        setProjectState(prev => ({
            ...prev,
            assumptions: newAssumptions
        }));
    };

    const resetProject = () => {
        if(window.confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu dự án hiện tại?")) {
            setProjectState({
                ...ProjectState,
                inputs: { ...ProjectState.inputs },
                meta: { ...ProjectState.meta },
                roofComponents: [ ...ProjectState.roofComponents ],
                forces: [
                    { id: "CB1", name: "THCB 1", source: "ETABS", N: 0, Mx: 0, My: 0, Vx: 0, Vy: 0 },
                    { id: "CB2", name: "THCB 2", source: "ETABS", N: 0, Mx: 0, My: 0, Vx: 0, Vy: 0 },
                    { id: "CB3", name: "THCB 3", source: "ETABS", N: 0, Mx: 0, My: 0, Vx: 0, Vy: 0 }
                ],
                assumptions: [ ...ProjectState.assumptions ]
            });
            setActiveTab('input');
        }
    };

    const loadTestCase01 = () => {
        if(window.confirm("Ghi đè dữ liệu bằng Test Case 01?")) {
            setProjectState({
                ...ProjectState,
                inputs: { ...TestCase01.inputs },
                meta: { ...TestCase01.meta },
                roofComponents: [ ...TestCase01.roofComponents ],
                forces: [ ...TestCase01.forces ],
                assumptions: [ ...ProjectState.assumptions ]
            });
            markStale();
        }
    };

    const runCalculations = () => {
        const valResult = validateInputs(projectState.inputs);
        if (!valResult.isValid) {
            setValidationErrors(valResult.errors);
            alert("Lỗi dữ liệu đầu vào. Vui lòng kiểm tra lại:\n" + valResult.errors.join("\n"));
            return;
        }
        setValidationErrors([]);

        const gravityResult = calculateGravityLoads(projectState.inputs, projectState.roofComponents);
        const windResult = calculateWindLoad(projectState.inputs);
        const combResult = calculateLoadCombinations(gravityResult, windResult);
        
        if (gravityResult.success && windResult.success && combResult.success) {
            setProjectState(prev => ({
                ...prev,
                results: {
                    ...prev.results,
                    isStale: false,
                    traces: {
                        ...prev.results.traces,
                        gravity: gravityResult.steps,
                        wind: windResult.steps,
                        windCases: windResult.loadCases,
                        combinations: combResult.steps
                    }
                }
            }));
            setActiveTab('loads');
        }
    };

    const getMuValue = (type) => {
        const opt = StandardData.TCVN5575_2024.EffectiveLength.options.find(o => o.id === type);
        return opt ? opt.mu : 1.0;
    };

    const runSectionProposal = () => {
        const mat = TCVN5575_2024.getMaterialProperties(projectState.inputs.steelGrade);
        if(!mat) return alert("Lỗi vật liệu.");
        
        const maxMx = Math.max(...projectState.forces.map(f => Math.abs(f.Mx)));
        const maxN = Math.max(...projectState.forces.map(f => Math.abs(f.N)));
        const maxVx = Math.max(...projectState.forces.map(f => Math.abs(f.Vx)));
        const governingForces = { N: maxN, Mx: maxMx, Vx: maxVx };

        const mu_x = getMuValue(projectState.inputs.mu_x_type);
        const mu_y = getMuValue(projectState.inputs.mu_y_type);
        const L_col = projectState.inputs.L_col_actual || projectState.inputs.H_column;
        const L0x = L_col * mu_x;
        const L0y = L_col * mu_y;

        const result = proposeSectionsForDesign(governingForces, mat, L0x, L0y);
        
        setProjectState(prev => ({
            ...prev,
            results: {
                ...prev.results,
                proposedSections: { ...prev.results.proposedSections, column: result.candidates }
            }
        }));
    };

    const selectSection = (section) => {
        const mat = TCVN5575_2024.getMaterialProperties(projectState.inputs.steelGrade);
        
        let governingCheck = null;
        let governingCase = null;
        
        const mu_x = getMuValue(projectState.inputs.mu_x_type);
        const mu_y = getMuValue(projectState.inputs.mu_y_type);
        const L_col = projectState.inputs.L_col_actual || projectState.inputs.H_column;
        const L0x = L_col * mu_x;
        const L0y = L_col * mu_y;

        for(let force of projectState.forces) {
            const check = checkSectionCapacity(section, force.N, force.Mx, force.Vx, mat, L0x, L0y);
            if(!governingCheck || !check.isAllPass) {
                governingCheck = check;
                governingCase = force;
            }
        }

        const connResult = calculateBasePlate(
            governingCase.N, governingCase.Mx, governingCase.Vx, section, "B20"
        );

        setProjectState(prev => ({
            ...prev,
            results: {
                ...prev.results,
                selectedSections: { ...prev.results.selectedSections, column: section },
                traces: {
                    ...prev.results.traces,
                    column: governingCheck.steps, 
                    connections: connResult.steps
                }
            }
        }));
    };

    const printReport = () => window.print();

    const rMeta = projectState.meta;
    const rInputs = projectState.inputs;
    const rResults = projectState.results;
    const rRoofComps = projectState.roofComponents;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 text-slate-800 dark:text-slate-200">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 print:hidden">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 text-primary">
                        <i data-lucide="layout-template" className="w-6 h-6"></i>
                        <h1 className="text-xl font-bold tracking-tight">STEEL DESIGN PROJECT ASSISTANT</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">Software: PASS</span>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300">Calc Engine: PARTIALLY VERIFIED</span>
                        <button onClick={loadTestCase01} className="text-sm text-slate-500 hover:text-primary mr-2">Tải Test Case</button>
                        <button onClick={resetProject} className="text-sm font-medium bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded flex items-center gap-2">
                            <i data-lucide="trash-2" className="w-4 h-4"></i> Reset
                        </button>
                        <button onClick={printReport} className="text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-3 py-1.5 rounded flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <i data-lucide="printer" className="w-4 h-4"></i> In Thuyết minh
                        </button>
                        <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                            <i data-lucide={theme === 'light' ? 'moon' : 'sun'} className="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
            </header>

            {/* Workflow Nav */}
            <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 print:hidden shadow-sm">
                <div className="max-w-7xl mx-auto flex overflow-x-auto">
                    <button className={`px-4 py-3 font-medium border-b-2 whitespace-nowrap ${activeTab === 'input' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`} onClick={() => setActiveTab('input')}>1. Cài đặt Dự án</button>
                    <button className={`px-4 py-3 font-medium border-b-2 whitespace-nowrap ${activeTab === 'loads' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`} onClick={() => setActiveTab('loads')}>2. Tải trọng & Tổ hợp</button>
                    <button className={`px-4 py-3 font-medium border-b-2 whitespace-nowrap ${activeTab === 'forces' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`} onClick={() => setActiveTab('forces')}>3. Nội lực</button>
                    <button className={`px-4 py-3 font-medium border-b-2 whitespace-nowrap ${activeTab === 'slab' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`} onClick={() => setActiveTab('slab')}>4. Sàn (Module)</button>
                    <button className={`px-4 py-3 font-medium border-b-2 whitespace-nowrap ${activeTab === 'beam' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`} onClick={() => setActiveTab('beam')}>5. Dầm (Module)</button>
                    <button className={`px-4 py-3 font-medium border-b-2 whitespace-nowrap ${activeTab === 'column' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`} onClick={() => setActiveTab('column')}>6. Cột (Module)</button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-4 mt-4 print:p-0 print:mt-0">
                
                <div className="hidden print:block mb-8 text-center border-b pb-4">
                    <h1 className="text-3xl font-bold uppercase mb-2">THUYẾT MINH TÍNH TOÁN KẾT CẤU</h1>
                    <h2 className="text-xl font-semibold text-slate-600 uppercase mb-4">{rMeta.projectName || "CHƯA ĐẶT TÊN CÔNG TRÌNH"}</h2>
                    <div className="flex justify-center gap-8 text-sm">
                        <p><strong>Người thực hiện:</strong> {rMeta.studentName || "........................"}</p>
                        <p><strong>MSSV:</strong> {rMeta.studentId || "........................"}</p>
                    </div>
                </div>

                {rResults.isStale && activeTab !== 'input' && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded mb-6 flex items-center gap-2 print:hidden">
                        <i data-lucide="alert-triangle" className="w-5 h-5"></i>
                        <span><strong>Cảnh báo:</strong> Thông số đầu vào đã thay đổi. Các kết quả tính toán có thể không còn chính xác. <button onClick={runCalculations} className="underline font-bold">Tính toán lại ngay.</button></span>
                    </div>
                )}

                {/* 1. INPUT TAB */}
                <div className={`space-y-6 ${activeTab === 'input' ? 'block' : 'hidden'} print:block print:mb-8`}>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-xl mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2"><i data-lucide="info" className="w-5 h-5 print:hidden text-primary"></i> 1.1 Thông tin Dự án</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.keys(ProjectState.meta).map(key => (
                                <div key={key}>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">{key}</label>
                                    <input 
                                        type="text"
                                        value={rMeta[key]}
                                        onChange={(e) => handleMetaChange(key, e.target.value)}
                                        className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none font-medium"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-xl mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2"><i data-lucide="rulers" className="w-5 h-5 print:hidden text-primary"></i> 1.2 Thông số Kỹ thuật & Hình học</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 print:grid-cols-4">
                            {Object.entries(rInputs).map(([key, value]) => {
                                const isBool = typeof ProjectState.inputs[key] === 'boolean';
                                const isNum = typeof ProjectState.inputs[key] === 'number' || value === null;
                                
                                if (key === 'mu_x_type' || key === 'mu_y_type' || key === 'terrainCategory' || key === 'windZone' || key === 'steelGrade' || key === 'boltGrade' || key === 'weldType') {
                                    let options = [];
                                    if(key === 'mu_x_type' || key === 'mu_y_type') options = StandardData.TCVN5575_2024.EffectiveLength.options.map(o => ({val: o.id, label: o.label}));
                                    if(key === 'terrainCategory') options = Object.keys(StandardData.TCVN2737_2023.Wind.Terrain.data).map(k => ({val: k, label: `Địa hình ${k}`}));
                                    if(key === 'windZone') options = Object.keys(StandardData.TCVN2737_2023.Wind.BasicWind.data).map(k => ({val: k, label: `Vùng ${k}`}));
                                    if(key === 'steelGrade') options = [{val: 'S235', label: 'S235'}, {val: 'S275', label: 'S275'}, {val: 'S355', label: 'S355'}];
                                    if(options.length > 0) {
                                        return (
                                            <div key={key}>
                                                <label className="text-xs font-semibold text-slate-500 uppercase">{key}</label>
                                                <select value={value} onChange={e => handleInputChange(key, e.target.value, 'string')} className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none font-medium">
                                                    {options.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                                                </select>
                                            </div>
                                        );
                                    }
                                }

                                return (
                                <div key={key}>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">{key}</label>
                                    {isBool ? (
                                        <input type="checkbox" checked={value} onChange={e => handleInputChange(key, e.target.checked, 'boolean')} className="w-5 h-5 accent-primary block mt-2" />
                                    ) : (
                                        <input 
                                            type={isNum ? 'number' : 'text'}
                                            value={value || ''}
                                            onChange={(e) => handleInputChange(key, e.target.value, isNum ? 'number' : 'string')}
                                            className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none font-medium"
                                        />
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-xl mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2"><i data-lucide="layers" className="w-5 h-5 print:hidden text-primary"></i> 1.3 Cấu tạo Tĩnh tải mái</h2>
                        <div className="overflow-x-auto mb-4">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="p-3 border-b dark:border-slate-700">Thành phần cấu tạo</th>
                                        <th className="p-3 border-b dark:border-slate-700">Tải trọng tiêu chuẩn</th>
                                        <th className="p-3 border-b dark:border-slate-700">Đơn vị</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rRoofComps.map((comp, idx) => (
                                        <tr key={idx} className="border-b dark:border-slate-700">
                                            <td className="p-3 font-medium">{comp.name}</td>
                                            <td className="p-3 font-mono">{comp.value.toFixed(3)}</td>
                                            <td className="p-3 text-slate-500">{comp.unit}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50 dark:bg-slate-900/30 font-bold">
                                        <td className="p-3 text-right">TỔNG TĨNH TẢI MÁI:</td>
                                        <td className="p-3 font-mono text-primary">{rRoofComps.reduce((a,b)=>a+b.value, 0).toFixed(3)}</td>
                                        <td className="p-3 text-slate-500">kN/m2</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-xl mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2"><i data-lucide="shield-alert" className="w-5 h-5 print:hidden text-primary"></i> 1.4 Giả định Thiết kế & Hệ số (Assumptions)</h2>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="p-3 border-b dark:border-slate-700">Tham số / Giả định</th>
                                        <th className="p-3 border-b dark:border-slate-700">Giá trị</th>
                                        <th className="p-3 border-b dark:border-slate-700">Nguồn / Cơ sở</th>
                                        <th className="p-3 border-b dark:border-slate-700 text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectState.assumptions.map((assum, idx) => (
                                        <tr key={idx} className="border-b dark:border-slate-700">
                                            <td className="p-3 font-medium">{assum.param}</td>
                                            <td className="p-3 font-mono">{assum.value} {assum.unit}</td>
                                            <td className="p-3 text-slate-500 text-xs">{assum.source}</td>
                                            <td className="p-3 text-center">
                                                <button 
                                                    onClick={() => toggleAssumptionStatus(idx)}
                                                    className={`px-2 py-1 rounded text-xs font-bold ${assum.status === 'USER CONFIRMED' ? 'bg-green-100 text-green-700' : (assum.status === 'NEEDS VERIFICATION' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}`}
                                                >
                                                    {assum.status}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-end print:hidden">
                            <button onClick={runCalculations} className="bg-primary hover:bg-blue-700 text-white px-6 py-2.5 rounded shadow-sm font-medium flex items-center gap-2 transition-colors"><i data-lucide="calculator" className="w-4 h-4"></i> Phân tích & Tổ hợp Tải trọng</button>
                        </div>
                    </div>
                </div>

                {/* 2. LOADS TAB */}
                <div className={`space-y-6 ${activeTab === 'loads' ? 'block' : 'hidden'} print:block print:mb-8 print:break-inside-avoid`}>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700 mb-6">
                        <h2 className="font-bold text-xl mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2"><i data-lucide="layers" className="w-5 h-5 print:hidden text-primary"></i> 2.1. Tổ hợp Tải trọng</h2>
                        {rResults.traces.combinations.length === 0 ? (
                            <p className="text-slate-500 italic print:hidden">Chưa có dữ liệu tính toán.</p>
                        ) : (
                            <div className="space-y-4">
                                {rResults.traces.combinations.map(step => <CalculationBlock key={step.stepId} step={step} />)}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700 mb-6">
                        <h2 className="font-bold text-xl mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2"><i data-lucide="arrow-down-to-line" className="w-5 h-5 print:hidden text-primary"></i> 2.2. Tĩnh tải & Hoạt tải</h2>
                        {rResults.traces.gravity.length === 0 ? (
                            <p className="text-slate-500 italic print:hidden">Chưa có dữ liệu.</p>
                        ) : (
                            <div className="space-y-4">
                                {rResults.traces.gravity.map(step => <CalculationBlock key={step.stepId} step={step} />)}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-xl mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2"><i data-lucide="wind" className="w-5 h-5 print:hidden text-primary"></i> 2.3. Tải trọng Gió</h2>
                        {rResults.traces.wind.length === 0 ? (
                            <p className="text-slate-500 italic print:hidden">Chưa có dữ liệu.</p>
                        ) : (
                            <div className="space-y-4">
                                <WindSvg geom={WindEngine.analyzeGeometry(rInputs.L, rInputs.B, rInputs.H_column, rInputs.H_roof, "gable", rInputs.roofSlope || 5.71)} loadCases={rResults.traces.windCases} />
                                <h3 className="font-bold text-lg mt-6 mb-2">Bảng tổng hợp kết quả (Wind Result Table)</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                                            <tr>
                                                <th className="p-2 border border-slate-300 dark:border-slate-700">Case</th>
                                                <th className="p-2 border border-slate-300 dark:border-slate-700">Direction</th>
                                                <th className="p-2 border border-slate-300 dark:border-slate-700">Surface</th>
                                                <th className="p-2 border border-slate-300 dark:border-slate-700">Zone</th>
                                                <th className="p-2 border border-slate-300 dark:border-slate-700">ze (m)</th>
                                                <th className="p-2 border border-slate-300 dark:border-slate-700">kz</th>
                                                <th className="p-2 border border-slate-300 dark:border-slate-700">ce</th>
                                                <th className="p-2 border border-slate-300 dark:border-slate-700">ci</th>
                                                <th className="p-2 border border-slate-300 dark:border-slate-700">Gf</th>
                                                <th className="p-2 border border-slate-300 dark:border-slate-700">Pressure (kN/m2)</th>
                                                <th className="p-2 border border-slate-300 dark:border-slate-700">Area (m2)</th>
                                                <th className="p-2 border border-slate-300 dark:border-slate-700">Resultant (kN)</th>
                                                <th className="p-2 border border-slate-300 dark:border-slate-700">Tributary (m)</th>
                                                <th className="p-2 border border-slate-300 dark:border-slate-700">Frame load (kN/m)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rResults.traces.windCases && Object.entries(rResults.traces.windCases).flatMap(([dir, caseData]) => 
                                                caseData.surfaces.map((zone, idx) => (
                                                    <tr key={`${dir}-${idx}`} className="border-b dark:border-slate-700">
                                                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-bold">{caseData.id}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-bold text-center">{dir}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-700">{zone.surface}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold">{zone.zone}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono text-right">{(zone.ze || 0).toFixed(2)}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono text-right">{(zone.kz || 0).toFixed(2)}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono text-right">{(zone.ce || 0).toFixed(2)}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono text-right">{(zone.ci || 0).toFixed(2)}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono text-right">{(zone.Gf || 0).toFixed(2)}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono text-right text-primary font-bold">{(zone.pressure || 0).toFixed(2)}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono text-right">{(zone.area || 0).toFixed(2)}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono text-right font-bold">{(zone.resultant || 0).toFixed(2)}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono text-right">{(zone.tributaryWidth || 0).toFixed(2)}</td>
                                                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono text-right text-green-600 font-bold">{(zone.frameLineLoad || 0).toFixed(2)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <h3 className="font-bold text-lg mt-6 mb-2">Chi tiết tính toán từng vùng</h3>
                                {rResults.traces.wind.map(step => <CalculationBlock key={step.stepId} step={step} />)}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. FORCES TAB */}
                <div className={`space-y-6 ${activeTab === 'forces' ? 'block' : 'hidden'} print:block print:mb-8 print:break-inside-avoid`}>
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-xl mb-2 border-b dark:border-slate-700 pb-2 flex items-center gap-2"><i data-lucide="bar-chart-2" className="w-5 h-5 print:hidden text-primary"></i> 3. Nhập liệu Nội lực Thiết kế</h2>
                        <p className="text-sm text-slate-500 mb-4">Mô đun thiết kế yêu cầu người dùng trích xuất nội lực từ phần mềm phân tích (Ví dụ: ETABS, SAP2000). Mỗi hàng đại diện cho một tổ hợp nguy hiểm tương ứng từ phân tích tĩnh học. Hệ thống lưu giữ Nguồn dữ liệu độc lập để minh bạch nguồn gốc.</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                                        <th className="p-3">Tổ hợp / Trường hợp</th>
                                        <th className="p-3">Nguồn</th>
                                        <th className="p-3">N (kN)</th>
                                        <th className="p-3">Mx (kNm)</th>
                                        <th className="p-3">My (kNm)</th>
                                        <th className="p-3">Vx (kN)</th>
                                        <th className="p-3">Vy (kN)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectState.forces.map((force, index) => (
                                        <tr key={index} className="border-b dark:border-slate-700">
                                            <td className="p-3 font-medium">{force.name}</td>
                                            <td className="p-3 text-slate-500 text-sm">
                                                <select value={force.source} onChange={e => handleForceChange(index, 'source', e.target.value)} className="w-full p-1 border rounded bg-slate-50 dark:bg-slate-900/50 outline-none text-xs">
                                                    <option value="ETABS">ETABS</option>
                                                    <option value="SAP2000">SAP2000</option>
                                                    <option value="Manual">Nhập Tay (Manual)</option>
                                                </select>
                                            </td>
                                            <td className="p-3"><input type="number" value={force.N} onChange={e => handleForceChange(index, 'N', e.target.value)} className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900/50 outline-none font-mono text-sm" /></td>
                                            <td className="p-3"><input type="number" value={force.Mx} onChange={e => handleForceChange(index, 'Mx', e.target.value)} className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900/50 outline-none font-mono text-sm" /></td>
                                            <td className="p-3"><input type="number" value={force.My} onChange={e => handleForceChange(index, 'My', e.target.value)} className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900/50 outline-none font-mono text-sm" /></td>
                                            <td className="p-3"><input type="number" value={force.Vx} onChange={e => handleForceChange(index, 'Vx', e.target.value)} className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900/50 outline-none font-mono text-sm" /></td>
                                            <td className="p-3"><input type="number" value={force.Vy} onChange={e => handleForceChange(index, 'Vy', e.target.value)} className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900/50 outline-none font-mono text-sm" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-end print:hidden">
                            <button onClick={() => setActiveTab('column')} className="bg-primary hover:bg-blue-700 text-white px-6 py-2.5 rounded shadow-sm font-medium flex items-center gap-2 transition-colors"><i data-lucide="arrow-right" className="w-4 h-4"></i> Tiến hành Thiết kế Cột</button>
                        </div>
                    </div>
                </div>

                {/* 4. SLAB TAB */}
                <div className={`space-y-6 ${activeTab === 'slab' ? 'block' : 'hidden'} print:block print:mb-8`}>
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700 text-center">
                        <i data-lucide="grid" className="w-12 h-12 mx-auto mb-4 text-slate-300"></i>
                        <h2 className="font-bold text-xl mb-2">Module Thiết kế Sàn Bê tông</h2>
                        <p className="text-slate-500 mb-4 font-mono bg-slate-100 dark:bg-slate-900 inline-block px-3 py-1 rounded">NOT YET IMPLEMENTED</p>
                        <p className="text-sm">Tính năng thiết kế bản sàn bê tông cốt thép đang trong quá trình phát triển.</p>
                    </div>
                </div>

                {/* 5. BEAM TAB */}
                <div className={`space-y-6 ${activeTab === 'beam' ? 'block' : 'hidden'} print:block print:mb-8`}>
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700 text-center">
                        <i data-lucide="minus" className="w-12 h-12 mx-auto mb-4 text-slate-300"></i>
                        <h2 className="font-bold text-xl mb-2">Module Thiết kế Dầm Thép</h2>
                        <p className="text-slate-500 mb-4 font-mono bg-slate-100 dark:bg-slate-900 inline-block px-3 py-1 rounded">NOT YET IMPLEMENTED</p>
                        <p className="text-sm">Tính năng thiết kế dầm chịu uốn cắt đang trong quá trình chuẩn hóa TCVN 5575:2024.</p>
                    </div>
                </div>

                {/* 6. COLUMN TAB */}
                <div className={`space-y-6 ${activeTab === 'column' ? 'block' : 'hidden'} print:block print:mb-8`}>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700 mb-6">
                        <h2 className="font-bold text-xl mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2"><i data-lucide="box" className="w-5 h-5 print:hidden text-primary"></i> 6.1 Đề xuất Tiết diện Cột</h2>
                        
                        <div className="mb-4 print:hidden flex items-center justify-between">
                            <span className="text-sm text-slate-500"><i data-lucide="info" className="w-4 h-4 inline mr-1"></i>Động cơ đề xuất đã bao gồm kiểm tra: Bền đàn hồi, Ổn định tổng thể (Trong/Ngoài mặt phẳng), Ổn định cục bộ.</span>
                            <button onClick={runSectionProposal} className="bg-primary hover:bg-blue-700 text-white px-6 py-2.5 rounded shadow-sm font-medium flex items-center gap-2 transition-colors"><i data-lucide="cpu" className="w-4 h-4"></i> Khởi chạy Đề xuất</button>
                        </div>

                        {rResults.proposedSections.column.length > 0 && (
                            <div className="print:hidden">
                                <div className="overflow-x-auto rounded border dark:border-slate-700">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                                            <tr>
                                                <th className="p-3 border-b dark:border-slate-700">Tiết diện</th>
                                                <th className="p-3 border-b dark:border-slate-700">Phân loại</th>
                                                <th className="p-3 border-b dark:border-slate-700">Khối lượng (kg/m)</th>
                                                <th className="p-3 border-b dark:border-slate-700 text-center">Trạng thái</th>
                                                <th className="p-3 border-b dark:border-slate-700 text-center">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rResults.proposedSections.column.map((cand, idx) => (
                                                <tr key={idx} className={`border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${rResults.selectedSections.column === cand.section ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                                    <td className="p-3 font-mono font-bold text-primary">{cand.section.name}</td>
                                                    <td className="p-3"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{cand.source}</span></td>
                                                    <td className="p-3 font-mono">{cand.section.massPerMeter.toFixed(1)}</td>
                                                    <td className="p-3 text-center font-semibold text-green-600">{cand.status}</td>
                                                    <td className="p-3 text-center">
                                                        <button onClick={() => selectSection(cand.section)} className="text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded font-medium transition-colors">Thiết kế & Báo cáo</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {rResults.selectedSections.column && rResults.traces.column.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 border border-slate-200 dark:border-slate-700 mb-6 print:break-inside-avoid">
                            <h2 className="font-bold text-xl mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2"><i data-lucide="check-square" className="w-5 h-5 print:hidden text-primary"></i> 6.2 Kiểm tra Bền & Ổn định Tiết diện</h2>
                            
                            <div className="mb-6 flex justify-center print:break-inside-avoid">
                                <ISectionSVG 
                                    h={rResults.selectedSections.column.h} 
                                    b={rResults.selectedSections.column.b} 
                                    tw={rResults.selectedSections.column.tw} 
                                    tf={rResults.selectedSections.column.tf} 
                                />
                            </div>

                            <div className="space-y-4">
                                {rResults.traces.column.map(step => <CalculationBlock key={step.stepId} step={step} />)}
                            </div>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
