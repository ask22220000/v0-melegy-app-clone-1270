import Groq from "groq-sdk"

export const runtime = "nodejs"
export const maxDuration = 60

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
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

    // Create stream with Groq
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const groqStream = groq.chat.completions.stream({
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
          })

          for await (const chunk of groqStream) {
            const text = chunk.choices[0]?.delta?.content || ""
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
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
