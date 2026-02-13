import { apiKeyManager } from "./apiKeyManager"

export async function deepThink(problem: string): Promise<string> {
  try {
    const apiKey = apiKeyManager.getCurrentKey()
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `فكر بعمق في هذه المشكلة: ${problem}` }],
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
    apiKeyManager.reportSuccess()

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "فشل التفكير العميق"
  } catch (error) {
    return "حدث خطأ في عملية التفكير العميق"
  }
}
