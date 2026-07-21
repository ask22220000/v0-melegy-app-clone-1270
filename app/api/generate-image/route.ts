import { generateImage as generateImageService } from "@/lib/imageGenerationService"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("[v0] Image generation request:", prompt)

    const imageUrl = await generateImageService(prompt)

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[v0] Image generation error:", error)

    return new Response(
      JSON.stringify({
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
