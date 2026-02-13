    const regex = new RegExp(arabicPattern, "gi")
    englishPrompt = englishPrompt.replace(regex, englishTerm)
  }

  return `Professional photorealistic image: ${englishPrompt}, masterpiece quality, ultra high resolution, detailed textures`
}

export async function POST(req: Request) {
  try {
    const { imageUrl, editInstructions } = await req.json()

    if (!imageUrl || !editInstructions) {
      return NextResponse.json({ error: "Image URL and edit instructions are required" }, { status: 400 })
    }

    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString("base64")
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg"

    const finalPrompt = await analyzeImageWithPerplexity(imageBase64, mimeType, editInstructions)

    const isRefused =
      !finalPrompt ||
      finalPrompt.toLowerCase().includes("sorry") ||
      finalPrompt.toLowerCase().includes("can't") ||
      finalPrompt.toLowerCase().includes("cannot") ||
      finalPrompt.length < 50

    let promptToUse = finalPrompt
    if (isRefused) {
      console.log("[v0] Perplexity refused analysis, using fallback prompt")
      promptToUse =
        createFallbackPrompt(editInstructions) +
        ", perfect facial features, symmetrical face, detailed eyes, natural skin texture, correct anatomy, photorealistic"
    } else {
      let enhancedFinalPrompt = finalPrompt
      if (!finalPrompt.includes("perfect facial features")) {
        enhancedFinalPrompt +=
          ", perfect facial features maintaining exact analyzed characteristics, symmetrical face, detailed eyes, natural skin texture, correct human anatomy"
      }
      promptToUse = enhancedFinalPrompt
    }

    const seed = Math.floor(Math.random() * 1000000)
    // Portrait 4:5 ratio - 1080x1350
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptToUse)}?model=turbo&width=1080&height=1350&seed=${seed}&nologo=true`

    return NextResponse.json({
      imageUrl: pollinationsUrl,
    })
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || "Unknown error occurred"
    console.error("[v0] Image analysis and regeneration error:", errorMessage)
    return NextResponse.json({ error: `Failed to edit image: ${errorMessage}` }, { status: 500 })
  }
}
