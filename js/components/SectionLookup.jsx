const { useState, useMemo, useEffect } = React;

function SectionLookup({
  onSelectPurlin,
  onSelectCladding,
  onSelectIBeam,
  onSelectBeam,
  currentPurlinId,
  currentCladdingId,
  currentColumnSection,
  currentBeamId
} = {}) {
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
  const ibeamData = window.StandardData?.TCVN5575_2024?.BeamLibrary || window.TCVN5575_2024?.BeamLibrary || [];

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
            <path d="M 90,40 L 90,20 L 50,20 L 50,120 L 10,120 L 10,100" fill="none" stroke="#059669" strokeWidth="4" />
            <line x1="0" y1="20" x2="0" y2="120" stroke="#6b7280" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <text x="-5" y="75" fontSize="12" fill="#4b5563" textAnchor="end">h</text>
            <line x1="50" y1="10" x2="90" y2="10" stroke="#6b7280" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <text x="70" y="5" fontSize="12" fill="#4b5563" textAnchor="middle">b</text>
            <line x1="100" y1="20" x2="100" y2="40" stroke="#6b7280" strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
            <text x="105" y="34" fontSize="12" fill="#4b5563" textAnchor="start">c</text>
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
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z"/>
              <path d="m14.5 3.5 2 2"/><path d="m11.5 6.5 2 2"/><path d="m8.5 9.5 2 2"/><path d="m5.5 12.5 2 2"/>
            </svg>
            Bảng tra Xà gồ
          </button>
          <button 
            onClick={() => setSubTab('sheet')}
            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${subTab === 'sheet' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
            Bảng tra Tôn lợp
          </button>
          <button 
            onClick={() => setSubTab('ibeam')}
            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${subTab === 'ibeam' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}`}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
            </svg>
            Bảng tra Thép I
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
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
                          <Td right={false} className="font-semibold text-gray-900 dark:text-gray-100 text-left">
                            <span>{row.name}</span>
                            {currentPurlinId === row.id && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border border-green-300 dark:border-green-800">
                                Đang dùng
                              </span>
                            )}
                          </Td>
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
                          <Td right={false} className="font-semibold text-gray-900 dark:text-gray-100 text-left">
                            <span>{row.name}</span>
                            {currentCladdingId === row.id && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border border-green-300 dark:border-green-800">
                                Đang dùng
                              </span>
                            )}
                          </Td>
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
                          <Td right={false} className="font-semibold text-gray-900 dark:text-gray-100 text-left">
                            <span>{row.name}</span>
                            {(currentColumnSection?.id === row.id || currentColumnSection?.name === row.name) && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border border-green-300 dark:border-green-800">
                                Cột hiện tại
                              </span>
                            )}
                            {currentBeamId === row.id && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                Dầm hiện tại
                              </span>
                            )}
                          </Td>
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
            
            <div className="w-full md:w-2/3 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedRow.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Chi tiết thông số kỹ thuật hình học & cơ lý</p>
                  </div>
                  
                  {/* Các nút bấm thao tác trực tiếp vào Đồ án */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {subTab === 'purlin' && onSelectPurlin && (
                      <button 
                        onClick={() => onSelectPurlin(selectedRow)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                        title="Đặt làm loại xà gồ chính cho mái công trình"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Chọn làm Xà gồ Mái
                      </button>
                    )}
                    {subTab === 'sheet' && onSelectCladding && (
                      <button 
                        onClick={() => onSelectCladding(selectedRow)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                        title="Đặt làm loại tôn lợp chính cho mái công trình"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Chọn làm Tôn lợp Mái
                      </button>
                    )}
                    {subTab === 'ibeam' && (
                      <div className="flex items-center gap-2">
                        {onSelectIBeam && (
                          <button 
                            onClick={() => onSelectIBeam(selectedRow)}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                            title="Chọn tiết diện này cho cột thép và chạy kiểm tra khả năng chịu lực"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                              <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
                            </svg>
                            Chọn làm Cột Thép
                          </button>
                        )}
                        {onSelectBeam && (
                          <button 
                            onClick={() => onSelectBeam(selectedRow)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                            title="Chọn tiết diện này cho dầm thép đỡ sàn BTCT"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Chọn làm Dầm Sàn
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              
                <div className="mb-4 p-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                  <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                    Nguồn trích dẫn: {subTab === 'ibeam' ? 'Phụ lục TCVN 5575:2024' : 'Catalogue Nhà sản xuất'}
                  </h4>
                  <p className="text-xs text-blue-600/80 dark:text-blue-300/80 italic">
                    Ghi chú: Để hiển thị hình ảnh bảng tra nguồn thực tế, vui lòng chèn ảnh tương ứng vào hệ thống hoặc cấu hình đường dẫn ảnh trong StandardData.
                  </p>
                </div>
              
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
                      <div className="text-xs text-gray-500 dark:text-gray-400">Moment kháng uốn Wx</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{formatNumber(selectedRow.Wx / 1000, 2)} <span className="text-xs font-normal text-gray-500">cm³</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Moment quán tính Iy</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{formatNumber(selectedRow.Iy / 10000, 2)} <span className="text-xs font-normal text-gray-500">cm⁴</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Moment kháng uốn Wy</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{formatNumber(selectedRow.Wy / 1000, 2)} <span className="text-xs font-normal text-gray-500">cm³</span></div>
                    </div>
                  </>
                )}
                
                {subTab === 'purlin' && (
                  <div className="col-span-2 sm:col-span-3 md:col-span-4 mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg">
                    <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                      Khả năng chịu lực tham khảo (Cường độ uốn)
                    </h4>
                    <p className="text-xs text-emerald-600 dark:text-emerald-300 mb-2">
                      Dựa trên giới hạn chảy thép G450 (fy = 450 MPa) hoặc cường độ thiết kế phổ biến cho xà gồ cán nguội:
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded border border-emerald-200 dark:border-emerald-700">
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">Khả năng chịu Uốn M_x (kNm)</div>
                        <div className="font-bold text-slate-800 dark:text-white">≈ {formatNumber((selectedRow.Wx / 1000) * 45 / 1.05 / 100, 2)} kNm</div>
                        <div className="text-[10px] text-slate-500">Tính với M_x = Wx × fy / γm</div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded border border-emerald-200 dark:border-emerald-700">
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">Độ cứng EI_x (kNm²)</div>
                        <div className="font-bold text-slate-800 dark:text-white">{formatNumber((selectedRow.Ix / 10000) * 2.1, 0)} kNm²</div>
                        <div className="text-[10px] text-slate-500">Tính với E = 2.1×10⁵ MPa</div>
                      </div>
                    </div>
                  </div>
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
                
                {subTab === 'sheet' && (
                  <div className="col-span-2 sm:col-span-3 md:col-span-4 mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
                    <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                      </svg>
                      Bảng tra tải trọng phân bố (kPa) theo nhịp (Span Capacity - Tham khảo)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-center border-collapse">
                        <thead>
                          <tr className="bg-amber-100/50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                            <th className="p-2 border border-amber-200 dark:border-amber-700/50">Nhịp (mm)</th>
                            <th className="p-2 border border-amber-200 dark:border-amber-700/50">900</th>
                            <th className="p-2 border border-amber-200 dark:border-amber-700/50">1200</th>
                            <th className="p-2 border border-amber-200 dark:border-amber-700/50">1500</th>
                            <th className="p-2 border border-amber-200 dark:border-amber-700/50">1800</th>
                            <th className="p-2 border border-amber-200 dark:border-amber-700/50">2100</th>
                            <th className="p-2 border border-amber-200 dark:border-amber-700/50">2400</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
                            <td className="p-2 border border-amber-200 dark:border-amber-700/50 font-medium">Nhịp liên tục (Internal)</td>
                            <td className="p-2 border border-amber-200 dark:border-amber-700/50">{formatNumber(10 * selectedRow.Ma / Math.pow(0.9, 2), 2)}</td>
                            <td className="p-2 border border-amber-200 dark:border-amber-700/50">{formatNumber(10 * selectedRow.Ma / Math.pow(1.2, 2), 2)}</td>
                            <td className="p-2 border border-amber-200 dark:border-amber-700/50">{formatNumber(10 * selectedRow.Ma / Math.pow(1.5, 2), 2)}</td>
                            <td className="p-2 border border-amber-200 dark:border-amber-700/50">{formatNumber(10 * selectedRow.Ma / Math.pow(1.8, 2), 2)}</td>
                            <td className="p-2 border border-amber-200 dark:border-amber-700/50">{formatNumber(10 * selectedRow.Ma / Math.pow(2.1, 2), 2)}</td>
                            <td className="p-2 border border-amber-200 dark:border-amber-700/50">{formatNumber(10 * selectedRow.Ma / Math.pow(2.4, 2), 2)}</td>
                          </tr>
                          <tr className="bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                            <td className="p-2 border border-amber-200 dark:border-amber-700/50 font-medium">Nhịp đơn (Single)</td>
                            <td className="p-2 border border-amber-200 dark:border-amber-700/50">{formatNumber(8 * selectedRow.Ma / Math.pow(0.9, 2), 2)}</td>
                            <td className="p-2 border border-amber-200 dark:border-amber-700/50">{formatNumber(8 * selectedRow.Ma / Math.pow(1.2, 2), 2)}</td>
                            <td className="p-2 border border-amber-200 dark:border-amber-700/50">{formatNumber(8 * selectedRow.Ma / Math.pow(1.5, 2), 2)}</td>
                            <td className="p-2 border border-amber-200 dark:border-amber-700/50">{formatNumber(8 * selectedRow.Ma / Math.pow(1.8, 2), 2)}</td>
                            <td className="p-2 border border-amber-200 dark:border-amber-700/50">{formatNumber(8 * selectedRow.Ma / Math.pow(2.1, 2), 2)}</td>
                            <td className="p-2 border border-amber-200 dark:border-amber-700/50">{formatNumber(8 * selectedRow.Ma / Math.pow(2.4, 2), 2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1.5 italic">
                      * Tải trọng tính toán dựa trên moment cho phép [M] = {selectedRow.Ma} kN.m/m. Giá trị mang tính tham khảo nhanh, cần đối chiếu biểu đồ Capacity thực tế của hãng (Stramit/Hoa Sen/Zamil).
                    </p>
                  </div>
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
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Moment quán tính Ix</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.Ix} <span className="text-xs font-normal text-gray-500">cm⁴</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Moment kháng uốn Wx</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.Wx} <span className="text-xs font-normal text-gray-500">cm³</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Moment quán tính Iy</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.Iy} <span className="text-xs font-normal text-gray-500">cm⁴</span></div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-100 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Moment kháng uốn Wy</div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{selectedRow.Wy} <span className="text-xs font-normal text-gray-500">cm³</span></div>
                    </div>
                  </>
                )}
                
                {subTab === 'ibeam' && (
                  <div className="col-span-2 sm:col-span-3 md:col-span-4 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                    <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                      Khả năng chịu lực tham khảo (Cường độ uốn)
                    </h4>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mb-2">
                      Dựa trên giới hạn chảy mác thép S235 (f = 215 MPa đối với thép hình cán nóng theo TCVN 5575:2024):
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-slate-800 p-2 rounded border border-blue-200 dark:border-blue-700">
                        <div className="text-xs text-blue-600 dark:text-blue-400">Khả năng chịu Uốn M_x (kNm)</div>
                        <div className="font-bold text-slate-800 dark:text-white">≈ {formatNumber(selectedRow.Wx * 21.5 / 1.05 / 100, 2)} kNm</div>
                        <div className="text-[10px] text-slate-500">Tính với M_x = Wx × f / γc</div>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2 rounded border border-blue-200 dark:border-blue-700">
                        <div className="text-xs text-blue-600 dark:text-blue-400">Khả năng chịu Cắt V_max (kN)</div>
                        <div className="font-bold text-slate-800 dark:text-white">≈ {formatNumber((selectedRow.h - 2 * selectedRow.tf) * selectedRow.tw * (21.5 * 0.58) / 100, 1)} kN</div>
                        <div className="text-[10px] text-slate-500">Tính với V_max = A_w × f_v</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

window.SectionLookup = SectionLookup;
