const { useState, useMemo, useEffect } = React;

function SectionLookup() {
  const [subTab, setSubTab] = useState('purlin'); // purlin, sheet, ibeam
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, C, Z for purlin
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [selectedRow, setSelectedRow] = useState(null);

  // Reset state when changing tabs
  useEffect(() => {
    setSearchText('');
    setFilterType('all');
    setSortField(null);
    setSortDir('asc');
    setSelectedRow(null);
  }, [subTab]);

  // Data Sources
  const purlinData = window.StandardData?.TCVN2737_2023?.PurlinAndCladding?.purlinProfiles || [];
  const sheetData = window.StandardData?.TCVN2737_2023?.PurlinAndCladding?.sheetProfiles || [];
  const ibeamData = window.TCVN5575_2024?.BeamLibrary || [];

  // Filter and Sort Data
  const activeData = useMemo(() => {
    let data = [];
    if (subTab === 'purlin') data = purlinData;
    else if (subTab === 'sheet') data = sheetData;
    else if (subTab === 'ibeam') data = ibeamData;

    // Filter Type
    if (subTab === 'purlin' && filterType !== 'all') {
      data = data.filter(d => d.type === filterType);
    }

    // Search
    if (searchText) {
      const q = searchText.toLowerCase();
      data = data.filter(d => {
        const name = d.name || d.id || '';
        return name.toLowerCase().includes(q);
      });
    }

    // Sort
    if (sortField) {
      data = [...data].sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        
        // Handle computed values for purlin (mm^4 -> cm^4) if sorting by those fields,
        // though sorting by the raw values gives the same order.
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [subTab, purlinData, sheetData, ibeamData, filterType, searchText, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="ml-1 inline-block w-3 text-gray-400 opacity-50 text-xs">↕</span>;
    return <span className="ml-1 inline-block w-3 text-blue-600 text-xs font-bold">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const Th = ({ field, label, className = "" }) => (
    <th 
      className={`px-3 py-3 border-b-2 border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center ${className.includes('text-right') ? 'justify-end' : 'justify-center'}`}>
        {label}
        <SortIcon field={field} />
      </div>
    </th>
  );

  const Td = ({ children, className = "", right = true }) => (
    <td className={`px-3 py-3 border-b border-gray-200 text-sm whitespace-nowrap dark:border-gray-700 dark:text-gray-200 ${right ? 'text-right' : 'text-center'} ${className}`}>
      {children}
    </td>
  );

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return Number(num).toLocaleString('vi-VN', { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
  };

  // SVG Renderers
  const renderPurlinSVG = (type) => {
    return (
      <svg viewBox="-20 -20 140 180" className="w-full h-full max-h-48 drop-shadow-md">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
          </marker>
        </defs>
        {type === 'C' ? (
          <g>
            <path d="M 80,20 L 20,20 L 20,120 L 80,120 M 80,20 L 80,40 M 80,120 L 80,100" fill="none" stroke="#2563eb" strokeWidth="4" />
            <line x1="10" y1="20" x2="10" y2="120" stroke="#6b7280" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <text x="0" y="70" fontSize="12" fill="#4b5563" textAnchor="end">h</text>
            <line x1="20" y1="10" x2="80" y2="10" stroke="#6b7280" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <text x="50" y="5" fontSize="12" fill="#4b5563" textAnchor="middle">b</text>
            <line x1="90" y1="20" x2="90" y2="40" stroke="#6b7280" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <text x="95" y="34" fontSize="12" fill="#4b5563" textAnchor="start">c</text>
          </g>
        ) : (
          <g>
            <path d="M 80,20 L 20,20 L 20,120 L 80,120 M 80,20 L 80,40 M 20,120 L 20,100" fill="none" stroke="#2563eb" strokeWidth="4" />
            <line x1="10" y1="20" x2="10" y2="120" stroke="#6b7280" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <text x="0" y="70" fontSize="12" fill="#4b5563" textAnchor="end">h</text>
            <line x1="20" y1="10" x2="80" y2="10" stroke="#6b7280" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <text x="50" y="5" fontSize="12" fill="#4b5563" textAnchor="middle">b</text>
          </g>
        )}
      </svg>
    );
  };

  const renderIBeamSVG = () => {
    return (
      <svg viewBox="-20 -20 140 180" className="w-full h-full max-h-48 drop-shadow-md">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
          </marker>
        </defs>
        <g>
          <path d="M 20,20 L 80,20 M 50,20 L 50,120 M 20,120 L 80,120" fill="none" stroke="#2563eb" strokeWidth="8" strokeLinecap="square" />
          <line x1="10" y1="20" x2="10" y2="120" stroke="#6b7280" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
          <text x="0" y="70" fontSize="12" fill="#4b5563" textAnchor="end">h</text>
          <line x1="20" y1="10" x2="80" y2="10" stroke="#6b7280" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
          <text x="50" y="5" fontSize="12" fill="#4b5563" textAnchor="middle">b</text>
          <text x="60" y="70" fontSize="12" fill="#4b5563" textAnchor="start">tw</text>
          <text x="85" y="24" fontSize="12" fill="#4b5563" textAnchor="start">tf</text>
        </g>
      </svg>
    );
  };

  const renderSheetSVG = () => {
    return (
      <svg viewBox="0 0 200 100" className="w-full h-full max-h-32 drop-shadow-md">
        <path d="M 10,50 Q 30,10 50,50 T 90,50 T 130,50 T 170,50 T 210,50" fill="none" stroke="#2563eb" strokeWidth="4" />
      </svg>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full max-h-[85vh]">
      {/* Header & Tabs */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Bảng tra Đặc trưng Hình học</h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            onClick={() => setSubTab('purlin')}
            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${subTab === 'purlin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <i data-lucide="ruler" className="w-4 h-4 mr-2"></i> Bảng tra Xà gồ
          </button>
          <button 
            onClick={() => setSubTab('sheet')}
            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${subTab === 'sheet' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <i data-lucide="layers" className="w-4 h-4 mr-2"></i> Bảng tra Tôn lợp
          </button>
          <button 
            onClick={() => setSubTab('ibeam')}
            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${subTab === 'ibeam' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <i data-lucide="box" className="w-4 h-4 mr-2"></i> Bảng tra Thép I
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i data-lucide="search" className="h-4 w-4 text-gray-400"></i>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm ký hiệu..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          
          {subTab === 'purlin' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Loại:</span>
              <button onClick={() => setFilterType('all')} className={`px-3 py-1 rounded-md text-xs font-medium ${filterType === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>Tất cả</button>
              <button onClick={() => setFilterType('C')} className={`px-3 py-1 rounded-md text-xs font-medium ${filterType === 'C' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>Chữ C</button>
              <button onClick={() => setFilterType('Z')} className={`px-3 py-1 rounded-md text-xs font-medium ${filterType === 'Z' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>Chữ Z</button>
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Số lượng: <span className="font-semibold text-gray-700 dark:text-gray-300">{activeData.length}</span>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto bg-gray-50 p-4 dark:bg-gray-800">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-3 py-3 border-b-2 border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 w-12">STT</th>
                  
                  {subTab === 'purlin' && (
                    <>
                      <Th field="name" label="Ký hiệu" className="text-left" />
                      <Th field="type" label="Loại" />
                      <Th field="h" label="h (mm)" className="text-right" />
                      <Th field="b" label="b (mm)" className="text-right" />
                      <Th field="c" label="c (mm)" className="text-right" />
                      <Th field="t" label="t (mm)" className="text-right" />
                      <Th field="weightKgM" label="TL (kg/m)" className="text-right" />
                      <Th field="Ix" label="Ix (cm⁴)" className="text-right" />
                      <Th field="Iy" label="Iy (cm⁴)" className="text-right" />
                      <Th field="Wx" label="Wx (cm³)" className="text-right" />
                      <Th field="Wy" label="Wy (cm³)" className="text-right" />
                    </>
                  )}
                  
                  {subTab === 'sheet' && (
                    <>
                      <Th field="name" label="Tên tôn" className="text-left" />
                      <Th field="thickness" label="Dày (mm)" className="text-right" />
                      <Th field="weightKgM2" label="TL (kg/m²)" className="text-right" />
                      <Th field="weightKNM2" label="TL (kN/m²)" className="text-right" />
                      <Th field="Ix" label="Ix (cm⁴/m)" className="text-right" />
                      <Th field="Wx" label="Wx (cm³/m)" className="text-right" />
                      <Th field="Ma" label="[M] (kN.m/m)" className="text-right" />
                      <Th field="Va" label="[V] (kN/m)" className="text-right" />
                    </>
                  )}

                  {subTab === 'ibeam' && (
                    <>
                      <Th field="name" label="Ký hiệu" className="text-left" />
                      <Th field="h" label="h (mm)" className="text-right" />
                      <Th field="b" label="b (mm)" className="text-right" />
                      <Th field="tw" label="tw (mm)" className="text-right" />
                      <Th field="tf" label="tf (mm)" className="text-right" />
                      <Th field="A" label="A (cm²)" className="text-right" />
                      <Th field="Ix" label="Ix (cm⁴)" className="text-right" />
                      <Th field="Wx" label="Wx (cm³)" className="text-right" />
                      <Th field="Iy" label="Iy (cm⁴)" className="text-right" />
                      <Th field="Wy" label="Wy (cm³)" className="text-right" />
                      <Th field="mass" label="TL (kg/m)" className="text-right" />
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {activeData.map((row, index) => {
                  const isSelected = selectedRow?.id === row.id && selectedRow?.name === row.name;
                  return (
                    <tr 
                      key={`${row.id}-${index}`}
                      onClick={() => setSelectedRow(isSelected ? null : row)}
                      className={`cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30 ${isSelected ? 'bg-blue-100 border-l-4 border-l-blue-500 dark:bg-blue-900/50' : 'even:bg-gray-50 border-l-4 border-l-transparent dark:even:bg-gray-800/50'}`}
                    >
                      <Td right={false} className="font-medium text-gray-500">{index + 1}</Td>
                      
                      {subTab === 'purlin' && (
                        <>
                          <Td right={false} className="font-semibold text-gray-900 dark:text-gray-100 text-left">{row.name}</Td>
                          <Td right={false}>
                            <span className={`px-2 py-1 text-xs font-bold rounded-md ${row.type === 'C' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'}`}>{row.type}</span>
                          </Td>
                          <Td>{formatNumber(row.h, 0)}</Td>
                          <Td>{formatNumber(row.b, 0)}</Td>
                          <Td>{formatNumber(row.c, 0)}</Td>
                          <Td>{formatNumber(row.t, 1)}</Td>
                          <Td>{formatNumber(row.weightKgM, 2)}</Td>
                          <Td>{formatNumber(row.Ix / 10000, 2)}</Td>
                          <Td>{formatNumber(row.Iy / 10000, 2)}</Td>
                          <Td>{formatNumber(row.Wx / 1000, 2)}</Td>
                          <Td>{formatNumber(row.Wy / 1000, 2)}</Td>
                        </>
                      )}

                      {subTab === 'sheet' && (
                        <>
                          <Td right={false} className="font-semibold text-gray-900 dark:text-gray-100 text-left">{row.name}</Td>
                          <Td>{formatNumber(row.thickness, 2)}</Td>
                          <Td>{formatNumber(row.weightKgM2, 2)}</Td>
                          <Td>{formatNumber(row.weightKNM2, 4)}</Td>
                          <Td>{formatNumber(row.Ix, 2)}</Td>
                          <Td>{formatNumber(row.Wx, 2)}</Td>
                          <Td>{formatNumber(row.Ma, 2)}</Td>
                          <Td>{formatNumber(row.Va, 2)}</Td>
                        </>
                      )}

                      {subTab === 'ibeam' && (
                        <>
                          <Td right={false} className="font-semibold text-gray-900 dark:text-gray-100 text-left">{row.name}</Td>
                          <Td>{formatNumber(row.h, 0)}</Td>
                          <Td>{formatNumber(row.b, 0)}</Td>
                          <Td>{formatNumber(row.tw, 1)}</Td>
                          <Td>{formatNumber(row.tf, 1)}</Td>
                          <Td>{formatNumber(row.A, 2)}</Td>
                          <Td>{formatNumber(row.Ix, 0)}</Td>
                          <Td>{formatNumber(row.Wx, 1)}</Td>
                          <Td>{formatNumber(row.Iy, 1)}</Td>
                          <Td>{formatNumber(row.Wy, 1)}</Td>
                          <Td>{formatNumber(row.mass, 2)}</Td>
                        </>
                      )}
                    </tr>
                  );
                })}
                {activeData.length === 0 && (
                  <tr>
                    <td colSpan="12" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                      Không tìm thấy dữ liệu phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedRow && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 flex justify-center items-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              {subTab === 'purlin' && renderPurlinSVG(selectedRow.type)}
              {subTab === 'ibeam' && renderIBeamSVG()}
              {subTab === 'sheet' && renderSheetSVG()}
            </div>
            
            <div className="w-full md:w-2/3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{selectedRow.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Chi tiết thông số kỹ thuật</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {subTab === 'purlin' && (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Chiều cao (h)</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.h} <span className="text-xs font-normal text-gray-500">mm</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Bề rộng (b)</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.b} <span className="text-xs font-normal text-gray-500">mm</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Cánh (c)</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.c} <span className="text-xs font-normal text-gray-500">mm</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Chiều dày (t)</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.t} <span className="text-xs font-normal text-gray-500">mm</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Moment quán tính Ix</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{formatNumber(selectedRow.Ix / 10000, 2)} <span className="text-xs font-normal text-gray-500">cm⁴</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Moment quán tính Iy</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{formatNumber(selectedRow.Iy / 10000, 2)} <span className="text-xs font-normal text-gray-500">cm⁴</span></div>
                    </div>
                  </>
                )}
                
                {subTab === 'sheet' && (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Chiều dày</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.thickness} <span className="text-xs font-normal text-gray-500">mm</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Trọng lượng</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.weightKgM2} <span className="text-xs font-normal text-gray-500">kg/m²</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Momen cho phép [M]</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.Ma} <span className="text-xs font-normal text-gray-500">kN.m/m</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Lực cắt cho phép [V]</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.Va} <span className="text-xs font-normal text-gray-500">kN/m</span></div>
                    </div>
                  </>
                )}

                {subTab === 'ibeam' && (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Chiều cao (h)</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.h} <span className="text-xs font-normal text-gray-500">mm</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Bề rộng (b)</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.b} <span className="text-xs font-normal text-gray-500">mm</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Chiều dày bản bụng (tw)</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.tw} <span className="text-xs font-normal text-gray-500">mm</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Chiều dày bản cánh (tf)</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.tf} <span className="text-xs font-normal text-gray-500">mm</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Diện tích (A)</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.A} <span className="text-xs font-normal text-gray-500">cm²</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Trọng lượng</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.mass} <span className="text-xs font-normal text-gray-500">kg/m</span></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.SectionLookup = SectionLookup;
