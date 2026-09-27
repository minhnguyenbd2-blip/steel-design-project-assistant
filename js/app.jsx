// Main Application Component with Complete Workflow
// Tiếng Việt 100% chuyên ngành Kết cấu Thép - TCVN 2737:2023 & TCVN 5575:2024

const { useState, useEffect, useCallback, useMemo } = React;

const STORAGE_KEY = "steel_design_assistant_project_v3";

function usePersistentState(key, defaultValue) {
    const [state, setState] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved !== null) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Lỗi đọc LocalStorage", e);
        }
        return defaultValue;
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (e) {
            console.error("Lỗi lưu LocalStorage", e);
        }
    }, [key, state]);

    return [state, setState];
}

function App() {
    const [activeTab, setActiveTab] = usePersistentState(`${STORAGE_KEY}_tab`, 'input');

    // WORKSPACE MIGRATION STATES
    const [activeModule, setActiveModule] = useState('dashboard');
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [workspaceState, setWorkspaceState] = useState(() => (window.WorkspaceModel ? window.WorkspaceModel.fromLegacyState(ProjectState) : null));

    // Update workspaceState whenever projectState changes (migration bridge)
    useEffect(() => {
        if (window.WorkspaceModel) {
            setWorkspaceState(window.WorkspaceModel.fromLegacyState(projectState));
        }
    }, [projectState]);

    const handleModuleChange = (modId) => {
        setActiveModule(modId);
        // Sync legacy tabs
        if (modId === 'project' || modId === 'model') setActiveTab('input');
        if (modId === 'loads') setActiveTab('loads');
        if (modId === 'combinations' || modId === 'analysis') setActiveTab('forces');
        if (modId === 'design') setActiveTab('slab'); // Default to slab
        if (modId === 'report') setActiveTab('report');
    };

    const [windViewMode, setWindViewMode] = useState('2D');
    const [projectViewMode, setProjectViewMode] = useState('3D');
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
    const [isCalculating, setIsCalculating] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [hasLookupComp, setHasLookupComp] = useState(typeof window !== 'undefined' && !!window.SectionLookup);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.SectionLookup) {
            setHasLookupComp(true);
            return;
        }
        const timer = setInterval(() => {
            if (typeof window !== 'undefined' && window.SectionLookup) {
                setHasLookupComp(true);
                clearInterval(timer);
            }
        }, 150);
        return () => clearInterval(timer);
    }, []);

    // Tự động tính các thông số độ dốc mái
    const roofSlopeCalculations = useMemo(() => {
        const L = Number(projectState.inputs.L) || 25;
        const H_col = Number(projectState.inputs.H_column) || 8;
        const H_rf = Number(projectState.inputs.H_roof) || 9.25;
        const roofRise = Math.max(0.1, H_rf - H_col);
        const halfSpan = L / 2;
        const slopePercent = (roofRise / halfSpan) * 100;
        const alphaRad = Math.atan(roofRise / halfSpan);
        const alphaDeg = (alphaRad * 180) / Math.PI;

        return {
            roofRise: Number(roofRise.toFixed(3)),
            slopePercent: Number(slopePercent.toFixed(2)),
            alphaDeg: Number(alphaDeg.toFixed(2))
        };
    }, [projectState.inputs.L, projectState.inputs.H_column, projectState.inputs.H_roof]);
    
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [activeTab, projectState.results]); 

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
            if (prev.results && prev.results.isStale) return prev;
            return {
                ...prev,
                results: { ...(prev.results || {}), isStale: true }
            };
        });
    }, [setProjectState]);

    const handleInputChange = (key, value, type) => {
        // Xóa lỗi của trường này ngay lập tức khi người dùng nhập dữ liệu
        if (fieldErrors[key]) {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }

        setProjectState(prev => {
            const val = type === 'boolean' ? value : (type === 'number' ? (parseFloat(value) || 0) : value);
            const newInputs = {
                ...prev.inputs,
                [key]: val
            };

            // Tự động tính toán và đồng bộ roofSlope (%)
            const curL = Number(key === 'L' ? val : newInputs.L) || 25;
            const curHcol = Number(key === 'H_column' ? val : newInputs.H_column) || 8;
            const curHrf = Number(key === 'H_roof' ? val : newInputs.H_roof) || 9.25;
            const rise = Math.max(0, curHrf - curHcol);
            newInputs.roofSlope = Number(((rise / (curL / 2)) * 100).toFixed(2));

            return {
                ...prev,
                inputs: newInputs
            };
        });
        markStale();
    };

    const handleMetaChange = (key, value) => {
        setProjectState(prev => ({
            ...prev,
            meta: { ...prev.meta, [key]: value }
        }));
    };

    // Quản lý tổ hợp nội lực (Thêm / Bớt / Sửa)
    const handleForceChange = (index, key, value) => {
        const newForces = [...projectState.forces];
        newForces[index][key] = (key === 'source' || key === 'name' || key === 'id') ? value : (parseFloat(value) || 0);
        setProjectState(prev => ({
            ...prev,
            forces: newForces
        }));
        markStale();
    };

    const addForceCase = () => {
        const newIdx = projectState.forces.length + 1;
        const newCase = {
            id: `CB${newIdx}`,
            name: `THCB ${newIdx}`,
            source: "ETABS",
            N: 0,
            Mx: 0,
            My: 0,
            Vx: 0,
            Vy: 0
        };
        setProjectState(prev => ({
            ...prev,
            forces: [...prev.forces, newCase]
        }));
        markStale();
    };

    const removeForceCase = (index) => {
        if (projectState.forces.length <= 1) {
            alert("Cần duy trì tối thiểu 1 tổ hợp nội lực để thiết kế.");
            return;
        }
        const newForces = projectState.forces.filter((_, idx) => idx !== index);
        setProjectState(prev => ({
            ...prev,
            forces: newForces
        }));
        markStale();
    };

    const loadSolverForces = () => {
        if (projectState.results && projectState.results.frameForces && projectState.results.frameForces.length > 0) {
            setProjectState(prev => ({
                ...prev,
                forces: projectState.results.frameForces.map(f => ({
                    id: f.id,
                    name: f.name,
                    source: f.source || "TCVN Solver",
                    N: f.N,
                    Mx: f.Mx,
                    My: 0,
                    Vx: f.Vx,
                    Vy: 0
                }))
            }));
            markStale();
        } else {
            alert("Vui lòng thực hiện 'Phân tích & Tính toán Tải trọng' tại Tab 2 trước để sinh nội lực khung ngang.");
        }
    };

    const toggleAssumptionStatus = (index) => {
        const newAssumptions = [...projectState.assumptions];
        const current = newAssumptions[index].status;
        newAssumptions[index].status = (current === "USER CONFIRMED") ? "NEEDS REVIEW" : "USER CONFIRMED";
        setProjectState(prev => ({
            ...prev,
            assumptions: newAssumptions
        }));
    };

    const resetProject = () => {
        if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu và đưa về trạng thái ban đầu?")) {
            setProjectState({
                ...ProjectState,
                inputs: { ...ProjectState.inputs },
                meta: { ...ProjectState.meta },
                roofComponents: [ ...ProjectState.roofComponents ],
                forces: [ ...ProjectState.forces ],
                assumptions: [ ...ProjectState.assumptions ]
            });
            setValidationErrors([]);
            setFieldErrors({});
            setActiveTab('input');
        }
    };

    const loadTestCase01 = () => {
        if (window.confirm("Nạp dữ liệu Đề bài Mẫu: SV Đỗ Minh Nguyên - Nhà thể thao Bình Dương (Nhịp 25m, Bước 9m, Cao cột 8m)?")) {
            setProjectState({
                ...ProjectState,
                inputs: { ...TestCase01.inputs },
                meta: { ...TestCase01.meta },
                roofComponents: [ ...TestCase01.roofComponents ],
                forces: [ ...TestCase01.forces ],
                assumptions: [ ...ProjectState.assumptions ]
            });
            setValidationErrors([]);
            setFieldErrors({});
            markStale();
        }
    };

    // CHẠY TOÀN BỘ CÁC BỘ TÍNH TOÁN (ENGINE SUITE)
    const runCalculations = () => {
        setIsCalculating(true);
        setTimeout(() => {
            _runCalculationsSync();
        }, 600);
    };
    
    const _runCalculationsSync = () => {
        // Đồng bộ chính xác độ dốc mái vào inputs trước khi chạy thẩm tra
        const currentInputs = {
            ...projectState.inputs,
            roofSlope: roofSlopeCalculations.slopePercent
        };

        const valResult = validateInputs(currentInputs);
        if (!valResult.isValid) {
            setValidationErrors(valResult.errors);
            setFieldErrors(valResult.fieldErrors || {});
            setActiveTab('input');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setValidationErrors([]);
        setFieldErrors({});

        // 1. Tải trọng Gió TCVN 2737:2023
        const windResult = calculateWindLoad(currentInputs);

        // 2. Thiết kế Tôn lợp mái & Xà gồ thép
        const claddingProfile = StandardData.TCVN2737_2023.PurlinAndCladding.sheetProfiles.find(s => s.id === projectState.inputs.selectedCladdingId);
        const purlinProfile = StandardData.TCVN2737_2023.PurlinAndCladding.purlinProfiles.find(p => p.id === projectState.inputs.selectedPurlinId);
        
        const W0_val = StandardData.TCVN2737_2023.Wind.BasicWind.getW0(projectState.inputs.windZone).value;
        const kz_roof = StandardData.TCVN2737_2023.Wind.HeightCoefficient.getKze(projectState.inputs.H_roof, projectState.inputs.terrainCategory).value;

        // Trích xuất hệ số khí động hút mái bất lợi nhất từ kết quả gió thực tế (thay thế hardcode)
        let calculatedRoofSuction = -1.372;
        if (windResult && windResult.loadCases && windResult.loadCases['+X']) {
            const roofZones = windResult.loadCases['+X'].surfaces.filter(s => s.surface === 'Mái');
            const minCnet = Math.min(...roofZones.map(r => r.c_net));
            if (isFinite(minCnet) && minCnet < 0) {
                calculatedRoofSuction = minCnet;
            }
        }

        const claddingResult = PurlinCladdingEngine.designRoofCladding(
            claddingProfile,
            projectState.inputs.purlinSpacing,
            roofSlopeCalculations.alphaDeg,
            W0_val,
            kz_roof,
            calculatedRoofSuction
        );

        const purlinResult = PurlinCladdingEngine.designPurlin(
            purlinProfile,
            claddingProfile,
            projectState.inputs.purlinSpacing,
            projectState.inputs.B,
            roofSlopeCalculations.alphaDeg,
            W0_val,
            kz_roof,
            calculatedRoofSuction
        );

        // Cập nhật lại danh mục tĩnh tải mái chính xác từ tôn và xà gồ đã chọn
        const updatedRoofComponents = [
            { name: `Tôn lợp mái (${claddingResult.profile.name})`, value: claddingResult.profile.weightKNM2, unit: "kN/m2" },
            { name: `Xà gồ (${purlinResult.purlin.name}, bước a=${projectState.inputs.purlinSpacing}m)`, value: Number((purlinResult.purlin.weightKNM / projectState.inputs.purlinSpacing).toFixed(4)), unit: "kN/m2" },
            { name: "Lớp cách nhiệt chống nóng", value: 0.0200, unit: "kN/m2" },
            { name: "Hệ giằng mái và phụ kiện treo", value: 0.0300, unit: "kN/m2" }
        ];

        // 3. Tải trọng trọng trường (Tĩnh tải & Hoạt tải mái)
        const gravityResult = calculateGravityLoads(projectState.inputs, updatedRoofComponents);

        // 4. Tổ hợp tải trọng
        const combResult = calculateLoadCombinations(gravityResult, windResult);

        // 5. Thiết kế Sàn BTCT (Module Sàn)
        const slabResult = SlabBeamEngine.calculateSlab({
            L1: projectState.inputs.slabParams.L1,
            L2: projectState.inputs.slabParams.L2,
            liveLoad: projectState.inputs.slabParams.liveLoad,
            finishingLoad: projectState.inputs.slabParams.finishingLoad,
            concreteGrade: projectState.inputs.slabParams.concreteGrade,
            rebarGrade: projectState.inputs.slabParams.rebarGrade
        });

        // 6. Thiết kế Dầm thép (Module Dầm)
        const beamResult = SlabBeamEngine.calculateBeam({
            L_beam: projectState.inputs.beamParams.L_beam,
            tributaryWidth: projectState.inputs.beamParams.tributaryWidth,
            slabLoadQd: slabResult.loads.qd,
            slabLoadQk: slabResult.loads.qk,
            steelGrade: projectState.inputs.steelGrade,
            chosenBeamId: projectState.inputs.beamParams.chosenBeamId
        });

        setProjectState(prev => ({
            ...prev,
            roofComponents: updatedRoofComponents,
            results: {
                ...prev.results,
                isStale: false,
                geom: windResult.geom,
                claddingResult,
                purlinResult,
                slabResult,
                beamResult,
                frameForces: combResult.frameForces,
                governingForces: combResult.governingForces,
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
    };

    const getMuValue = (type) => {
        const opt = StandardData.TCVN5575_2024.EffectiveLength.options.find(o => o.id === type);
        return opt ? opt.mu : 1.0;
    };

    // Đề xuất tiết diện cột
    const runSectionProposal = () => {
        const mat = { f: 215, fv: 125, E: 2.1e5 };
        if (!mat) return alert("Không tìm thấy thuộc tính mác thép.");
        
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

    // Chọn tiết diện cột để kiểm tra chi tiết
    const selectSection = (section) => {
        const mat = { f: 215, fv: 125, E: 2.1e5 };
        
        let governingCheck = null;
        let governingCase = null;
        
        const mu_x = getMuValue(projectState.inputs.mu_x_type);
        const mu_y = getMuValue(projectState.inputs.mu_y_type);
        const L_col = projectState.inputs.L_col_actual || projectState.inputs.H_column;
        const L0x = L_col * mu_x;
        const L0y = L_col * mu_y;

        for (let force of projectState.forces) {
            const check = checkSectionCapacity(section, force.N, force.Mx, force.Vx, mat, L0x, L0y);
            const currentStressUtil = Math.max(check.utilization.strength, check.utilization.shear, check.utilization.inPlane, check.utilization.outPlane);
            const govStressUtil = governingCheck ? Math.max(governingCheck.utilization.strength, governingCheck.utilization.shear, governingCheck.utilization.inPlane, governingCheck.utilization.outPlane) : -1;
            
            if (!governingCheck || (!check.isAllPass && governingCheck.isAllPass) || (check.isAllPass === governingCheck.isAllPass && currentStressUtil > govStressUtil)) {
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

    
    const legacyUI = (
        <div className="w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-200 text-slate-800 dark:text-slate-200 font-sans">

            {/* Header điều hướng */}
            <header className="hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-20 print:hidden shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-2 text-primary">
                        <i data-lucide="layout-template" className="w-6 h-6"></i>
                        <h1 className="text-xl font-bold tracking-tight">STEEL DESIGN PROJECT ASSISTANT</h1>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded dark:bg-green-900 dark:text-green-300">
                            Phần mềm: ĐẠT
                        </span>
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded dark:bg-blue-900 dark:text-blue-300">
                            Động cơ tính toán: CHUẨN TCVN
                        </span>
                        <button onClick={loadTestCase01} className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 px-3 py-1.5 rounded font-medium text-slate-700 dark:text-slate-200 transition-colors">
                            <i data-lucide="download" className="w-3.5 h-3.5 inline mr-1"></i> Tải Đề bài Mẫu
                        </button>
                        <button onClick={resetProject} className="text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                            <i data-lucide="trash-2" className="w-3.5 h-3.5"></i> Đặt lại
                        </button>
                        <button onClick={printReport} className="text-xs font-medium bg-primary hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center gap-1 shadow-sm transition-colors">
                            <i data-lucide="printer" className="w-3.5 h-3.5"></i> In Thuyết minh
                        </button>
                        <button onClick={toggleTheme} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
                            <i data-lucide={theme === 'light' ? 'moon' : 'sun'} className="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
            </header>

            {/* Workflow Navigation */}
            <nav className={`bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 print:hidden shadow-sm ${activeModule === 'design' ? '' : 'hidden'}`}>
                <div className="max-w-7xl mx-auto flex overflow-x-auto text-sm">
                    <button className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'input' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`} onClick={() => setActiveTab('input')} style={{ display: 'none' }}>
                        <i data-lucide="sliders" className="w-4 h-4"></i> 1. Cài đặt Dự án & Hình học 2D
                    </button>
                    <button className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'loads' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`} onClick={() => setActiveTab('loads')} style={{ display: 'none' }}>
                        <i data-lucide="wind" className="w-4 h-4"></i> 2. Tải trọng & Xà gồ mái
                    </button>
                    <button className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'forces' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`} onClick={() => setActiveTab('forces')} style={{ display: 'none' }}>
                        <i data-lucide="table" className="w-4 h-4"></i> 3. Nội lực Thiết kế ({projectState.forces.length} THCB)
                    </button>
                    <button className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'slab' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`} onClick={() => setActiveTab('slab')}>
                        <i data-lucide="grid" className="w-4 h-4"></i> 4. Thiết kế Sàn BTCT
                    </button>
                    <button className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'beam' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`} onClick={() => setActiveTab('beam')}>
                        <i data-lucide="minus" className="w-4 h-4"></i> 5. Thiết kế Dầm Thép
                    </button>
                    <button className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'column' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`} onClick={() => setActiveTab('column')}>
                        <i data-lucide="box" className="w-4 h-4"></i> 6. Thiết kế Cột Thép
                    </button>
                    <button className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'lookup' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`} onClick={() => setActiveTab('lookup')}>
                        <i data-lucide="book-open" className="w-4 h-4"></i> 7. Bảng tra Tiết diện
                    </button>
                    <button className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'report' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`} onClick={() => setActiveTab('report')} style={{ display: 'none' }}>
                        <i data-lucide="printer" className="w-4 h-4 text-emerald-600"></i> 8. Xuất Thuyết Minh
                    </button>

                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-4 mt-4 print:p-0 print:mt-0">
                
                {/* Tiêu đề Thuyết minh khi in */}
                <div className="hidden print:block mb-8 text-center border-b pb-4">
                    <h1 className="text-3xl font-bold uppercase mb-2">THUYẾT MINH TÍNH TOÁN ĐỒ ÁN KẾT CẤU THÉP</h1>
                    <h2 className="text-xl font-semibold text-slate-600 uppercase mb-4">{rMeta.projectName || "CÔNG TRÌNH NHÀ THỂ THAO ĐA NĂNG"}</h2>
                    <div className="flex justify-center gap-8 text-sm">
                        <p><strong>Sinh viên thực hiện:</strong> {rMeta.studentName || "Đỗ Minh Nguyên"}</p>
                        <p><strong>MSSV:</strong> {rMeta.studentId || "22520100438"}</p>
                        <p><strong>Địa điểm:</strong> {rMeta.location || "Bình Dương"}</p>
                    </div>
                </div>

                {/* Cảnh báo Stale khi thay đổi thông số */}
                {rResults.isStale && activeTab !== 'input' && (
                    <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-lg mb-6 flex items-center justify-between print:hidden">
                        <div className="flex items-center gap-2">
                            <i data-lucide="alert-triangle" className="w-5 h-5"></i>
                            <span><strong>Cảnh báo:</strong> Thông số đầu vào đã thay đổi. Kết quả tính toán cần được cập nhật.</span>
                        </div>
                        <button onClick={runCalculations} className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded font-bold transition-colors">
                            Cập nhật tính toán ngay
                        </button>
                    </div>
                )}

                {/* Banner cảnh báo lỗi dữ liệu đầu vào (Validation Error Banner) */}
                {validationErrors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded-xl p-4 mb-6 shadow-md print:hidden">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <i data-lucide="alert-octagon" className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5"></i>
                                <div>
                                    <h4 className="font-bold text-red-800 dark:text-red-200 text-sm">
                                        Phát hiện {validationErrors.length} lỗi dữ liệu đầu vào. Vui lòng kiểm tra lại các trường được viền đỏ bên dưới:
                                    </h4>
                                    <ul className="text-xs text-red-700 dark:text-red-300 list-disc list-inside mt-1.5 space-y-1 font-medium">
                                        {validationErrors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setValidationErrors([]); setFieldErrors({}); }} 
                                className="text-red-600 hover:text-red-800 dark:text-red-300 text-xs font-bold px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================================================= */}
                {/* 1. TAB CÀI ĐẶT DỰ ÁN & HÌNH HỌC 2D */}
                {/* ========================================================================================= */}
                <div className={`space-y-6 ${activeTab === 'input' ? 'block' : 'hidden'} print:block print:mb-8`}>
                    
                    {/* 1.1 Thông tin sinh viên & đề bài */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-lg mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2 text-primary">
                            <i data-lucide="user-check" className="w-5 h-5"></i> 1.1 Thông tin Sinh viên & Đề tài Đồ án
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Họ và tên sinh viên</label>
                                <input type="text" value={rMeta.studentName} onChange={e => handleMetaChange('studentName', e.target.value)} className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none font-medium" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Mã số sinh viên (MSSV)</label>
                                <input type="text" value={rMeta.studentId} onChange={e => handleMetaChange('studentId', e.target.value)} className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none font-medium font-mono" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Tên công trình</label>
                                <input type="text" value={rMeta.projectName} onChange={e => handleMetaChange('projectName', e.target.value)} className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none font-medium" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Công năng sử dụng</label>
                                <input type="text" value={rMeta.usage} onChange={e => handleMetaChange('usage', e.target.value)} className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none font-medium" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Địa điểm xây dựng</label>
                                <input type="text" value={rMeta.location} onChange={e => handleMetaChange('location', e.target.value)} className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none font-medium" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Vùng gió (TCVN 2737:2023)</label>
                                <select 
                                    value={rInputs.windZone} 
                                    onChange={e => handleInputChange('windZone', e.target.value, 'string')} 
                                    className={`w-full p-2 border rounded mt-1 outline-none font-semibold transition-all ${
                                        fieldErrors['windZone'] 
                                            ? 'border-2 border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100 ring-2 ring-red-400' 
                                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-primary'
                                    }`}
                                >
                                    {Object.keys(StandardData.TCVN2737_2023.Wind.BasicWind.data).map(k => (
                                        <option key={k} value={k}>Vùng {k} (W₀ = {StandardData.TCVN2737_2023.Wind.BasicWind.data[k]} kN/m²)</option>
                                    ))}
                                </select>
                                {fieldErrors['windZone'] && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                                        <i data-lucide="alert-circle" className="w-3.5 h-3.5 inline"></i> {fieldErrors['windZone']}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 1.2 Kích thước Hình học & Tự động tính độ dốc */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-lg mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2 text-primary">
                            <i data-lucide="ruler" className="w-5 h-5"></i> 1.2 Kích thước Hình học Công trình & Thông số Mái
                        </h2>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Nhịp khung ngang L (m)</label>
                                <input 
                                    type="number" step="0.5" 
                                    value={rInputs.L} 
                                    onChange={e => handleInputChange('L', e.target.value, 'number')} 
                                    className={`w-full p-2 border rounded mt-1 outline-none font-bold font-mono transition-all ${
                                        fieldErrors['L'] 
                                            ? 'border-2 border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100 ring-2 ring-red-400' 
                                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-primary'
                                    }`} 
                                />
                                {fieldErrors['L'] && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                                        <i data-lucide="alert-circle" className="w-3.5 h-3.5 inline"></i> {fieldErrors['L']}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Bước cột B (m)</label>
                                <input 
                                    type="number" step="0.5" 
                                    value={rInputs.B} 
                                    onChange={e => handleInputChange('B', e.target.value, 'number')} 
                                    className={`w-full p-2 border rounded mt-1 outline-none font-bold font-mono transition-all ${
                                        fieldErrors['B'] 
                                            ? 'border-2 border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100 ring-2 ring-red-400' 
                                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-primary'
                                    }`} 
                                />
                                {fieldErrors['B'] && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                                        <i data-lucide="alert-circle" className="w-3.5 h-3.5 inline"></i> {fieldErrors['B']}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Chiều dài nhà (m)</label>
                                <input 
                                    type="number" step="1" 
                                    value={rInputs.length} 
                                    onChange={e => handleInputChange('length', e.target.value, 'number')} 
                                    className={`w-full p-2 border rounded mt-1 outline-none font-bold font-mono transition-all ${
                                        fieldErrors['length'] 
                                            ? 'border-2 border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100 ring-2 ring-red-400' 
                                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-primary'
                                    }`} 
                                />
                                {fieldErrors['length'] && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                                        <i data-lucide="alert-circle" className="w-3.5 h-3.5 inline"></i> {fieldErrors['length']}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Chiều cao đỉnh cột (m)</label>
                                <input 
                                    type="number" step="0.1" 
                                    value={rInputs.H_column} 
                                    onChange={e => handleInputChange('H_column', e.target.value, 'number')} 
                                    className={`w-full p-2 border rounded mt-1 outline-none font-bold font-mono transition-all ${
                                        fieldErrors['H_column'] 
                                            ? 'border-2 border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100 ring-2 ring-red-400' 
                                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-amber-500'
                                    }`} 
                                />
                                {fieldErrors['H_column'] && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                                        <i data-lucide="alert-circle" className="w-3.5 h-3.5 inline"></i> {fieldErrors['H_column']}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Chiều cao đỉnh mái (m)</label>
                                <input 
                                    type="number" step="0.05" 
                                    value={rInputs.H_roof} 
                                    onChange={e => handleInputChange('H_roof', e.target.value, 'number')} 
                                    className={`w-full p-2 border rounded mt-1 outline-none font-bold font-mono transition-all ${
                                        fieldErrors['H_roof'] 
                                            ? 'border-2 border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100 ring-2 ring-red-400' 
                                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-amber-500'
                                    }`} 
                                />
                                {fieldErrors['H_roof'] && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                                        <i data-lucide="alert-circle" className="w-3.5 h-3.5 inline"></i> {fieldErrors['H_roof']}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Thẻ hiển thị tính toán tự động độ dốc */}
                        <div className={`mt-4 p-4 rounded-xl border grid grid-cols-1 md:grid-cols-4 gap-4 text-sm transition-all ${
                            fieldErrors['roofSlope'] || (fieldErrors['H_roof'] && fieldErrors['H_column'])
                                ? 'bg-red-50 dark:bg-red-950/30 border-2 border-red-500 ring-2 ring-red-300'
                                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-700 dark:text-blue-300 font-bold font-mono">ΔH</div>
                                <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Chiều cao dâng mái:</div>
                                    <div className="font-bold text-slate-800 dark:text-white font-mono text-base">{roofSlopeCalculations.roofRise} m</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900 rounded-lg text-emerald-700 dark:text-emerald-300 font-bold font-mono">i %</div>
                                <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Độ dốc mái i (roofSlope):</div>
                                    <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-base">{roofSlopeCalculations.slopePercent} %</div>
                                    <div className="text-[10px] text-slate-500">i = 1/{((rInputs.L/2)/roofSlopeCalculations.roofRise).toFixed(1)} (tự động)</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-indigo-700 dark:text-indigo-300 font-bold font-mono">α °</div>
                                <div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Góc dốc mái nghiêng:</div>
                                    <div className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-base">{roofSlopeCalculations.alphaDeg}°</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l dark:border-slate-700 pt-2 md:pt-0 md:pl-3">
                                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                    <div className="font-semibold flex items-center gap-1 text-slate-700 dark:text-slate-200">
                                        <i data-lucide="check-check" className="w-3.5 h-3.5 text-emerald-500"></i> Đồng bộ tự động
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-tight">
                                        i = (H_roof - H_col) / (L/2) × 100%. TCVN 2737:2023 (Phụ lục F.4 & F.5) tra bảng hệ số khí động tự động theo góc α này.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {fieldErrors['roofSlope'] && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-semibold flex items-center gap-1">
                                <i data-lucide="alert-circle" className="w-3.5 h-3.5 inline"></i> {fieldErrors['roofSlope']}
                            </p>
                        )}

                        {/* Các thông số kỹ thuật phụ trợ */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t dark:border-slate-700">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Dạng địa hình (Bảng 8)</label>
                                <select 
                                    value={rInputs.terrainCategory} 
                                    onChange={e => handleInputChange('terrainCategory', e.target.value, 'string')} 
                                    className={`w-full p-2 border rounded mt-1 outline-none text-sm transition-all ${
                                        fieldErrors['terrainCategory'] 
                                            ? 'border-2 border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100 ring-2 ring-red-400' 
                                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50'
                                    }`}
                                >
                                    <option value="A">Địa hình A (Trống trải ven biển, đồng bằng)</option>
                                    <option value="B">Địa hình B (Tương đối trống trải, ngoại thành)</option>
                                    <option value="C">Địa hình C (Đô thị, rừng cây, vật cản dày)</option>
                                </select>
                                {fieldErrors['terrainCategory'] && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                                        <i data-lucide="alert-circle" className="w-3.5 h-3.5 inline"></i> {fieldErrors['terrainCategory']}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Mác thép kết cấu</label>
                                <select 
                                    value={rInputs.steelGrade} 
                                    onChange={e => handleInputChange('steelGrade', e.target.value, 'string')} 
                                    className={`w-full p-2 border rounded mt-1 outline-none text-sm font-semibold transition-all ${
                                        fieldErrors['steelGrade'] 
                                            ? 'border-2 border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100 ring-2 ring-red-400' 
                                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50'
                                    }`}
                                >
                                    <option value="S235">S235 (f = 215 - 235 MPa)</option>
                                    <option value="S275">S275 (f = 255 - 275 MPa)</option>
                                    <option value="S355">S355 (f = 335 - 355 MPa)</option>
                                </select>
                                {fieldErrors['steelGrade'] && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                                        <i data-lucide="alert-circle" className="w-3.5 h-3.5 inline"></i> {fieldErrors['steelGrade']}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Độ hở bao che μ (%) (F.12)</label>
                                <input 
                                    type="number" step="1" 
                                    value={rInputs.porosityPercent} 
                                    onChange={e => handleInputChange('porosityPercent', e.target.value, 'number')} 
                                    className={`w-full p-2 border rounded mt-1 outline-none font-mono text-sm transition-all ${
                                        fieldErrors['porosityPercent'] 
                                            ? 'border-2 border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-100 ring-2 ring-red-400' 
                                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50'
                                    }`} 
                                    placeholder="≤ 5% (Kín)" 
                                />
                                {fieldErrors['porosityPercent'] && (
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold flex items-center gap-1">
                                        <i data-lucide="alert-circle" className="w-3.5 h-3.5 inline"></i> {fieldErrors['porosityPercent']}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Dấu áp lực trong c_i</label>
                                <select value={rInputs.internalPressureSign} onChange={e => handleInputChange('internalPressureSign', e.target.value, 'string')} className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none text-sm">
                                    <option value="unfavorable">Bất lợi nhất (Tự động theo Mục F.12.2 TCVN 2737:2023)</option>
                                    <option value="+">Dương (+0,2) Đẩy bung ra ngoài</option>
                                    <option value="-">Âm (-0,2) Hút ngược vào trong</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 1.3 Bản vẽ 2D Công trình */}
                    
                    <div className="flex justify-end mb-2 print:hidden">
                        <div className="inline-flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg shadow-inner">
                            <button 
                                onClick={() => setProjectViewMode("2D")} 
                                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${projectViewMode === "2D" ? "bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
                            >
                                Bản vẽ 2D
                            </button>
                            <button 
                                onClick={() => setProjectViewMode("3D")} 
                                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${projectViewMode === "3D" ? "bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
                            >
                                Mô hình 3D
                            </button>
                        </div>
                    </div>
                    {projectViewMode === "2D" ? (
                        <ProjectSvg inputs={rInputs} />
                    ) : (
                        <Building3DViewer inputs={rInputs} mode="geometry" workspaceState={workspaceState} />
                    )}


                    {/* 1.4 Bảng giả định & Cơ sở Tiêu chuẩn */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-lg mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2 text-primary">
                            <i data-lucide="shield-check" className="w-5 h-5"></i> 1.3 Giả định Thiết kế & Cơ sở Tiêu chuẩn (TCVN)
                        </h2>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="p-3 border-b dark:border-slate-700">Tham số / Giả định</th>
                                        <th className="p-3 border-b dark:border-slate-700">Giá trị áp dụng</th>
                                        <th className="p-3 border-b dark:border-slate-700">Cơ sở / Tiêu chuẩn</th>
                                        <th className="p-3 border-b dark:border-slate-700 text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectState.assumptions.map((assum, idx) => (
                                        <tr key={idx} className="border-b dark:border-slate-700">
                                            <td className="p-3 font-medium">{assum.param}</td>
                                            <td className="p-3 font-mono font-bold text-primary">{assum.value} {assum.unit}</td>
                                            <td className="p-3 text-slate-500 text-xs">{assum.source}</td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => toggleAssumptionStatus(idx)} className="px-2.5 py-1 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                                    {assum.status}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-end print:hidden">
                            <button onClick={runCalculations} className="bg-primary hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow font-medium flex items-center gap-2 transition-all">
                                <i data-lucide="calculator" className="w-5 h-5"></i> Phân tích & Tính toán Tải trọng
                            </button>
                        </div>
                    </div>
                </div>

                {/* ========================================================================================= */}
                {/* 2. TAB TẢI TRỌNG & XÀ GỒ MÁI */}
                {/* ========================================================================================= */}
                <div className={`space-y-6 ${activeTab === 'loads' ? 'block' : 'hidden'} print:block print:mb-8`}>
                    
                    {/* 2.1 Chọn Tôn lợp và Xà gồ mái */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center border-b dark:border-slate-700 pb-3 mb-4">
                            <h2 className="font-bold text-xl flex items-center gap-2 text-primary">
                                <i data-lucide="layers" className="w-5 h-5"></i> 2.1 Thiết kế & Kiểm tra Tôn lợp Mái & Xà gồ (Purlin & Cladding)
                            </h2>
                            <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 rounded-full font-bold">
                                Bám sát Đồ án Mẫu
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {/* Chọn Tôn lợp */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-lg border dark:border-slate-700">
                                <label className="font-bold text-xs uppercase text-slate-500">1. Chọn loại Tôn lợp mái</label>
                                <select 
                                    value={rInputs.selectedCladdingId} 
                                    onChange={e => handleInputChange('selectedCladdingId', e.target.value, 'string')}
                                    className="w-full p-2 border rounded mt-1 bg-white dark:bg-slate-800 font-semibold text-primary text-sm outline-none"
                                >
                                    {StandardData.TCVN2737_2023.PurlinAndCladding.sheetProfiles.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.weightKgM2} kg/m²)</option>
                                    ))}
                                </select>

                                <div className="mt-3 text-xs space-y-1 text-slate-500 dark:text-slate-400">
                                    {(() => {
                                        const curTole = StandardData.TCVN2737_2023.PurlinAndCladding.sheetProfiles.find(s => s.id === rInputs.selectedCladdingId) || StandardData.TCVN2737_2023.PurlinAndCladding.sheetProfiles[4];
                                        return (
                                            <>
                                                <div>• Trọng lượng: <strong className="text-slate-800 dark:text-white font-mono">{curTole.weightKNM2} kN/m²</strong></div>
                                                <div>• Mô men quán tính Ix: <strong className="text-slate-800 dark:text-white font-mono">{curTole.Ix} cm⁴</strong></div>
                                                <div>• Mô men kháng uốn Wx: <strong className="text-slate-800 dark:text-white font-mono">{curTole.Wx} cm³</strong></div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Bước xà gồ với Trợ lý Tính toán Thông minh */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-lg border dark:border-slate-700">
                                <label className="font-bold text-xs uppercase text-slate-500">2. Khoảng cách bước xà gồ a (m)</label>
                                <input 
                                    type="number" step="0.01" 
                                    value={rInputs.purlinSpacing} 
                                    onChange={e => handleInputChange('purlinSpacing', e.target.value, 'number')}
                                    className="w-full p-2 border rounded mt-1 bg-white dark:bg-slate-800 font-bold font-mono text-primary text-sm outline-none" 
                                />
                                
                                {/* Trợ lý hình học chia chẵn xà gồ */}
                                {(() => {
                                    const L = Number(rInputs.L) || 25;
                                    const H_col = Number(rInputs.H_column) || 8;
                                    const H_rf = Number(rInputs.H_roof) || 9.25;
                                    const roofRise = Math.max(0.1, H_rf - H_col);
                                    const L_rafter = Math.sqrt(Math.pow(L / 2, 2) + Math.pow(roofRise, 2));
                                    const curA = Number(rInputs.purlinSpacing) || 1.2;
                                    const nSpaces = Math.max(2, Math.round(L_rafter / curA));
                                    const exactA = Number((L_rafter / nSpaces).toFixed(3));
                                    return (
                                        <div className="mt-2.5 p-2 bg-blue-50/70 dark:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-900/50 text-[11px] space-y-1">
                                            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                                <span>Chiều dài cánh kèo Lk:</span>
                                                <strong className="font-mono text-primary">{L_rafter.toFixed(2)} m</strong>
                                            </div>
                                            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                                <span>Chia chẵn {nSpaces} khoảng:</span>
                                                <strong className="font-mono text-emerald-600 dark:text-emerald-400">a = {exactA} m</strong>
                                            </div>
                                            {Math.abs(exactA - curA) > 0.005 && (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleInputChange('purlinSpacing', exactA, 'number')}
                                                    className="w-full mt-1.5 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                                                >
                                                    <i data-lucide="sparkles" className="w-3.5 h-3.5"></i> Áp dụng bước chẵn: {exactA} m
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Chọn Xà gồ thép */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-lg border dark:border-slate-700">
                                <label className="font-bold text-xs uppercase text-slate-500">3. Chọn tiết diện Xà gồ thép (C hoặc Z)</label>
                                <select 
                                    value={rInputs.selectedPurlinId} 
                                    onChange={e => handleInputChange('selectedPurlinId', e.target.value, 'string')}
                                    className="w-full p-2 border rounded mt-1 bg-white dark:bg-slate-800 font-semibold text-primary text-sm outline-none"
                                >
                                    {StandardData.TCVN2737_2023.PurlinAndCladding.purlinProfiles.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.weightKgM} kg/m)</option>
                                    ))}
                                </select>

                                <div className="mt-3 text-xs space-y-1 text-slate-500 dark:text-slate-400">
                                    {(() => {
                                        const curPurlin = StandardData.TCVN2737_2023.PurlinAndCladding.purlinProfiles.find(p => p.id === rInputs.selectedPurlinId) || StandardData.TCVN2737_2023.PurlinAndCladding.purlinProfiles[9];
                                        return (
                                            <>
                                                <div>• Trọng lượng: <strong className="text-slate-800 dark:text-white font-mono">{curPurlin.weightKNM} kN/m</strong></div>
                                                <div>• Wx: <strong className="text-slate-800 dark:text-white font-mono">{(curPurlin.Wx/1000).toFixed(1)} cm³</strong> | Wy: <strong className="text-slate-800 dark:text-white font-mono">{(curPurlin.Wy/1000).toFixed(1)} cm³</strong></div>
                                                <div>• Tĩnh tải dồn vào mái: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{(curPurlin.weightKNM / rInputs.purlinSpacing).toFixed(4)} kN/m²</strong></div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Kết quả kiểm tra Tôn & Xà gồ */}
                        
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
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${liveCladdingResult.isAllPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
                                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${livePurlinResult.isAllPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
                    </div>
                    
                    {/* 2.2 Tải trọng Gió TCVN 2737:2023 */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-xl mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2 text-primary">
                            <i data-lucide="wind" className="w-5 h-5"></i> 2.2 Tải trọng Gió theo TCVN 2737:2023 (Hình F.5a, Hình F.6 & Hình F.14)
                        </h2>
                        
                        {rResults.traces.wind.length === 0 ? (
                            <p className="text-slate-500 italic print:hidden py-4 text-center">Chưa có kết quả tính toán gió. Nhấn "Phân tích & Tính toán Tải trọng" để xem kết quả.</p>
                        ) : (
                            <div className="space-y-6">
                                {/* Bản vẽ 2D Gió */}
                                {/* Tùy chọn hiển thị 2D/3D */}
                                <div className="flex justify-end mb-2 print:hidden">
                                    <div className="inline-flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg shadow-inner">
                                        <button 
                                            onClick={() => setWindViewMode("2D")} 
                                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${windViewMode === "2D" ? "bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
                                        >
                                            Bản vẽ 2D (Analytical)
                                        </button>
                                        <button 
                                            onClick={() => setWindViewMode("3D")} 
                                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${windViewMode === "3D" ? "bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
                                        >
                                            Mô hình 3D (Visualizer)
                                        </button>
                                    </div>
                                </div>
                                
                                {windViewMode === "2D" ? (
                                    <WindSvg 
                                        geom={rResults.geom || WindEngine.analyzeGeometry(rInputs.L, rInputs.B, rInputs.length, rInputs.H_column, rInputs.H_roof)} 
                                        loadCases={rResults.traces.windCases} 
                                    />
                                ) : (
                                    <Building3DViewer workspaceState={workspaceState} inputs={rInputs} mode="wind"
                                        loadCases={rResults.traces.windCases} 
                                    />
                                )}

                                {/* Bảng tổng hợp kết quả gió */}
                                <div>
                                    <h3 className="font-bold text-base mb-2 text-slate-800 dark:text-white flex items-center gap-2">
                                        <i data-lucide="table" className="w-4 h-4 text-primary"></i>
                                        BẢNG TỔNG HỢP GIÁ TRỊ TẢI TRỌNG GIÓ TÁC DỤNG LÊN KHUNG NGANG (WIND RESULT TABLE)
                                    </h3>
                                    
                                    <div className="space-y-6">
                                        {rResults.traces.windCases && Object.entries(rResults.traces.windCases).map(([dir, caseData]) => {
                                            const wallZones = caseData.surfaces.filter(z => z.surface === 'Tường' || z.surface === 'Wall' || z.surface.includes('Tu'));
                                            const roofZones = caseData.surfaces.filter(z => z.surface === 'Mái' || z.surface === 'Roof' || z.surface.includes('M'));
                                            
                                            const renderZoneRow = (zone, idx) => (
                                                <tr key={`${dir}-${zone.zone}-${idx}`} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                    <td className="p-2 border dark:border-slate-700 text-center font-bold">{zone.zone}</td>
                                                    <td className="p-2 border dark:border-slate-700 text-right font-mono">{zone.ze.toFixed(2)}</td>
                                                    <td className="p-2 border dark:border-slate-700 text-right font-mono">{zone.kz.toFixed(2)}</td>
                                                    <td className="p-2 border dark:border-slate-700 text-right font-mono font-bold">{zone.ce > 0 ? '+' + zone.ce : zone.ce}</td>
                                                    <td className="p-2 border dark:border-slate-700 text-right font-mono text-purple-600 dark:text-purple-400">{zone.ci > 0 ? '+' + zone.ci : zone.ci}</td>
                                                    <td className="p-2 border dark:border-slate-700 text-right font-mono font-bold text-primary">{zone.c_net > 0 ? '+' + zone.c_net : zone.c_net}</td>
                                                    <td className="p-2 border dark:border-slate-700 text-right font-mono">{zone.Gf.toFixed(2)}</td>
                                                    <td className="p-2 border dark:border-slate-700 text-right font-mono font-bold text-blue-600 dark:text-blue-400">{zone.pressure_k.toFixed(3)}</td>
                                                    <td className="p-2 border dark:border-slate-700 text-right font-mono font-bold text-amber-600 dark:text-amber-400">{zone.pressure_d.toFixed(3)}</td>
                                                    <td className="p-2 border dark:border-slate-700 text-right font-mono">{zone.tributaryWidth}</td>
                                                    <td className="p-2 border dark:border-slate-700 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{zone.frameLineLoad_d.toFixed(2)}</td>
                                                </tr>
                                            );

                                            return (
                                                <div key={dir} className="rounded-lg border dark:border-slate-700 shadow-sm overflow-hidden">
                                                    <div className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-2 font-bold text-sm flex justify-between items-center">
                                                        <span>Trường hợp: {caseData.id}</span>
                                                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">Hướng {dir}</span>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs text-left border-collapse bg-white dark:bg-slate-900">
                                                            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase">
                                                                <tr>
                                                                    <th className="p-2.5 border dark:border-slate-700 text-center w-16">Vùng</th>
                                                                    <th className="p-2.5 border dark:border-slate-700 text-right">z_e (m)</th>
                                                                    <th className="p-2.5 border dark:border-slate-700 text-right">k(z_e)</th>
                                                                    <th className="p-2.5 border dark:border-slate-700 text-right">c_e</th>
                                                                    <th className="p-2.5 border dark:border-slate-700 text-right">c_i</th>
                                                                    <th className="p-2.5 border dark:border-slate-700 text-right">c_net</th>
                                                                    <th className="p-2.5 border dark:border-slate-700 text-right">G_f</th>
                                                                    <th className="p-2.5 border dark:border-slate-700 text-right text-blue-600 dark:text-blue-400" title="Áp lực gió tiêu chuẩn">w_k (kN/m²)</th>
                                                                    <th className="p-2.5 border dark:border-slate-700 text-right text-amber-600 dark:text-amber-400" title="Áp lực gió tính toán">w_d (kN/m²)</th>
                                                                    <th className="p-2.5 border dark:border-slate-700 text-right" title="Bề rộng đón gió">B (m)</th>
                                                                    <th className="p-2.5 border dark:border-slate-700 text-right text-emerald-600 dark:text-emerald-400 font-bold" title="Tải phân bố dồn lên khung">q_d (kN/m)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {wallZones.length > 0 && (
                                                                    <>
                                                                        <tr className="bg-blue-50/80 dark:bg-blue-900/30">
                                                                            <td colSpan="11" className="p-2 font-bold text-blue-700 dark:text-blue-300 border dark:border-slate-700"><div className="flex items-center gap-1.5"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg> Tường (Bề mặt đứng)</div></td>
                                                                        </tr>
                                                                        {wallZones.map((zone, idx) => renderZoneRow(zone, idx))}
                                                                    </>
                                                                )}
                                                                {roofZones.length > 0 && (
                                                                    <>
                                                                        <tr className="bg-amber-50/80 dark:bg-amber-900/30">
                                                                            <td colSpan="11" className="p-2 font-bold text-amber-700 dark:text-amber-300 border dark:border-slate-700"><div className="flex items-center gap-1.5"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 22 12 2l10 20"/></svg> Mái (Bề mặt nghiêng)</div></td>
                                                                        </tr>
                                                                        {roofZones.map((zone, idx) => renderZoneRow(zone, idx))}
                                                                    </>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Các bước diễn giải chi tiết kèm ký hiệu toán học */}
                                <div>
                                    <h3 className="font-bold text-base mb-3 text-slate-800 dark:text-white flex items-center gap-2">
                                        <i data-lucide="file-text" className="w-4 h-4 text-primary"></i>
                                        DIỄN GIẢI CHI TIẾT CÔNG THỨC & Ý NGHĨA KÝ HIỆU TOÁN HỌC
                                    </h3>
                                    <div className="space-y-4">
                                        {rResults.traces.wind.map(step => (
                                            <CalculationBlock key={step.stepId} step={step} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2.3 Tĩnh tải & Hoạt tải dồn khung */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-xl mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2 text-primary">
                            <i data-lucide="arrow-down-to-line" className="w-5 h-5"></i> 2.3 Tĩnh tải & Hoạt tải Mái dồn lên Khung ngang
                        </h2>
                        {rResults.traces.gravity.length === 0 ? (
                            <p className="text-slate-500 italic print:hidden py-2">Chưa có kết quả.</p>
                        ) : (
                            <div className="space-y-4">
                                {rResults.traces.gravity.map(step => (
                                    <CalculationBlock key={step.stepId} step={step} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2.4 Tổ hợp tải trọng TCVN 2737:2023 */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="font-bold text-xl mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2 text-primary">
                            <i data-lucide="git-merge" className="w-5 h-5"></i> 2.4 Tổ hợp Tải trọng Thiết kế (TCVN 2737:2023 Điều 4.3)
                        </h2>
                        {rResults.traces.combinations.length === 0 ? (
                            <p className="text-slate-500 italic print:hidden py-2">Chưa có kết quả.</p>
                        ) : (
                            <div className="space-y-4">
                                {rResults.traces.combinations.map(step => (
                                    <CalculationBlock key={step.stepId} step={step} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ========================================================================================= */}
                {/* 3. TAB NỘI LỰC THIẾT KẾ (HỖ TRỢ THÊM / BỚT TỔ HỢP) */}
                {/* ========================================================================================= */}
                <div className={`space-y-6 ${activeTab === 'forces' ? 'block' : 'hidden'} print:block print:mb-8`}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-wrap justify-between items-center border-b dark:border-slate-700 pb-3 mb-4 gap-2">
                            <div>
                                <h2 className="font-bold text-xl flex items-center gap-2 text-primary">
                                    <i data-lucide="bar-chart-2" className="w-5 h-5"></i> 3. Nhập liệu Nội lực Thiết kế từ ETABS / SAP2000
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Cho phép thêm hoặc bớt tổ hợp nội lực tùy ý bằng nút [+] và [-] bên dưới.
                                </p>
                                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg">
                                      <h3 className="font-bold text-blue-800 dark:text-blue-300 text-xs mb-1">Hướng dẫn trích xuất từ ETABS/SAP2000:</h3>
                                      <ul className="text-xs text-blue-700 dark:text-blue-400 list-disc list-inside space-y-0.5">
                                          <li>Chạy phân tích mô hình (Run Analysis).</li>
                                          <li>Vào <b>Display &gt; Show Tables</b> (hoặc Ctrl+T).</li>
                                          <li>Chọn bảng <b>Analysis Results &gt; Element Output &gt; Frame Output &gt; Element Forces - Frames</b>.</li>
                                          <li>Lọc theo <b>Combo</b> tải trọng muốn thiết kế (VD: BAO). Chọn xuất ra Excel.</li>
                                          <li>Nhập các giá trị nội lực khống chế (N, V, M) vào bảng bên dưới.</li>
                                          <li><span className="font-semibold text-red-600 dark:text-red-400">Lưu ý:</span> App dùng quy ước ETABS: Moment uốn chính là <b>M3</b> (trục 3), Lực cắt chính là <b>V2</b> (trục 2).</li>
                                      </ul>
                                  </div>
                            </div>
                            <button 
                                onClick={addForceCase}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-all"
                            >
                                <i data-lucide="plus" className="w-4 h-4"></i> Thêm Tổ hợp Mới
                            </button>
                        </div>

                        <div className="overflow-x-auto rounded-lg border dark:border-slate-700">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="p-3">Tổ hợp / Trường hợp</th>
                                        <th className="p-3">Nguồn phần mềm</th>
                                        <th className="p-3">Lực dọc N (kN)</th>
                                        <th className="p-3">Mô men Mx (kNm)</th>
                                        <th className="p-3">Mô men My (kNm)</th>
                                        <th className="p-3">Lực cắt Vx (kN)</th>
                                        <th className="p-3">Lực cắt Vy (kN)</th>
                                        <th className="p-3 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectState.forces.map((force, index) => (
                                        <tr key={index} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="p-3 font-medium">
                                                <input 
                                                    type="text" 
                                                    value={force.name} 
                                                    onChange={e => handleForceChange(index, 'name', e.target.value)} 
                                                    className="w-full p-1.5 border rounded bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 font-medium text-xs outline-none"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <select 
                                                    value={force.source} 
                                                    onChange={e => handleForceChange(index, 'source', e.target.value)} 
                                                    className="p-1.5 border rounded bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none text-xs"
                                                >
                                                    <option value="ETABS">ETABS</option>
                                                    <option value="SAP2000">SAP2000</option>
                                                    <option value="Manual">Nhập tay</option>
                                                </select>
                                            </td>
                                            <td className="p-3"><input type="number" step="0.1" value={force.N} onChange={e => handleForceChange(index, 'N', e.target.value)} className="w-full p-1.5 border rounded bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none font-mono text-xs font-bold" /></td>
                                            <td className="p-3"><input type="number" step="0.1" value={force.Mx} onChange={e => handleForceChange(index, 'Mx', e.target.value)} className="w-full p-1.5 border rounded bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none font-mono text-xs font-bold text-amber-600 dark:text-amber-400" /></td>
                                            <td className="p-3"><input type="number" step="0.1" value={force.My} onChange={e => handleForceChange(index, 'My', e.target.value)} className="w-full p-1.5 border rounded bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none font-mono text-xs" /></td>
                                            <td className="p-3"><input type="number" step="0.1" value={force.Vx} onChange={e => handleForceChange(index, 'Vx', e.target.value)} className="w-full p-1.5 border rounded bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none font-mono text-xs" /></td>
                                            <td className="p-3"><input type="number" step="0.1" value={force.Vy} onChange={e => handleForceChange(index, 'Vy', e.target.value)} className="w-full p-1.5 border rounded bg-slate-50 dark:bg-slate-900/50 dark:border-slate-600 outline-none font-mono text-xs" /></td>
                                            <td className="p-3 text-center">
                                                <button 
                                                    onClick={() => removeForceCase(index)} 
                                                    className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                                                    title="Xóa tổ hợp này"
                                                >
                                                    <i data-lucide="trash" className="w-4 h-4"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-between items-center print:hidden">
                            <span className="text-xs text-slate-500 italic">Tổng số tổ hợp nội lực đang xét: <strong>{projectState.forces.length}</strong></span>
                            <div className="flex gap-3">
                                <button onClick={loadSolverForces} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 shadow transition-colors" title="Đồng bộ nội lực từ các tổ hợp tải trọng chuẩn TCVN vừa giải">
                                    <i data-lucide="refresh-cw" className="w-3.5 h-3.5"></i> Cập nhật từ Giải khung TCVN
                                </button>
                                <button onClick={addForceCase} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors">
                                    <i data-lucide="plus" className="w-3.5 h-3.5"></i> Thêm Tổ hợp
                                </button>
                                <button onClick={() => setActiveTab('column')} className="bg-primary hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 shadow transition-colors">
                                    <i data-lucide="arrow-right" className="w-4 h-4"></i> Tiến hành Thiết kế Cột
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================================================================= */}
                {/* 4. TAB THIẾT KẾ SÀN BÊ TÔNG CỐT THÉP (HOÀN CHỈNH) */}
                {/* ========================================================================================= */}
                <div className={`space-y-6 ${activeTab === 'slab' ? 'block' : 'hidden'} print:block print:mb-8`}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center border-b dark:border-slate-700 pb-3 mb-4">
                            <h2 className="font-bold text-xl flex items-center gap-2 text-primary">
                                <i data-lucide="grid" className="w-5 h-5"></i> 4. Thiết kế Bản sàn Bê tông Cốt thép (Slab Module)
                            </h2>
                            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 px-3 py-1 rounded-full font-bold">
                                TCVN 5574:2018
                            </span>
                        </div>

                        {/* Thông số ô bản sàn */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-lg border dark:border-slate-700 mb-6">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Nhịp ngắn ô bản L1 (m)</label>
                                <input 
                                    type="number" step="0.1" 
                                    value={rInputs.slabParams.L1} 
                                    onChange={e => setProjectState(prev => ({ ...prev, results: { ...prev.results, isStale: true }, inputs: { ...prev.inputs, slabParams: { ...prev.inputs.slabParams, L1: parseFloat(e.target.value) || 2.5 } } }))} 
                                    className="w-full p-2 border rounded mt-1 bg-white dark:bg-slate-800 font-bold font-mono text-primary text-sm outline-none" 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Nhịp dài ô bản L2 (m)</label>
                                <input 
                                    type="number" step="0.5" 
                                    value={rInputs.slabParams.L2} 
                                    onChange={e => setProjectState(prev => ({ ...prev, results: { ...prev.results, isStale: true }, inputs: { ...prev.inputs, slabParams: { ...prev.inputs.slabParams, L2: parseFloat(e.target.value) || 6.0 } } }))} 
                                    className="w-full p-2 border rounded mt-1 bg-white dark:bg-slate-800 font-bold font-mono text-primary text-sm outline-none" 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Hoạt tải sử dụng (kN/m²)</label>
                                <input 
                                    type="number" step="0.5" 
                                    value={rInputs.slabParams.liveLoad} 
                                    onChange={e => setProjectState(prev => ({ ...prev, results: { ...prev.results, isStale: true }, inputs: { ...prev.inputs, slabParams: { ...prev.inputs.slabParams, liveLoad: parseFloat(e.target.value) || 3.0 } } }))} 
                                    className="w-full p-2 border rounded mt-1 bg-white dark:bg-slate-800 font-bold font-mono text-amber-500 text-sm outline-none" 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Cấp độ bền bê tông</label>
                                <select 
                                    value={rInputs.slabParams.concreteGrade} 
                                    onChange={e => setProjectState(prev => ({ ...prev, results: { ...prev.results, isStale: true }, inputs: { ...prev.inputs, slabParams: { ...prev.inputs.slabParams, concreteGrade: e.target.value } } }))}
                                    className="w-full p-2 border rounded mt-1 bg-white dark:bg-slate-800 font-semibold text-sm outline-none"
                                >
                                    <option value="B20">B20 (M250 - Rb = 11,5 MPa)</option>
                                    <option value="B25">B25 (M350 - Rb = 14,5 MPa)</option>
                                    <option value="B30">B30 (M400 - Rb = 17,0 MPa)</option>
                                </select>
                            </div>
                        </div>

                        {/* Kết quả tính toán sàn */}
                        {rResults.slabResult ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700">
                                        <div className="text-xs text-slate-500 font-semibold">Sơ đồ làm việc & Chiều dày hs:</div>
                                        <div className="text-base font-bold text-primary mt-1">{rResults.slabResult.type} (L2/L1 = {rResults.slabResult.ratio})</div>
                                        <div className="text-sm mt-2 text-slate-600 dark:text-slate-300">
                                            Chiều dày chọn: <strong className="text-amber-600 font-mono text-base">{rResults.slabResult.hs_chosen} mm</strong> (hs ≥ L1/35)
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700">
                                        <div className="text-xs text-slate-500 font-semibold">Tải trọng tác dụng (1m² sàn):</div>
                                        <div className="text-sm mt-1 text-slate-600 dark:text-slate-300">
                                            <div>• Tĩnh tải tính toán gd: <strong className="font-mono text-slate-800 dark:text-white">{rResults.slabResult.loads.gd_slab} kN/m²</strong></div>
                                            <div>• Tổng tải tính toán qd: <strong className="font-mono text-primary">{rResults.slabResult.loads.qd} kN/m²</strong></div>
                                            <div>• Tổng tải tiêu chuẩn qk: <strong className="font-mono text-slate-500">{rResults.slabResult.loads.qk} kN/m²</strong></div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700">
                                        <div className="text-xs text-slate-500 font-semibold">Bố trí cốt thép chịu uốn (dải 1m):</div>
                                        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">{rResults.slabResult.reinforcement.rebarDesignation}</div>
                                        <div className="text-xs mt-1 text-slate-600 dark:text-slate-300">
                                            <div>• As tính toán: <strong>{rResults.slabResult.reinforcement.As_calc_cm2} cm²/m</strong></div>
                                            <div>• As bố trí: <strong>{rResults.slabResult.reinforcement.As_provided_cm2} cm²/m</strong></div>
                                            <div>• Hàm lượng thép μ: <strong>{rResults.slabResult.reinforcement.mu_percent}%</strong> (Đạt 0,1% ≤ μ ≤ 2%)</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bảng diễn giải công thức và ký hiệu toán học */}
                                <div className="p-4 bg-blue-50 dark:bg-slate-900/60 rounded-lg border border-blue-200 dark:border-slate-700 text-xs space-y-2">
                                    <div className="font-bold text-slate-800 dark:text-white text-sm">GHI CHÚ KÝ HIỆU TOÁN HỌC & CÔNG THỨC THIẾT KẾ BẢN SÀN:</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                                        <div>• <strong>h_s = (D/m) · L1:</strong> Chiều dày sơ bộ bản sàn (với m = 30-35 cho bản kê, 25-30 cho bản dầm)</div>
                                        <div>• <strong>M = q_d · L1² / 11:</strong> Mô men uốn tính toán tại nhịp (kNm)</div>
                                        <div>• <strong>α_m = M / (Rb · b · h0²):</strong> Hệ số tính toán cốt thép chịu uốn</div>
                                        <div>• <strong>As = M / (ζ · Rs · h0):</strong> Diện tích cốt thép yêu cầu trên dải rộng b = 1m (cm²/m)</div>
                                        <div>• <strong>μ = As / (b · h0):</strong> Hàm lượng cốt thép trong tiết diện bản sàn</div>
                                        <div>• <strong>Rb, Rs:</strong> Cường độ tính toán chịu nén của bê tông và chịu kéo của cốt thép (MPa)</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 text-center text-slate-400 italic">
                                Nhấn nút "Phân tích & Tính toán Tải trọng" tại Tab 1 để xuất kết quả tính toán bản sàn.
                            </div>
                        )}
                    </div>
                          
<div className="mt-8 flex justify-center print:hidden">
    <button onClick={runCalculations} className="bg-primary hover:bg-blue-700 text-white px-8 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95">
        <i data-lucide="calculator" className="w-5 h-5"></i> Cập nhật & Tính toán Sàn BTCT
    </button>
</div>
{rResults.slabResult && rResults.slabResult.steps && (
                              <div className="mt-8">
                                  <div>
        <h3 className="font-bold text-lg mb-4 text-primary border-b pb-2">DIỄN GIẢI CHI TIẾT CÔNG THỨC & Ý NGHĨA KÝ HIỆU TOÁN HỌC</h3>
        <div className="space-y-4">
            {rResults.slabResult.steps.map(step => <CalculationBlock key={step.stepId} step={step} />)}
        </div>
    </div>
                              </div>
                          )}
                </div>

                {/* ========================================================================================= */}
                {/* 5. TAB THIẾT KẾ DẦM THÉP (HOÀN CHỈNH) */}
                {/* ========================================================================================= */}
                <div className={`space-y-6 ${activeTab === 'beam' ? 'block' : 'hidden'} print:block print:mb-8`}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center border-b dark:border-slate-700 pb-3 mb-4">
                            <h2 className="font-bold text-xl flex items-center gap-2 text-primary">
                                <i data-lucide="minus" className="w-5 h-5"></i> 5. Thiết kế Dầm Thép (Beam Module - Dầm sàn & Kèo dầm mái)
                            </h2>
                            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 px-3 py-1 rounded-full font-bold">
                                TCVN 5575:2024
                            </span>
                        </div>

                        {/* Thông số dầm thép */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-lg border dark:border-slate-700 mb-6">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Nhịp dầm L (m)</label>
                                <input 
                                    type="number" step="0.5" 
                                    value={rInputs.beamParams.L_beam} 
                                    onChange={e => setProjectState(prev => ({ ...prev, results: { ...prev.results, isStale: true }, inputs: { ...prev.inputs, beamParams: { ...prev.inputs.beamParams, L_beam: parseFloat(e.target.value) || 9.0 } } }))} 
                                    className="w-full p-2 border rounded mt-1 bg-white dark:bg-slate-800 font-bold font-mono text-primary text-sm outline-none" 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Bề rộng truyền tải B_d (m)</label>
                                <input 
                                    type="number" step="0.5" 
                                    value={rInputs.beamParams.tributaryWidth} 
                                    onChange={e => setProjectState(prev => ({ ...prev, results: { ...prev.results, isStale: true }, inputs: { ...prev.inputs, beamParams: { ...prev.inputs.beamParams, tributaryWidth: parseFloat(e.target.value) || 2.5 } } }))} 
                                    className="w-full p-2 border rounded mt-1 bg-white dark:bg-slate-800 font-bold font-mono text-primary text-sm outline-none" 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Chọn tiết diện Dầm chữ I</label>
                                <select 
                                    value={rInputs.beamParams.chosenBeamId} 
                                    onChange={e => setProjectState(prev => ({ ...prev, results: { ...prev.results, isStale: true }, inputs: { ...prev.inputs, beamParams: { ...prev.inputs.beamParams, chosenBeamId: e.target.value } } }))}
                                    className="w-full p-2 border rounded mt-1 bg-white dark:bg-slate-800 font-semibold text-sm outline-none text-primary"
                                >
                                    {StandardData.TCVN5575_2024.BeamLibrary.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} (Wx = {b.Wx} cm³, {b.mass} kg/m)</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Kết quả kiểm tra dầm thép */}
                        {rResults.beamResult ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700">
                                        <div className="text-xs text-slate-500 font-semibold">Tải trọng dồn vào dầm:</div>
                                        <div className="text-base font-bold text-primary mt-1 font-mono">{rResults.beamResult.qd_line} kN/m</div>
                                        <div className="text-xs text-slate-500 mt-1">Tải tiêu chuẩn: {rResults.beamResult.qk_line} kN/m</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700">
                                        <div className="text-xs text-slate-500 font-semibold">Nội lực lớn nhất:</div>
                                        <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">Mmax = {rResults.beamResult.M_max_kNm} kNm</div>
                                        <div className="text-xs text-slate-500 mt-1 font-mono">Vmax = {rResults.beamResult.V_max_kN} kN</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700">
                                        <div className="text-xs text-slate-500 font-semibold">Kiểm tra Ứng suất Bền:</div>
                                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">σ = {rResults.beamResult.checks.sigma_uon_MPa || (rResults.beamResult.checks.sigma_uon * 10).toFixed(2)} MPa</div>
                                        <div className="text-xs text-slate-500 mt-1">f·γc = {rResults.beamResult.checks.f_allow_MPa || (rResults.beamResult.checks.f_allow * 10).toFixed(2)} MPa ({rResults.beamResult.checks.isBendingPass ? 'ĐẠT BỀN' : 'VƯỢT'})</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border dark:border-slate-700">
                                        <div className="text-xs text-slate-500 font-semibold">Kiểm tra Độ võng f/L:</div>
                                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">f/L = {rResults.beamResult.checks.defl_ratio}</div>
                                        <div className="text-xs text-slate-500 mt-1">Giới hạn [f/L] = {rResults.beamResult.checks.defl_limit} ({rResults.beamResult.checks.isDeflectionPass ? 'ĐẠT VÕNG' : 'KHÔNG ĐẠT'})</div>
                                    </div>
                                </div>

                                {/* Chi tiết kiểm tra & ghi chú ký hiệu */}
                                <div className="p-4 bg-blue-50 dark:bg-slate-900/60 rounded-lg border border-blue-200 dark:border-slate-700 text-xs space-y-2">
                                    <div className="font-bold text-slate-800 dark:text-white text-sm">GHI CHÚ KÝ HIỆU TOÁN HỌC & TIÊU CHUẨN THIẾT KẾ DẦM THÉP (TCVN 5575:2024):</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                                        <div>• <strong>σ = M / Wx ≤ f · γc:</strong> Ứng suất uốn pháp lớn nhất tại thớ ngoài cùng tiết diện</div>
                                        <div>• <strong>τ = V · S / (Ix · tw) ≤ fv · γc:</strong> Ứng suất tiếp cắt lớn nhất tại trục trung hòa bản bụng (τ = {rResults.beamResult.checks.tau_MPa} MPa ≤ [fv]={rResults.beamResult.checks.fv_allow} MPa)</div>
                                        <div>• <strong>f = (5/384) · (qk · L⁴ / (E · Ix)):</strong> Độ võng đàn hồi lớn nhất ở giữa nhịp dầm (f = {rResults.beamResult.checks.defl_cm} cm)</div>
                                        <div>• <strong>Ổn định tổng thể:</strong> {rResults.beamResult.checks.stabilityNote}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 text-center text-slate-400 italic">
                                Nhấn nút "Phân tích & Tính toán Tải trọng" tại Tab 1 để xuất kết quả kiểm tra dầm thép.
                            </div>
                        )}
                    </div>
                          
<div className="mt-8 flex justify-center print:hidden">
    <button onClick={runCalculations} className="bg-primary hover:bg-blue-700 text-white px-8 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95">
        <i data-lucide="calculator" className="w-5 h-5"></i> Cập nhật & Tính toán Dầm Thép
    </button>
</div>
{rResults.beamResult && rResults.beamResult.steps && (
                              <div className="mt-8">
                                  <div>
        <h3 className="font-bold text-lg mb-4 text-primary border-b pb-2">DIỄN GIẢI CHI TIẾT CÔNG THỨC & Ý NGHĨA KÝ HIỆU TOÁN HỌC</h3>
        <div className="space-y-4">
            {rResults.beamResult.steps.map(step => <CalculationBlock key={step.stepId} step={step} />)}
        </div>
    </div>
                              </div>
                          )}
                </div>

                {/* ========================================================================================= */}
                {/* 6. TAB THIẾT KẾ CỘT THÉP */}
                {/* ========================================================================================= */}
                <div className={`space-y-6 ${activeTab === 'column' ? 'block' : 'hidden'} print:block print:mb-8`}>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700 mb-6">
                        <div className="flex justify-between items-center border-b dark:border-slate-700 pb-3 mb-4">
                            <h2 className="font-bold text-xl flex items-center gap-2 text-primary">
                                <i data-lucide="box" className="w-5 h-5"></i> 6.1 Đề xuất Tiết diện Cột Thép (Column Proposal Engine)
                            </h2>
                            <button onClick={runSectionProposal} className="bg-primary hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow transition-all">
                                <i data-lucide="cpu" className="w-4 h-4"></i> Khởi chạy Đề xuất Tiết diện Cột
                            </button>
                        </div>
                        
                        <p className="text-xs text-slate-500 mb-4">
                            Hệ thống tự động duyệt các trường hợp nội lực bất lợi nhất trong Tab 3, tính chiều dài tính toán L₀ₓ = μₓ·H và L₀ᵧ = μᵧ·H, sau đó kiểm tra đồng thời: Độ bền nén uốn, Ổn định tổng thể trong mặt phẳng (φₑ), Ổn định ngoài mặt phẳng (c·φᵧ) và Ổn định cục bộ bản cánh/bụng.
                        </p>

                        {rResults.proposedSections.column.length > 0 && (
                            <div className="overflow-x-auto rounded-lg border dark:border-slate-700">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-slate-100 dark:bg-slate-900 font-bold uppercase text-slate-700 dark:text-slate-300">
                                        <tr>
                                            <th className="p-3 border-b dark:border-slate-700">Tên Tiết diện</th>
                                            <th className="p-3 border-b dark:border-slate-700">Kích thước (h × b × tw × tf)</th>
                                            <th className="p-3 border-b dark:border-slate-700">Khối lượng (kg/m)</th>
                                            <th className="p-3 border-b dark:border-slate-700">Diện tích A (cm²)</th>
                                            <th className="p-3 border-b dark:border-slate-700 text-center">Hệ số tận dụng max</th>
                                            <th className="p-3 border-b dark:border-slate-700">Kiểm tra chi phối</th>
                                            <th className="p-3 border-b dark:border-slate-700 text-center">Trạng thái</th>
                                            <th className="p-3 border-b dark:border-slate-700 text-center">Lựa chọn</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rResults.proposedSections.column.map((cand, idx) => (
                                            <tr key={idx} className={`border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${rResults.selectedSections.column === cand.section ? 'bg-blue-50 dark:bg-blue-900/30 font-bold' : ''}`}>
                                                <td className="p-3 font-mono font-bold text-primary">
                                                    <span>{cand.section.name}</span>
                                                    {idx === 0 && (
                                                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                                            ⭐ Khuyến nghị kinh tế
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 font-mono">{cand.section.h} × {cand.section.b} × {cand.section.tw} × {cand.section.tf} mm</td>
                                                <td className="p-3 font-mono">{cand.section.massPerMeter.toFixed(1)}</td>
                                                <td className="p-3 font-mono">{(cand.section.A / 100).toFixed(1)} cm²</td>
                                                <td className="p-3 text-center font-mono font-bold">
                                                    <span className={`px-2 py-0.5 rounded text-xs ${(cand.utilization?.max || 0) > 0.85 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : ((cand.utilization?.max || 0) < 0.5 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300')}`}>
                                                        {((cand.utilization?.max || 0) * 100).toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="p-3 text-xs text-slate-500">
                                                    {(cand.utilization?.outPlane >= cand.utilization?.inPlane && cand.utilization?.outPlane >= cand.utilization?.strength) ? 'Ổn định ngoài MP (c·φy)' :
                                                    (cand.utilization?.inPlane >= cand.utilization?.strength ? 'Ổn định trong MP (φe)' :
                                                    (cand.utilization?.slenderness >= cand.utilization?.strength ? 'Độ mảnh ([λ]=180)' : 'Bền nén uốn (σ)'))}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${(cand.utilization?.max || 0) > 0.85 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : ((cand.utilization?.max || 0) < 0.5 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300')}`}>
                                                        {(cand.utilization?.max || 0) < 0.5 ? 'Dư thừa' : ((cand.utilization?.max || 0) <= 0.85 ? 'Tối ưu' : 'Sát tải')}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => selectSection(cand.section)} className="text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded font-bold transition-colors">
                                                        Chọn & Xuất Thuyết minh
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Kiểm tra chi tiết cột đã chọn */}
                    {rResults.selectedSections.column && rResults.traces.column.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700 mb-6">
                            <h2 className="font-bold text-xl mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2 text-primary">
                                <i data-lucide="check-square" className="w-5 h-5"></i> 6.2 Báo cáo Kiểm tra Chi tiết Tiết diện Cột ({rResults.selectedSections.column.name})
                            </h2>
                            
                            <div className="mb-6 flex justify-center">
                                <ISectionSVG 
                                    h={rResults.selectedSections.column.h} 
                                    b={rResults.selectedSections.column.b} 
                                    tw={rResults.selectedSections.column.tw} 
                                    tf={rResults.selectedSections.column.tf} 
                                />
                            </div>

                            <div className="space-y-4">
                                {rResults.traces.column.map(step => (
                                    <CalculationBlock key={step.stepId} step={step} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                
                {/* ===================== TAB 8: REPORT VIEWER ===================== */}
                <div style={{ display: activeTab === 'report' ? 'block' : 'none' }}>
                    <ReportViewer projectState={projectState} />
                </div>

                {/* ===================== TAB 7: BẢNG TRA TIẾT DIỆN ===================== */}
                <div style={{ display: activeTab === 'lookup' ? 'block' : 'none' }}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700 mb-6">
                        <h2 className="font-bold text-xl mb-4 border-b dark:border-slate-700 pb-2 flex items-center gap-2 text-primary">
                            <i data-lucide="book-open" className="w-5 h-5"></i> 7. Bảng tra Tiết diện Thép theo TCVN
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Tra cứu nhanh thông số tiết diện xà gồ (C/Z), tôn lợp mái, và thép hình chữ I. Dữ liệu từ catalogue Zamil Steel, Hoa Sen và TCVN 5575:2024.
                        </p>
                        {(() => {
                            const LookupComponent = (typeof window !== 'undefined' && window.SectionLookup) || (typeof SectionLookup !== 'undefined' ? SectionLookup : null);
                            if (LookupComponent) {
                                return (
                                    <LookupComponent 
                                        onSelectPurlin={(purlin) => {
                                            handleInputChange('selectedPurlinId', purlin.id);
                                            alert(`Đã chọn xà gồ ${purlin.name} làm xà gồ mái cho Dự án. Vui lòng bấm 'Cập nhật tính toán' để chạy lại bài toán kiểm tra!`);
                                        }}
                                        onSelectCladding={(sheet) => {
                                            handleInputChange('selectedCladdingId', sheet.id);
                                            alert(`Đã chọn tôn lợp ${sheet.name} cho Dự án. Vui lòng bấm 'Cập nhật tính toán' để chạy lại bài toán kiểm tra!`);
                                        }}
                                        onSelectIBeam={(colSec) => {
                                            selectSection(colSec);
                                            setActiveTab('column');
                                            alert(`Đã chọn tiết diện ${colSec.name} làm Cột Thép và chuyển tới Tab Kiểm tra Cột!`);
                                        }}
                                        onSelectBeam={(beam) => {
                                            setProjectState(prev => ({
                                                ...prev,
                                                inputs: {
                                                    ...prev.inputs,
                                                    beamParams: { ...prev.inputs.beamParams, chosenBeamId: beam.id }
                                                }
                                            }));
                                            markStale();
                                            setActiveTab('beam');
                                            alert(`Đã chọn dầm ${beam.name} cho Sàn BTCT và chuyển tới Tab Thiết kế Dầm!`);
                                        }}
                                        currentPurlinId={projectState.inputs.selectedPurlinId}
                                        currentCladdingId={projectState.inputs.selectedCladdingId}
                                        currentColumnSection={rResults.selectedSections?.column}
                                        currentBeamId={projectState.inputs.beamParams?.chosenBeamId}
                                    />
                                );
                            }
                            return (
                                <div className="text-center py-12 text-slate-400">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                    <p className="font-medium text-slate-600 dark:text-slate-300">Đang tải bảng tra tiết diện...</p>
                                    <p className="text-xs text-slate-400 mt-1">Dữ liệu xà gồ C/Z, tôn lợp và thép hình chữ I theo TCVN 5575:2024</p>
                                </div>
                            );
                        })()}
                    </div>
                </div>

            </main>
        </div>
    );

    const WorkspaceLayout = window.WorkspaceLayout || (({children}) => <div>{children}</div>);
    const Dashboard = window.Dashboard || (() => <div>Loading Dashboard...</div>);

    return (
        <WorkspaceLayout 
            workspaceState={workspaceState}
            activeModule={activeModule} 
            onModuleChange={handleModuleChange}
            aiPanelOpen={aiPanelOpen}
            toggleAiPanel={() => setAiPanelOpen(!aiPanelOpen)}
            projectTitle={rMeta.projectName || "Steel Design Project"}
        >
            {activeModule === 'dashboard' ? (
                workspaceState ? <Dashboard workspaceState={workspaceState} /> : <div>Initializing Workspace...</div>
            ) : activeModule === 'model' ? (
                workspaceState ? <ModelWorkspace workspaceState={workspaceState} /> : <div>Loading 3D Model...</div>
            ) : activeModule === 'combinations' ? (
                workspaceState ? <LoadCombinationManager workspaceState={workspaceState} /> : <div>Loading Combinations...</div>
            ) : activeModule === 'report' ? (
                workspaceState ? <WorkspaceReport workspaceState={workspaceState} /> : <div>Loading Report...</div>
            ) : (
                legacyUI
            )}
        </WorkspaceLayout>
    );
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary captured an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 font-sans">
                    <div className="max-w-xl w-full bg-slate-800 border border-amber-500/50 rounded-2xl p-8 shadow-2xl text-center space-y-4">
                        <div className="w-16 h-16 bg-amber-900/40 text-amber-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-amber-500/30">
                            ⚠️
                        </div>
                        <h2 className="text-xl font-bold text-white">Trình xem gặp sự cố hiển thị</h2>
                        <p className="text-slate-400 text-sm">
                            Dữ liệu đồ án của bạn đã được bảo vệ và lưu an toàn trong trình duyệt. Bạn có thể nhấn Thử lại hoặc Tải lại trang.
                        </p>
                        <div className="p-3 bg-slate-950 rounded text-left text-xs font-mono text-red-300 overflow-x-auto max-h-32 border border-slate-700">
                            {this.state.error?.toString()}
                        </div>
                        <div className="flex justify-center gap-3 pt-2">
                            <button 
                                onClick={() => this.setState({ hasError: false, error: null })} 
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                            >
                                Thử lại
                            </button>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                            >
                                Tải lại trang (F5)
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);
