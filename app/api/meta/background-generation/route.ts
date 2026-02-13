import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, adAccountId, pageId } = await request.json()

    if (!imageUrl || !adAccountId || !pageId) {
      return NextResponse.json({ error: "Missing required fields: imageUrl, adAccountId, pageId" }, { status: 400 })
    }

    const accessToken = process.env.META_BUSINESS_API_TOKEN

    if (!accessToken) {
      return NextResponse.json({ error: "META_BUSINESS_API_TOKEN not configured" }, { status: 500 })
    }

    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer())

    // Upload image to Meta
    const uploadFormData = new FormData()
    uploadFormData.append("access_token", accessToken)
    uploadFormData.append("source", new Blob([imageBuffer]), "image.jpg")

    const uploadResponse = await fetch(`https://graph.facebook.com/v18.0/act_${adAccountId}/adimages`, {
      method: "POST",
      body: uploadFormData,
    })

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload image to Meta")
    }

    const uploadData = await uploadResponse.json()
    const imageHash = uploadData.images?.["image.jpg"]?.hash

    if (!imageHash) {
      throw new Error("Failed to get image hash from Meta")
    }

    const creativeFormData = new FormData()
    creativeFormData.append("name", "Melegy White Background")
    creativeFormData.append(
      "object_story_spec",
      JSON.stringify({
        link_data: {
          image_hash: imageHash,
          link: "https://melegy.app",
          message: "solid pure white background, clean white backdrop, minimal white background",
        },
        page_id: pageId,
      }),
    )
    creativeFormData.append(
      "degrees_of_freedom_spec",
      JSON.stringify({
        creative_features_spec: {
          background_generation: {
            enroll_status: "OPT_IN",
          },
        },
      }),
    )
    creativeFormData.append("access_token", accessToken)

    const creativeResponse = await fetch(`https://graph.facebook.com/v18.0/act_${adAccountId}/adcreatives`, {
      method: "POST",
      body: creativeFormData,
    })

    if (!creativeResponse.ok) {
      const errorData = await creativeResponse.json()
      throw new Error(errorData.error?.message || "Failed to generate background")
    }

    const creativeData = await creativeResponse.json()

    const newBackgroundResponse = await fetch(
      `https://graph.facebook.com/v18.0/${creativeData.id}?fields=thumbnail_url,effective_object_story_id&access_token=${accessToken}`,
    )

    if (!newBackgroundResponse.ok) {
      throw new Error("Failed to fetch image with new background")
    }

    const newBackgroundData = await newBackgroundResponse.json()

    return NextResponse.json({
      success: true,
      originalImageUrl: imageUrl,
      newBackgroundImageUrl: newBackgroundData.thumbnail_url || imageUrl,
      creativeId: creativeData.id,
    })
  } catch (error: any) {
    console.error("[Meta Background Generation Error]:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
