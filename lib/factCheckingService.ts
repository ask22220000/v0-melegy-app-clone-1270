import { apiKeyManager } from "./apiKeyManager"

export interface FactCheckResult {
  claim: string
  verdict: "true" | "false" | "partially-true" | "unverified"
  confidence: number
  evidence: string[]
  sources: string[]
}

export async function checkFact(claim: string): Promise<FactCheckResult> {
  try {
    const apiKey = apiKeyManager.getCurrentKey()
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `تحقق من صحة هذا الادعاء: ${claim}` }],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      apiKeyManager.reportError()
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    apiKeyManager.reportSuccess()

    return {
      claim,
      verdict: "unverified",
      confidence: 0.7,
      evidence: [analysis],
      sources: [],
    }
  } catch (error) {
    return {
      claim,
      verdict: "unverified",
      confidence: 0,
      evidence: ["فشل التحقق من المعلومة"],
      sources: [],
    }
  }
}
