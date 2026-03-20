import { type NextRequest, NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"
import { processPromptForImageGeneration } from "@/lib/prompt-enhancer"

export const maxDuration = 60
export const runtime = "nodejs"

// Detect desired orientation from the user's raw prompt
function detectImageSize(prompt: string): { width: number; height: number } {
  const lower = prompt.toLowerCase()

  // Landscape / cinematic / wide
  const landscapeKeywords = [
    "عرضي", "عرضية", "أفقي", "أفقية", "سينمائي", "سينمائية",
    "بانوراما", "landscape", "cinematic", "wide", "panoramic",
    "horizontal", "widescreen", "16:9", "16x9",
  ]
  // Square
  const squareKeywords = [
    "مربع", "مربعة", "1:1", "1x1", "square",
  ]

  if (landscapeKeywords.some((k) => lower.includes(k))) {
    return { width: 1920, height: 1080 } // 16:9 landscape
  }
  if (squareKeywords.some((k) => lower.includes(k))) {
    return { width: 1080, height: 1080 } // 1:1 square
  }
  // Default: portrait 4:5
  return { width: 1080, height: 1350 }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.FAL_KEY) {
      return NextResponse.json({ error: "FAL_KEY is not configured" }, { status: 500 })
    }

    fal.config({ credentials: process.env.FAL_KEY })

    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Detect orientation BEFORE translation (from the raw Arabic text)
    const imageSize = detectImageSize(prompt)

    // Process prompt: translate + enhance
    const finalPrompt = await processPromptForImageGeneration(prompt)

    // Generate image using flux/schnell with detected dimensions
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: finalPrompt,
        image_size: imageSize,
        num_inference_steps: 4,
        num_images: 1,
      },
    })

    const imageUrl = (result as any).images?.[0]?.url

    if (!imageUrl) {
      throw new Error("No image generated")
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("[v0] Error generating image:", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
