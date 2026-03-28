import * as fal from "@fal-ai/serverless-client"

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
})

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface FalRouterInput {
  model?: string
  messages: Array<{
    role: string
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
  }>
  max_tokens?: number
  temperature?: number
}

interface FalRouterOutput {
  choices: Array<{
    message: {
      content: string
      role: string
    }
  }>
}

/**
 * Generate text using Fal OpenRouter
 * This replaces AI Gateway and Gemini API calls
 */
export async function generateWithFalRouter(
  systemPrompt: string,
  messages: Message[],
  options: {
    maxTokens?: number
    temperature?: number
    model?: string
  } = {}
): Promise<string> {
  const { maxTokens = 500, temperature = 0.7, model = "google/gemini-2.0-flash-001" } = options

  try {
    // Build messages array for OpenRouter format
    const formattedMessages: FalRouterInput["messages"] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ]

    console.log(`[FalRouter] Sending request with ${formattedMessages.length} messages to model: ${model}`)

    const result = await fal.subscribe("openrouter/router", {
      input: {
        model,
        messages: formattedMessages,
        max_tokens: maxTokens,
        temperature,
      },
    }) as FalRouterOutput

    const responseText = result.choices?.[0]?.message?.content || ""
    console.log("[FalRouter] Response received successfully")

    return responseText
  } catch (error: any) {
    console.error("[FalRouter] Error:", error.message)
    throw error
  }
}

/**
 * Generate text with vision (image analysis) using Fal OpenRouter
 */
export async function generateWithFalRouterVision(
  systemPrompt: string,
  userPrompt: string,
  imageUrl: string,
  options: {
    maxTokens?: number
    temperature?: number
    model?: string
  } = {}
): Promise<string> {
  const { maxTokens = 500, temperature = 0.7, model = "google/gemini-2.0-flash-001" } = options

  try {
    const formattedMessages: FalRouterInput["messages"] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ]

    console.log(`[FalRouter Vision] Analyzing image with model: ${model}`)

    const result = await fal.subscribe("openrouter/router", {
      input: {
        model,
        messages: formattedMessages,
        max_tokens: maxTokens,
        temperature,
      },
    }) as FalRouterOutput

    const responseText = result.choices?.[0]?.message?.content || ""
    console.log("[FalRouter Vision] Response received successfully")

    return responseText
  } catch (error: any) {
    console.error("[FalRouter Vision] Error:", error.message)
    throw error
  }
}

/**
 * Generate streaming response using Fal OpenRouter
 */
export async function generateStreamingWithFalRouter(
  systemPrompt: string,
  messages: Message[],
  options: {
    maxTokens?: number
    temperature?: number
    model?: string
  } = {}
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await generateWithFalRouter(systemPrompt, messages, options)

        // Stream the response in chunks for faster perceived speed
        const chunkSize = Math.floor(Math.random() * 3) + 3
        for (let i = 0; i < response.length; i += chunkSize) {
          const chunk = response.slice(i, i + chunkSize)
          controller.enqueue(encoder.encode(chunk))
          await new Promise((resolve) => setTimeout(resolve, 10))
        }

        controller.close()
      } catch (error: any) {
        console.error("[FalRouter Streaming] Error:", error)
        const errorMsg = error.message || "عذراً، حصل خطأ. جرب تاني."
        controller.enqueue(encoder.encode(errorMsg))
        controller.close()
      }
    },
  })
}
