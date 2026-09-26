const StandardsDB = {
    "TCVN 2737:2023": window.TCVN2737_2023,
    "TCVN 5575:2024": window.TCVN5575_2024
};

function getCitationHtml(source) {
    if (!source) return "";
    let text = source.standard;
    if (source.section) text += `, Mục ${source.section}`;
    if (source.table) text += `, Bảng ${source.table}`;
    if (source.appendix) text += `, Phụ lục ${source.appendix}`;
    if (source.formulaNumber) text += `, CT (${source.formulaNumber})`;
    return text;
}

window.StandardsDB = StandardsDB;
window.getCitationHtml = getCitationHtml;
