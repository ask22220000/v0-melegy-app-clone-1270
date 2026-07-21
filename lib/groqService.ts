import Groq from "groq-sdk"

let groqInstance: Groq | null = null

function getGroqInstance(): Groq {
  if (!groqInstance) {
    groqInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })
  }
  return groqInstance
}

export async function generateChatResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  try {
    const groq = getGroqInstance()
    const response = await groq.messages.create({
      model: "mixtral-8x7b-32768", // نموذج مجاني من Groq
      max_tokens: 2048,
      system: `أنت مساعد ذكي متعدد المواهب يتحدث اللغة العربية بطلاقة. تساعد المستخدمين في:
- الإجابة على الأسئلة بدقة وتفصيل
- كتابة المحتوى الإبداعي
- توليد الأفكار والاقتراحات
- شرح المفاهيم المعقدة بسهولة
- المساعدة في حل المشاكل

كن ودياً وإيجابياً دائماً. استخدم التنسيق المناسب في الإجابات.`,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    const textContent = response.content.find((block: any) => block.type === "text")
    if (!textContent || textContent.type !== "text") {
      throw new Error("لم يحصل على رد نصي من الذكاء الاصطناعي")
    }

    return textContent.text
  } catch (error) {
    console.error("[v0] Groq API Error:", error)
    throw error
  }
}

export async function streamChatResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<ReadableStream<string>> {
  const messageObjects = messages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }))

  const groq = getGroqInstance()
  const stream = await groq.messages.stream({
    model: "mixtral-8x7b-32768",
    max_tokens: 2048,
    system: `أنت مساعد ذكي متعدد المواهب يتحدث اللغة العربية بطلاقة. تساعد المستخدمين في:
- الإجابة على الأسئلة بدقة وتفصيل
- كتابة المحتوى الإبداعي
- توليد الأفكار والاقتراحات
- شرح المفاهيم المعقدة بسهولة
- المساعدة في حل المشاكل

كن ودياً وإيجابياً دائماً. استخدم التنسيق المناسب في الإجابات.`,
    messages: messageObjects,
  })

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(chunk.delta.text)
          }
        }
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })
}

export async function enhancePrompt(prompt: string): Promise<string> {
  try {
    const groq = getGroqInstance()
    const response = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 512,
      system: `أنت متخصص في تحسين طلبات توليد الصور. قم بتحسين الطلب التالي لجعله أكثر وضوحاً وتفصيلاً لنموذج توليد صور AI.
أرجع فقط الطلب المحسّن بدون تفسير إضافي.`,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const textContent = response.content.find((block: any) => block.type === "text")
    if (!textContent || textContent.type !== "text") {
      return prompt
    }

    return textContent.text
  } catch (error) {
    console.error("[v0] Error enhancing prompt:", error)
    return prompt
  }
}

export async function generateCode(prompt: string): Promise<string> {
  try {
    const groq = getGroqInstance()
    const response = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 2048,
      system: `أنت مساعد برمجة خبير. قم بكتابة الكود بناءً على الطلب. 
- استخدم اللغات الحديثة والممارسات الجيدة
- أضف تعليقات في الكود
- تأكد من أن الكود جاهز للاستخدام
أرجع الكود داخل كود markdown blocks مع تحديد لغة البرمجة.`,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const textContent = response.content.find((block: any) => block.type === "text")
    if (!textContent || textContent.type !== "text") {
      throw new Error("لم يتمكن من توليد الكود")
    }

    return textContent.text
  } catch (error) {
    console.error("[v0] Error generating code:", error)
    throw error
  }
}
