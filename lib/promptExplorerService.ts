export async function convertIdeaToPromptWithAI(idea: string): Promise<string> {
  try {
    const response = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are a professional prompt engineer specialized in converting simple ideas into detailed, professional image generation prompts. 

Your task:
1. Convert Arabic or English ideas into professional English prompts
2. Add technical photography/art terms
3. Add style descriptors (photorealistic, cinematic, artistic, etc.)
4. Add quality enhancers (8k, ultra detailed, masterpiece, etc.)
5. Keep the core idea clear and focused

Response format: Only return the enhanced prompt, no explanations.

Examples:
Input: "قطة حلوة"
Output: "cute adorable cat, professional photography, soft lighting, sharp focus, 8k uhd, fluffy fur texture, beautiful composition, award winning pet photography, vibrant colors, masterpiece"

Input: "pyramids at sunset"
Output: "ancient Egyptian pyramids at golden hour sunset, dramatic warm lighting, professional landscape photography, ultra detailed, 8k resolution, cinematic composition, rays of light, majestic atmosphere, award winning photography, masterpiece"`,
          },
          {
            role: "user",
            content: `Convert this idea into a professional image generation prompt: "${idea}"`,
          },
        ],
        model: "openai",
        seed: Math.floor(Math.random() * 100000),
        jsonMode: false,
      }),
    })

    if (!response.ok) {
      console.error("[v0] Prompt Explorer API error:", response.status)
      // Fallback to basic enhancement
      return enhancePromptBasic(idea)
    }

    const enhancedPrompt = await response.text()
    return enhancedPrompt.trim()
  } catch (error) {
    console.error("[v0] Prompt Explorer service error:", error)
    // Fallback to basic enhancement
    return enhancePromptBasic(idea)
  }
}

function enhancePromptBasic(idea: string): string {
  // Basic Arabic to English translation and enhancement as fallback
  const translated = translateArabicWords(idea)
  return `${translated}, professional quality, highly detailed, 8k resolution, masterpiece, best quality, perfect composition, vibrant colors, sharp focus`
}

function translateArabicWords(text: string): string {
  const dictionary: Record<string, string> = {
    قطة: "cat",
    قط: "cat",
    كلب: "dog",
    أهرامات: "pyramids",
    الأهرامات: "pyramids",
    للأهرامات: "pyramids",
    كرتون: "cartoon",
    كرتوني: "cartoon style",
    جميل: "beautiful",
    حلو: "cute nice",
    كبير: "big large",
    صغير: "small",
  }

  let result = text
  for (const [arabic, english] of Object.entries(dictionary)) {
    result = result.replace(new RegExp(arabic, "g"), english)
  }

  // Remove remaining Arabic characters
  result = result.replace(/[\u0600-\u06FF]/g, "").trim()
  return result || "professional image"
}
