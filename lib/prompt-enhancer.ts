import { generateText } from "ai"

// Call Gemini 3 Flash via Vercel AI Gateway using the AI SDK (same pattern as all other routes)
async function callGemini(system: string, userMessage: string, maxTokens = 200, temperature = 0.7): Promise<string> {
  const { text } = await generateText({
    model: "google/gemini-3-flash",
    system,
    messages: [{ role: "user", content: userMessage }],
    maxOutputTokens: maxTokens,
    temperature,
  })
  return text.trim()
}

// Full pipeline: translate Arabic + engineer a professional prompt for FAL image generation
export async function processPromptForImageGeneration(userPrompt: string): Promise<string> {
  try {
    const hasArabic = /[\u0600-\u06FF]/.test(userPrompt)

    const system = hasArabic
      ? "You are a professional Arabic-to-English translator and AI image prompt engineer specializing in photorealistic generation. First translate the Arabic description to English exactly and faithfully, then enrich it with professional visual details: lighting, composition, color palette, mood, camera angle, and photographic style. Do NOT change the subject or scene — only translate and enhance. Do NOT include text overlays or typography instructions. Return ONLY the final enhanced English prompt in under 100 words."
      : "You are a professional AI image prompt engineer specializing in photorealistic generation. Enhance the description with professional visual details: lighting, composition, color palette, mood, camera angle, and photographic style. Do NOT change the subject or scene. Do NOT include text overlays. Return ONLY the enhanced English prompt in under 100 words."

    const enhanced = await callGemini(system, userPrompt, 200, 0.7)
    return enhanced || userPrompt
  } catch (error) {
    console.error("[generate] processPromptForImageGeneration error:", error)
    // Fallback: pass original prompt to FAL (may be Arabic, but better than wrong output)
    return userPrompt
  }
}

// Translate Arabic + engineer an editing prompt for FAL image editing
// Preserves person/product facial features and scene
export async function processPromptForImageEditing(userPrompt: string): Promise<string> {
  try {
    const hasArabic = /[\u0600-\u06FF]/.test(userPrompt)

    const noChangePatterns = [
      /من غير ما تغير/i,
      /بدون ما تغير/i,
      /ما تغيرش/i,
      /متغيرش/i,
      /without chang/i,
      /don't change/i,
      /keep everything/i,
      /no change/i,
    ]
    const wantsNoChange = noChangePatterns.some((p) => p.test(userPrompt))

    const preserveRule = wantsNoChange
      ? "The user wants NO changes. Return exactly: \"Enhance image quality while preserving all original features, facial identity, scene, and background exactly as they are.\""
      : "Apply ONLY what the user explicitly asks to change. Return ONLY the editing instruction in English, under 80 words."

    const system = hasArabic
      ? `You are a professional Arabic-to-English translator and AI image editing prompt engineer.
Translate the Arabic instruction to English faithfully, then write a precise editing directive.

STRICT RULES:
1. Preserve 100% of the subject's facial features, identity, skin tone, and body proportions.
2. Preserve the original background and scene unless the user explicitly requests a change.
3. ${preserveRule}
4. Do NOT add text overlays or watermarks.`.trim()
      : `You are a professional AI image editing prompt engineer.

STRICT RULES:
1. Preserve 100% of the subject's facial features, identity, skin tone, and body proportions.
2. Preserve the original background and scene unless the user explicitly requests a change.
3. ${preserveRule}
4. Do NOT add text overlays or watermarks.`.trim()

    let result = await callGemini(system, userPrompt, 150, 0.3)
    result = result || userPrompt

    // Always prepend preservation instruction for safety
    if (!/preserve|keep|maintain|retain/i.test(result)) {
      result = `Preserve all facial features, identity, skin tone, and original scene. ${result}`
    }

    return result
  } catch (error) {
    console.error("[edit] processPromptForImageEditing error:", error)
    return `Preserve all facial features, identity, skin tone, and original scene. ${userPrompt}`
  }
}

// Kept for backwards compatibility — uses same callGemini pipeline
export async function translateToEnglish(text: string): Promise<string> {
  const hasArabic = /[\u0600-\u06FF]/.test(text)
  if (!hasArabic) return text
  try {
    return await callGemini(
      "You are a translator. Translate the Arabic text to English accurately. Return ONLY the English translation.",
      text,
      200,
      0.3,
    )
  } catch {
    return text
  }
}
