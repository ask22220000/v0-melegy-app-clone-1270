import Groq from "groq-sdk"

let groqInstance: Groq | null = null

function getGroqInstance(): Groq {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error("GROQ_API_KEY غير موجود في المتغيرات البيئية")
    }
    groqInstance = new Groq({ apiKey })
  }
  return groqInstance
}

export async function generateChatResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  try {
    const groq = getGroqInstance()

    const response = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 1024,
      system: `أنت مساعد ذكي يتحدث اللغة العربية بطلاقة. تساعد المستخدمين بإجابات دقيقة وودية ومفيدة.`,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    const textContent = response.content.find((block: any) => block.type === "text")
    if (!textContent || textContent.type !== "text") {
      throw new Error("لم يحصل على رد من الخادم")
    }

    return textContent.text
  } catch (error: any) {
    console.error("[v0] Groq Error:", error?.message)
    throw error
  }
}

export async function streamChatResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<ReadableStream<string>> {
  const groq = getGroqInstance()

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = groq.messages.stream({
          model: "mixtral-8x7b-32768",
          max_tokens: 1024,
          system: `أنت مساعد ذكي يتحدث اللغة العربية بطلاقة. تساعد المستخدمين بإجابات دقيقة وودية ومفيدة.`,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        })

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
            controller.enqueue(event.delta.text || "")
          }
        }

        controller.close()
      } catch (error) {
        console.error("[v0] Stream error:", error)
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
      max_tokens: 500,
      system: `أنت خبير في تحسين نصوص طلب توليد الصور. حسّن الطلب التالي بإضافة تفاصيل وجعله أكثر وضوحاً وفائدة.`,
      messages: [{ role: "user", content: prompt }],
    })

    const textContent = response.content.find((block: any) => block.type === "text")
    return textContent?.text || prompt
  } catch (error) {
    console.error("[v0] Error in enhancePrompt:", error)
    return prompt
  }
}

export async function generateCode(prompt: string): Promise<string> {
  try {
    const groq = getGroqInstance()

    const response = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 2048,
      system: `أنت مهندس برمجة متخصص. اكتب كود نظيف وآمن بناءً على الطلب.`,
      messages: [{ role: "user", content: prompt }],
    })

    const textContent = response.content.find((block: any) => block.type === "text")
    return textContent?.text || "لم أتمكن من توليد الكود"
  } catch (error) {
    console.error("[v0] Error in generateCode:", error)
    throw error
  }
}
