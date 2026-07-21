import { streamChatResponse } from "@/lib/groqService"

export const maxDuration = 60
export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "الرسائل مطلوبة وتجب أن تكون مصفوفة" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    console.log("[v0] Chat request with", messages.length, "messages")

    const stream = await streamChatResponse(messages)

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error: any) {
    console.error("[v0] Chat API Error:", error)

    return new Response(
      JSON.stringify({
        error: error?.message || "حدث خطأ في الخادم",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
