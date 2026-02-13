export interface ExcelData {
  headers: string[]
  rows: any[][]
}

export function generateExcel(data: ExcelData): Blob {
  // Create proper Excel-compatible CSV with UTF-8 BOM
  const BOM = "\uFEFF"
  let csvContent = BOM + data.headers.map((h) => `"${h}"`).join(",") + "\n"

  data.rows.forEach((row) => {
    csvContent += row.map((cell) => `"${cell}"`).join(",") + "\n"
  })

  return new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
}

export function downloadExcel(data: ExcelData, filename = "data.xlsx"): void {
  const blob = generateExcel(data)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  // Ensure filename has .xlsx extension
  a.download = filename.endsWith(".xlsx") ? filename : filename.replace(/\.[^/.]+$/, "") + ".xlsx"
  a.click()
  URL.revokeObjectURL(url)
}
