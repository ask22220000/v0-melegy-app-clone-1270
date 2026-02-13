export interface PromptOptimizationResult {
  success: boolean
  optimizedPrompt?: string
  html?: string
  error?: string
}

export function optimizePrompt(userIdea: string): PromptOptimizationResult {
  try {
    const analysis = analyzeIdea(userIdea)
    const optimizedPrompt = buildOptimizedPrompt(analysis)
    const html = generatePromptHTML(userIdea, optimizedPrompt, analysis)

    return {
      success: true,
      optimizedPrompt,
      html,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to optimize prompt",
    }
  }
}

interface IdeaAnalysis {
  mainGoal: string
  context: string
  style: string
  details: string[]
}

function analyzeIdea(idea: string): IdeaAnalysis {
  const words = idea.toLowerCase()

  let style = "professional"
  if (words.includes("creative") || words.includes("artistic") || words.includes("إبداعي")) {
    style = "creative"
  } else if (words.includes("simple") || words.includes("basic") || words.includes("بسيط")) {
    style = "simple"
  } else if (words.includes("detailed") || words.includes("comprehensive") || words.includes("مفصل")) {
    style = "detailed"
  }

  const sentences = idea.split(/[.!?]+/).filter((s) => s.trim())
  const mainGoal = sentences[0]?.trim() || idea.substring(0, 100)

  const details: string[] = []
  if (words.includes("image") || words.includes("صورة")) details.push("Visual Content")
  if (words.includes("text") || words.includes("نص")) details.push("Text Content")
  if (words.includes("code") || words.includes("كود")) details.push("Code")
  if (words.includes("table") || words.includes("جدول")) details.push("Data Table")

  return {
    mainGoal,
    context: sentences.length > 1 ? sentences.slice(1).join(". ") : "",
    style,
    details,
  }
}

function buildOptimizedPrompt(analysis: IdeaAnalysis): string {
  let prompt = `Create ${analysis.style === "creative" ? "an innovative and creative" : analysis.style === "detailed" ? "a comprehensive and detailed" : "a professional"} ${analysis.details.length > 0 ? analysis.details.join(" and ") : "response"} that focuses on: ${analysis.mainGoal}.\n\n`

  if (analysis.context) {
    prompt += `Context: ${analysis.context}\n\n`
  }

  prompt += `Requirements:\n`
  prompt += `- Style: ${analysis.style.charAt(0).toUpperCase() + analysis.style.slice(1)}\n`
  prompt += `- Clear structure and organization\n`
  prompt += `- Actionable and practical information\n`

  if (analysis.details.length > 0) {
    prompt += `- Include: ${analysis.details.join(", ")}\n`
  }

  return prompt
}

function generatePromptHTML(original: string, optimized: string, analysis: IdeaAnalysis): string {
  return `
    <div class="prompt-optimizer-container space-y-6 p-6 rounded-2xl" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1);">
      <div class="text-center">
        <div class="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg">
          <h3 class="text-xl font-bold">✨ محسن البرومبت</h3>
        </div>
      </div>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <h4 class="font-bold text-lg">الفكرة الأصلية</h4>
          <div class="p-4 rounded-xl bg-white/5 border border-white/10">
            <p class="text-sm leading-relaxed">${original}</p>
          </div>
        </div>
        <div class="space-y-3">
          <h4 class="font-bold text-lg">التحليل</h4>
          <div class="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div><span class="text-xs font-semibold text-blue-400">Style:</span> <span class="text-sm ml-2">${analysis.style}</span></div>
            ${analysis.details.length > 0 ? `<div><span class="text-xs font-semibold text-green-400">Includes:</span> <span class="text-sm ml-2">${analysis.details.join(", ")}</span></div>` : ""}
          </div>
        </div>
      </div>
      <div class="space-y-3">
        <h4 class="font-bold text-lg">البرومبت المحسّن</h4>
        <div class="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30">
          <pre class="text-sm leading-relaxed whitespace-pre-wrap font-mono">${optimized}</pre>
        </div>
      </div>
    </div>
  `
}

export function shouldOptimizePrompt(input: string): boolean {
  const promptKeywords = [
    "optimize prompt",
    "improve prompt",
    "better prompt",
    "برومبت",
    "بروم",
    "حسن البرومبت",
    "عدل البرومبت",
    "اعمل برومبت",
    "كون برومبت",
    "convert to prompt",
    "turn into prompt",
    "حول لبرومبت",
    "اكتب برومبت",
  ]

  return promptKeywords.some((keyword) => input.toLowerCase().includes(keyword.toLowerCase()))
}
