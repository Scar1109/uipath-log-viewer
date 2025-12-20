
import * as XLSX from 'xlsx';

export const exportToExcel = (logs, columns) => {
    if (!logs || logs.length === 0) return;
    if (!columns || columns.length === 0) return;

    // Map logs to simple objects based on columns
    const data = logs.map(log => {
        const row = {};
        columns.forEach(col => {
            row[col.title] = log[col.dataIndex] || '';
        });
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");

    // Robust file download using Blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "UiPath_Logs_Export.xlsx";
    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);
};
