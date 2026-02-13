import { apiKeyManager } from "./apiKeyManager"

interface TableCell {
  content: string
  type: "header" | "data"
  style?: string
}

interface TableRow {
  cells: TableCell[]
}

interface TableData {
  title: string
  headers: string[]
  rows: TableRow[]
  style: "scientific" | "business" | "educational" | "comparison"
  metadata?: {
    createdAt: string
    topic: string
    category: string
  }
}

export class TableService {
  private apiKey: string

  constructor() {
    this.apiKey = apiKeyManager.getCurrentKey()
  }

  async generateTable(
    topic: string,
    style: "scientific" | "business" | "educational" | "comparison" = "educational",
  ): Promise<TableData> {
    try {
      const prompt = this.buildTablePrompt(topic, style)

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        },
      )

      if (!response.ok) {
        apiKeyManager.reportError()
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      apiKeyManager.reportSuccess()

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

      return this.parseTableFromText(generatedText, topic, style)
    } catch (error) {
      console.error("[TableService] Error generating table:", error)
      return this.createEmptyTable(topic, style)
    }
  }

  private buildTablePrompt(topic: string, style: string): string {
    const styleInstructions = {
      scientific: "استخدم مصطلحات علمية دقيقة وبيانات موثقة",
      business: "ركز على الأرقام والإحصائيات والتحليلات التجارية",
      educational: "اجعل المحتوى تعليمي سهل الفهم مع أمثلة",
      comparison: "قارن بين الخيارات بشكل موضوعي مع المميزات والعيوب",
    }

    return `أنشئ جدول تفصيلي عن: ${topic}

نمط الجدول: ${style}
${styleInstructions[style]}

المطلوب:
1. عنوان واضح للجدول
2. 3-5 أعمدة رئيسية
3. 5-10 صفوف من البيانات
4. معلومات دقيقة ومفيدة

قدم الجدول بتنسيق واضح مع فواصل بين الأعمدة والصفوف.`
  }

  private parseTableFromText(text: string, topic: string, style: string): TableData {
    const lines = text.split("\n").filter((line) => line.trim())

    const title = lines[0]?.replace(/#+\s*/, "") || topic
    const headers: string[] = []
    const rows: TableRow[] = []

    // Extract headers and data
    let inTable = false
    lines.forEach((line) => {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell && cell !== "---")

      if (cells.length > 0) {
        if (!inTable && cells.length >= 2) {
          headers.push(...cells)
          inTable = true
        } else if (inTable && cells.length >= 2) {
          rows.push({
            cells: cells.map((content) => ({
              content,
              type: "data",
            })),
          })
        }
      }
    })

    return {
      title,
      headers: headers.length > 0 ? headers : ["العنصر", "الوصف", "التفاصيل"],
      rows,
      style,
      metadata: {
        createdAt: new Date().toISOString(),
        topic,
        category: style,
      },
    }
  }

  private createEmptyTable(topic: string, style: string): TableData {
    return {
      title: topic,
      headers: ["العنصر", "الوصف", "التفاصيل"],
      rows: [],
      style,
      metadata: {
        createdAt: new Date().toISOString(),
        topic,
        category: style,
      },
    }
  }

  exportToMarkdown(tableData: TableData): string {
    let markdown = `# ${tableData.title}\n\n`

    // Headers
    markdown += "| " + tableData.headers.join(" | ") + " |\n"
    markdown += "|" + tableData.headers.map(() => "---").join("|") + "|\n"

    // Rows
    tableData.rows.forEach((row) => {
      markdown += "| " + row.cells.map((cell) => cell.content).join(" | ") + " |\n"
    })

    return markdown
  }
}
