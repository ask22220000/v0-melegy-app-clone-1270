import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt, adAccountId, pageId } = await request.json()

    if (!prompt || !adAccountId || !pageId) {
      return NextResponse.json({ error: "Missing required fields: prompt, adAccountId, pageId" }, { status: 400 })
    }

    const accessToken = process.env.META_BUSINESS_API_TOKEN

    if (!accessToken) {
      return NextResponse.json({ error: "META_BUSINESS_API_TOKEN not configured" }, { status: 500 })
    }

    // Create ad creative with text generation opt-in
    const formData = new FormData()
    formData.append("name", "Melegy Text Generation")
    formData.append(
      "object_story_spec",
      JSON.stringify({
        link_data: {
          link: "https://example.com",
          message: prompt,
        },
        page_id: pageId,
      }),
    )
    formData.append(
      "degrees_of_freedom_spec",
      JSON.stringify({
        creative_features_spec: {
          text_generation: {
            enroll_status: "OPT_IN",
          },
        },
      }),
    )
    formData.append("access_token", accessToken)

    const response = await fetch(`https://graph.facebook.com/v18.0/act_${adAccountId}/adcreatives`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || "Failed to generate text variations")
    }

    const data = await response.json()

    // Fetch generated text variations
    const creativeId = data.id
    const variationsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${creativeId}?fields=text_variations&access_token=${accessToken}`,
    )

    if (!variationsResponse.ok) {
      throw new Error("Failed to fetch text variations")
    }

    const variationsData = await variationsResponse.json()

    return NextResponse.json({
      success: true,
      originalText: prompt,
      generatedVariations: variationsData.text_variations || [prompt],
    })
  } catch (error: any) {
    console.error("[Meta Text Generation Error]:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
