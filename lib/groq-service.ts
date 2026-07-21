import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "gsk_gR6Fk0L5wJ9nH2mK3pQ4v5X6y7Z8a9B0C1d2E3f4G5h6I7j8K9l0M1n2O3p4Q5r6",
})

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export async function generateResponse(
  messages: ChatMessage[],
  systemPrompt: string = "أنت مساعد ذكي متخصص في اللغة العربية. تجيب بطريقة واضحة وودية."
): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.95,
    })

    return response.choices[0]?.message?.content || "لم أتمكن من إنشاء رد."
  } catch (error) {
    console.error("[v0] Groq API error:", error)
    throw new Error("حدث خطأ أثناء معالجة طلبك. حاول مجدداً.")
  }
}

export async function* streamResponse(
  messages: ChatMessage[],
  systemPrompt: string = "أنت مساعد ذكي متخصص في اللغة العربية. تجيب بطريقة واضحة وودية."
) {
  try {
    const stream = groq.chat.completions.stream({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.95,
    })

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || ""
      if (text) yield text
    }
  } catch (error) {
    console.error("[v0] Groq stream error:", error)
    throw new Error("حدث خطأ في البث.")
  }
}
