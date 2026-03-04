import { generateText } from "ai"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { text, history } = await request.json()

    if (!text?.trim()) {
      return Response.json({ error: "No text provided" }, { status: 400 })
    }

    // Build ModelMessage array — history already in { role, content } format
    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...(history || []),
      { role: "user", content: text },
    ]

    const { text: reply } = await generateText({
      // Gemini 2.0 Flash via Vercel AI Gateway — supports grounding with Google Search
      model: "google/gemini-2.0-flash-001",
      system:
        "أنت ميليجي، مساعد ذكاء اصطناعي مصري ذكي وودود. " +
        "الرسائل اللي بتوصلك جاية من تحويل صوت لنص، فممكن يكون فيها أخطاء إملائية أو كلمات مش واضحة — افهم المقصود من السياق ورد بشكل صح. " +
        "تكلم دايمًا باللهجة المصرية العامية الطبيعية زي ما المصريين بيتكلموا. " +
        "ردودك لازم تكون قصيرة ومباشرة لأنها هتتقرأ بصوت عالي — جملة أو جملتين بالكتير. " +
        "لو السؤال عن معلومات حديثة أو أخبار أو أسعار أو أي حاجة محتاج تبحث عنها، ابحث وجيب المعلومة الصح. " +
        "متستخدمش markdown أو نجوم أو تنسيق خاص. كلم المستخدم بأسلوب عفوي ومريح.",
      messages,
      maxOutputTokens: 200,
      temperature: 0.7,
      providerOptions: {
        // Enable Google Search grounding for real-time info
        google: {
          useSearchGrounding: true,
        },
      },
    })

    return Response.json({ reply: reply.trim() })
  } catch (err: any) {
    console.error("[voice/chat] Error:", err?.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
