const _scope = typeof window !== 'undefined' ? window : global;

const StandardsDB = {
    "TCVN 2737:2023": _scope.TCVN2737_2023,
    "TCVN 5575:2024": _scope.TCVN5575_2024
};

function getCitationHtml(source) {
    if (!source) return "";
    let text = source.standard || "";
    if (source.section) text += `, Mục ${source.section}`;
    if (source.table) text += `, Bảng ${source.table}`;
    if (source.appendix) text += `, Phụ lục ${source.appendix}`;
    if (source.formulaNumber) text += `, CT (${source.formulaNumber})`;
    return text;
}

_scope.StandardsDB = StandardsDB;
_scope.getCitationHtml = getCitationHtml;
