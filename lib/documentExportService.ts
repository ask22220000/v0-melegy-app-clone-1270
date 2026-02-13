export function exportToWord(content: string, filename = "document.docx"): void {
  const blob = new Blob([content], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToPDF(content: string, filename = "document.pdf"): void {
  const blob = new Blob([content], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
