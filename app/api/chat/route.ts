import Groq from "groq-sdk"

export const runtime = "nodejs"
export const maxDuration = 60

if (!process.env.GROQ_API_KEY) {
  console.error("[v0] GROQ_API_KEY is not set!")
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
})

const SYSTEM_PROMPT = `أنت ميليجي، مساعد ذكي متخصص في اللغة العربية. 
- تجيب بطريقة واضحة وودية وجذابة
- تستخدم اللهجة المصرية الشعبية
- تساعد المستخدم في جميع احتياجاته
- تكون مودي ولطيف دايماً
- تقدم معلومات دقيقة وموثوقة`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response("رسائل غير صحيحة", { status: 400 })
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("[v0] ⚠️ GROQ_API_KEY is not configured!")
      return new Response("🔑 GROQ_API_KEY غير محدد. يرجى تحديث المتغير البيئي.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }

    // Create stream with Groq using streaming
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("[v0] Sending message to Groq API...")
          const response = await groq.chat.completions.create({
            messages: [
              {
                role: "system",
                content: SYSTEM_PROMPT,
              },
              ...messages.map((m: any) => ({
                role: m.role,
                content: m.content,
              })),
            ],
            model: "mixtral-8x7b-32768",
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 0.95,
            stream: true,
          } as any)

          console.log("[v0] Groq response received, streaming...")
          // Handle streaming response
          for await (const chunk of response as any) {
            const text = chunk.choices[0]?.delta?.content || ""
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }
          console.log("[v0] Stream completed")
          controller.close()
        } catch (error) {
          console.error("[v0] ❌ Stream error:", error)
          controller.enqueue(encoder.encode("⚠️ حدث خطأ في الاتصال بـ Groq. تأكد من تحديث API key."))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[v0] Chat error:", errorMessage)
    return new Response("آسف، في مشكلة مؤقتة. جرب تاني بعد شوية", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
}
