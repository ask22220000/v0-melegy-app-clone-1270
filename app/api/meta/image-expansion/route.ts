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

    // Download image
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

    // Create ad creative with image expansion
    const creativeFormData = new FormData()
    creativeFormData.append("name", "Melegy Image Expansion")
    creativeFormData.append(
      "object_story_spec",
      JSON.stringify({
        link_data: {
          image_hash: imageHash,
          link: "https://example.com",
          message: "Expanded image",
        },
        page_id: pageId,
      }),
    )
    creativeFormData.append(
      "degrees_of_freedom_spec",
      JSON.stringify({
        creative_features_spec: {
          image_expansion: {
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
      throw new Error(errorData.error?.message || "Failed to expand image")
    }

    const creativeData = await creativeResponse.json()

    // Fetch expanded image
    const expandedImageResponse = await fetch(
      `https://graph.facebook.com/v18.0/${creativeData.id}?fields=thumbnail_url&access_token=${accessToken}`,
    )

    if (!expandedImageResponse.ok) {
      throw new Error("Failed to fetch expanded image")
    }

    const expandedImageData = await expandedImageResponse.json()

    return NextResponse.json({
      success: true,
      originalImageUrl: imageUrl,
      expandedImageUrl: expandedImageData.thumbnail_url || imageUrl,
    })
  } catch (error: any) {
    console.error("[Meta Image Expansion Error]:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
