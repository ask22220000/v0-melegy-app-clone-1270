import { NextRequest, NextResponse } from "next/server"
import { jsPDF } from "jspdf"

export async function POST(req: NextRequest) {
  try {
    const { content, title } = await req.json()

    if (!content) {
      return NextResponse.json({ error: "لا يوجد محتوى للتصدير" }, { status: 400 })
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Add Arabic font support (using default for now, can be enhanced)
    doc.setFont("helvetica")
    doc.setFontSize(20)
    
    // Title
    doc.text(title || "Melegy Document", 105, 20, { align: "center" })
    
    doc.setFontSize(12)
    const lines = doc.splitTextToSize(content, 170)
    
    let y = 40
    const pageHeight = doc.internal.pageSize.height
    
    lines.forEach((line: string) => {
      if (y > pageHeight - 20) {
        doc.addPage()
        y = 20
      }
      doc.text(line, 20, y)
      y += 7
    })

    const pdfBuffer = doc.output("arraybuffer")

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${title || "melegy-document"}.pdf"`,
      },
    })

  } catch (error) {
    console.error("Export to PDF error:", error)
    return NextResponse.json({ error: "فشل التصدير إلى PDF" }, { status: 500 })
  }
}
