import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, userMessage } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    const userPrompt = userMessage || "وصفلي الصورة دي بالتفصيل"
    const wantsPrompt = userMessage?.includes("برومبت") || userMessage?.includes("prompt")

    const analysisPrompt = wantsPrompt
      ? "Describe this image in extreme detail and write a comprehensive prompt in English that could be used to generate an identical or very similar image with AI. Be very specific about: style (photorealistic, illustration, 3D render, etc.), exact colors and color palette, precise composition and framing, lighting conditions and direction, all subjects and objects present, textures and materials, mood and atmosphere, camera angle and perspective, background elements, and any text or symbols visible."
      : `صف هذه الصورة بالتفصيل الدقيق باللغة العربية المصرية العامية.

إذا كانت الصورة تحتوي على:
- نصوص أو كتابة: اقرأها بالكامل واكتبها بالظبط زي ما هي حرفياً
- جداول أو بيانات: اذكر كل العناوين والبيانات الموجودة بالتفصيل
- أرقام أو حسابات: اقرأها واذكرها كلها
- رسومات بيانية: اشرح البيانات والنسب الموجودة فيها
- وجوه أشخاص: وصف ملامح الوجه، تعبيرات الوجه، الملابس
- منتجات: وصف الشكل، اللون، العلامة التجارية، التفاصيل الدقيقة

اذكر كل التفاصيل المرئية بدقة شديدة: الأشخاص وملامحهم، الألوان الدقيقة، الخلفية وتفاصيلها، كل الأشياء الموجودة، الإضاءة، الزوايا، الجو العام، النصوص المكتوبة.

${userPrompt !== "وصفلي الصورة دي بالتفصيل" ? `\n\nالمستخدم عايز يعرف: ${userPrompt}` : ""}`

    try {
      // Use Google Gemini 3 Flash with vision capability from Vercel AI Gateway
      const result = await generateText({
        model: "google/gemini-3-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: analysisPrompt },
              { type: "image", image: imageUrl }
            ]
          }
        ],
        maxTokens: 2048,
        temperature: 0.7,
      })

      const description = result.text

      if (description && description.trim() && description.length > 20) {
        return NextResponse.json({ description: description.trim(), provider: "gemini-vision" })
      }

      throw new Error("No valid description from Gemini API")
    } catch (geminiError: any) {
      console.error("[v0] Gemini vision error:", geminiError)
      throw geminiError
    }
  } catch (error: any) {
    console.error("[v0] Image analysis error:", error)
    return NextResponse.json({ error: "حصل خطأ في تحليل الصورة" }, { status: 500 })
  }
}
