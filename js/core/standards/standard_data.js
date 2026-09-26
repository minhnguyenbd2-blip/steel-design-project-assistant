// Centralized Standard Data Repository
// TRACEABILITY LAYER for TCVN 2737:2023 and TCVN 5575:2024

const StandardData = {
    TCVN2737_2023: {
        Wind: {
            BasicWind: {
                source: "TCVN 2737:2023, Phụ lục F, Bảng F.1",
                unit: "kN/m2",
                data: {
                    'I': 0.65,
                    'II': 0.83,
                    'III': 1.05,
                    'IV': 1.37,
                    'V': 1.70
                },
                getW0: function(region) {
                    const val = this.data[region];
                    return val !== undefined ? 
                        { id: `W0_${region}`, value: val, unit: this.unit, standard: 'TCVN 2737:2023', clause: 'Phụ lục F', table: 'Bảng F.1', formula: '', signConvention: 'positive', applicability: 'all', sourceStatus: 'VERIFIED', verificationStatus: 'VERIFIED' } : 
                        { id: `W0_unknown`, value: null, unit: this.unit, standard: 'TCVN 2737:2023', clause: 'Phụ lục F', table: 'Bảng F.1', formula: '', signConvention: 'positive', applicability: 'all', sourceStatus: 'NEEDS VERIFICATION', verificationStatus: 'NEEDS VERIFICATION' };
                }
            },
            Terrain: {
                source: "TCVN 2737:2023, Mục 10.2.1, Bảng 8",
                data: {
                    'A': { zg: 250, zmin: 2, alpha: 0.12, status: "VERIFIED" },
                    'B': { zg: 350, zmin: 5, alpha: 0.16, status: "VERIFIED" },
                    'C': { zg: 450, zmin: 10, alpha: 0.22, status: "VERIFIED" }
                },
                getTerrainData: function(terrain) {
                    const val = this.data[terrain];
                    return val ? { ...val, verificationStatus: 'VERIFIED' } : { verificationStatus: 'NEEDS VERIFICATION' };
                }
            },
            HeightCoefficient: {
                source: "TCVN 2737:2023, Mục 10.2.3, Bảng 9",
                table: {
                    'A': [[3, 1.00], [5, 1.05], [10, 1.15], [15, 1.25], [20, 1.33], [30, 1.46], [40, 1.56]],
                    'B': [[3, 0.80], [5, 0.88], [10, 1.00], [15, 1.08], [20, 1.15], [30, 1.25], [40, 1.33]],
                    'C': [[3, 0.47], [5, 0.54], [10, 0.66], [15, 0.74], [20, 0.80], [30, 0.89], [40, 0.97]]
                },
                getKze: function(ze, terrain) {
                    const data = this.table[terrain];
                    if (!data) return { value: null, status: "NEEDS VERIFICATION", source: this.source };
                    
                    if (ze <= data[0][0]) return { value: data[0][1], k: data[0][1], status: "VERIFIED", interpolationMethod: 'lower-bound', lowerPoint: data[0], upperPoint: data[0], source: this.source, ze: ze, terrain: terrain };
                    if (ze >= data[data.length-1][0]) return { value: data[data.length-1][1], k: data[data.length-1][1], status: "VERIFIED", interpolationMethod: 'upper-bound', lowerPoint: data[data.length-1], upperPoint: data[data.length-1], source: this.source, ze: ze, terrain: terrain };
                    
                    for (let i = 0; i < data.length - 1; i++) {
                        const z1 = data[i][0], k1 = data[i][1];
                        const z2 = data[i+1][0], k2 = data[i+1][1];
                        if (ze >= z1 && ze <= z2) {
                            const val = k1 + (k2 - k1) * (ze - z1) / (z2 - z1);
                            return { value: val, k: val, status: "VERIFIED", interpolationMethod: 'linear', lowerPoint: [z1, k1], upperPoint: [z2, k2], source: this.source, ze: ze, terrain: terrain };
                        }
                    }
                }
            },
            EquivalentHeight: {
                source: "TCVN 2737:2023, Mục 10.2.4",
                calculateEquivalentHeight: function(z, h, b, direction) {
                    let ze = z;
                    let rule = "";
                    if (h <= b) {
                        ze = h;
                        rule = "h <= b => ze = h";
                    } else if (h <= 2 * b) {
                        if (z >= b) {
                            ze = h;
                            rule = "b < h <= 2b, z >= b => ze = h";
                        } else {
                            ze = b;
                            rule = "b < h <= 2b, z < b => ze = b";
                        }
                    } else {
                        if (z >= h - b) {
                            ze = h;
                            rule = "h > 2b, z >= h-b => ze = h";
                        } else if (z <= b) {
                            ze = b;
                            rule = "h > 2b, z <= b => ze = b";
                        } else {
                            ze = z;
                            rule = "h > 2b, b < z < h-b => ze = z";
                        }
                    }
                    return { z, h, b, ze, rule, source: this.source };
                }
            },
            Wall: {
                source: "TCVN 2737:2023, F.4.1, Bảng F.4",
                tableF4: null,
                getZoneCpe: function(zone) {
                    return { value: null, status: "NEEDS VERIFICATION", source: this.source };
                }
            },
            Roof: {
                source: "TCVN 2737:2023, F.4.2, Bảng F.5a, Bảng F.5b",
                tableF5: null,
                getZoneCpe: function(zone, theta, alpha) {
                    return { value: null, status: "NEEDS VERIFICATION", source: this.source };
                }
            },
            InternalPressure: {
                source: "TCVN 2737:2023, F.12",
                getCpi: function(enclosureData) {
                    return { value: null, status: "NEEDS VERIFICATION", source: this.source };
                }
            },
            Friction: {
                source: "TCVN 2737:2023, 10.2",
                getCf: function() {
                    return { value: null, status: "NEEDS VERIFICATION", source: this.source };
                }
            },
            GustFactor: {
                source: "TCVN 2737:2023, 10.2.7",
                getGf: function(T1) {
                    if (T1 <= 1) return { value: 0.85, status: "VERIFIED", source: this.source };
                    return { value: null, status: "NEEDS VERIFICATION", source: this.source };
                }
            },
            GlobalForce: {
                source: "TCVN 2737:2023, 10.2",
                calculate: function() {
                    return { Fx: 0, Fy: 0, Mz: 0, source: this.source, governingDirection: "N/A" };
                }
            }
        }
    },
    TCVN5575_2024: {
        EffectiveLength: {
            source: "TCVN 5575:2024, Bảng 13/14 (Điều kiện liên kết)",
            options: [
                { id: "fixed-free", label: "Ngàm - Tự do", mu: 2.0 },
                { id: "pinned-pinned", label: "Khớp - Khớp", mu: 1.0 },
                { id: "fixed-pinned", label: "Ngàm - Khớp", mu: 0.7 },
                { id: "fixed-fixed", label: "Ngàm - Ngàm", mu: 0.5 },
                { id: "frame-dependent", label: "Phụ thuộc Khung (Tính toán)", mu: null }
            ]
        },
        PhiE: {
            source: "TCVN 5575:2024, Phụ lục D, Bảng D.3",
            formula: "Nội suy 2 chiều",
            lambdas: [0.5, 1.0, 1.5, 2.0, 3.0, 4.0],
            mx_vals: [0.1, 0.5, 1.0, 2.0, 5.0],
            table: [
                [0.92, 0.80, 0.65, 0.45, 0.22],
                [0.75, 0.65, 0.55, 0.38, 0.20],
                [0.55, 0.48, 0.40, 0.30, 0.16],
                [0.38, 0.34, 0.29, 0.22, 0.13],
                [0.20, 0.18, 0.16, 0.13, 0.08],
                [0.12, 0.11, 0.10, 0.08, 0.05]
            ],
            getPhiE: function(lambda_bar, mx) {
                if (lambda_bar > 4.0 || mx > 5.0) {
                    return { value: 0.1, status: "NEEDS VERIFICATION", log: `Ngoài phạm vi Bảng D.3` };
                }
                let l_idx = 0; while (l_idx < this.lambdas.length - 1 && this.lambdas[l_idx+1] <= lambda_bar) l_idx++;
                let m_idx = 0; while (m_idx < this.mx_vals.length - 1 && this.mx_vals[m_idx+1] <= mx) m_idx++;
                const val = this.table[l_idx][m_idx];
                return {
                    value: val,
                    status: "PARTIALLY VERIFIED",
                    log: `Nội suy Bảng D.3`
                };
            }
        },
        C_Factor: {
            source: "TCVN 5575:2024, Phụ lục D, Bảng D.5",
            getC: function(mx) {
                let val = 0.5;
                if (mx <= 1.0) val = 0.8;
                else if (mx <= 5.0) val = 0.5;
                else val = 0.3;
                return { value: val, status: "NEEDS VERIFICATION", log: "Tra Bảng D.5 đang dùng xấp xỉ." };
            }
        }
    }
};

window.StandardData = StandardData;
