import { type NextRequest, NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"

export async function POST(request: NextRequest) {
  try {
    if (!process.env.FAL_KEY) {
      return NextResponse.json({ error: "FAL_KEY is not configured" }, { status: 500 })
    }

    fal.config({
      credentials: process.env.FAL_KEY,
    })

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
      const result = await fal.subscribe("fal-ai/llava-next", {
        input: {
          image_url: imageUrl,
          prompt: analysisPrompt,
          max_tokens: 2048,
        },
        logs: false,
      })

      const description = (result as any).output || (result as any).description

      if (description && description.trim() && description.length > 20) {
        return NextResponse.json({ description: description.trim(), provider: "fal-vision" })
      }

      throw new Error("No valid description from fal API")
    } catch (falError: any) {
      if (falError.status === 403 && falError.body?.detail?.includes("Exhausted balance")) {
        throw new Error("رصيد FAL انتهى")
      }
      throw falError
    }
  } catch (error: any) {
    return NextResponse.json({ error: "حصل خطأ في تحليل الصورة" }, { status: 500 })
  }
}
