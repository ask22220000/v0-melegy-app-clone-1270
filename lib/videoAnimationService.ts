import { enhancePrompt } from "./groqService"

export async function animateImageToVideo(imageUrl: string, prompt: string): Promise<string> {
  try {
    const enhancedPrompt = await enhancePrompt(`Animate this image: ${prompt}`)
    console.log("[v0] Enhanced animation prompt:", enhancedPrompt)

    // محاولة استخدام APIs متعددة
    // 1. محاولة Replicate API (مجاني مع credits)
    try {
      return await animateWithReplicate(imageUrl, enhancedPrompt)
    } catch (error) {
      console.log("[v0] Replicate failed, trying alternative...")
    }

    // 2. محاولة D-ID API (مجاني)
    try {
      return await animateWithDID(imageUrl, enhancedPrompt)
    } catch (error) {
      console.log("[v0] D-ID failed, trying alternative...")
    }

    // 3. محاولة Loom API
    try {
      return await animateWithLoom(imageUrl, enhancedPrompt)
    } catch (error) {
      console.log("[v0] Loom failed")
    }

    throw new Error("جميع خدمات الفيديو غير متاحة حالياً")
  } catch (error) {
    console.error("[v0] Animation error:", error)
    throw error
  }
}

async function animateWithReplicate(
  imageUrl: string,
  prompt: string
): Promise<string> {
  // باستخدام Replicate API
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${process.env.REPLICATE_API_KEY || ""}`,
    },
    body: JSON.stringify({
      version: "e62e65602f10fb2c7f55a7f1ef86d2e7b5f62c04",
      input: {
        image: imageUrl,
        prompt,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Replicate error: ${response.status}`)
  }

  const prediction: any = await response.json()
  let result = prediction

  // الانتظار لإنهاء المعالجة
  while (result.status === "processing") {
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const statusResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${prediction.id}`,
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_KEY || ""}`,
        },
      }
    )

    result = await statusResponse.json()
  }

  if (result.status !== "succeeded") {
    throw new Error("Replicate generation failed")
  }

  const videoUrl = result.output?.[0] || result.output

  if (!videoUrl) {
    throw new Error("No video URL in Replicate response")
  }

  return videoUrl
}

async function animateWithDID(imageUrl: string, prompt: string): Promise<string> {
  // D-ID API للرسوم المتحركة
  const createResponse = await fetch("https://api.d-id.com/animations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`user_id:${process.env.DID_API_KEY}`).toString("base64")}`,
    },
    body: JSON.stringify({
      source_url: imageUrl,
      driver_url:
        "https://d-id-public-pt.s3.amazonaws.com/driver.mp4",
      config: {
        fluent: false,
        pad_audio: 0,
        stitch: false,
        sharpen: true,
        transition: false,
        normalize_numerics: true,
      },
    }),
  })

  if (!createResponse.ok) {
    throw new Error(`D-ID create error: ${createResponse.status}`)
  }

  const animation: any = await createResponse.json()

  // الانتظار لإنهاء الرسم المتحرك
  let result = animation
  for (let i = 0; i < 30; i++) {
    const statusResponse = await fetch(
      `https://api.d-id.com/animations/${animation.id}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`user_id:${process.env.DID_API_KEY}`).toString("base64")}`,
        },
      }
    )

    result = await statusResponse.json()

    if (result.status === "done") {
      break
    }

    if (result.status === "failed") {
      throw new Error("D-ID animation failed")
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  if (!result.result_url) {
    throw new Error("No animation URL from D-ID")
  }

  return result.result_url
}

async function animateWithLoom(imageUrl: string, prompt: string): Promise<string> {
  // Loom API للرسوم المتحركة
  const response = await fetch("https://api.loom.ai/v1/animations/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LOOM_API_KEY || ""}`,
    },
    body: JSON.stringify({
      image_url: imageUrl,
      animation_prompt: prompt,
      style: "realistic",
      duration: 6,
      quality: "HD",
    }),
  })

  if (!response.ok) {
    throw new Error(`Loom error: ${response.status}`)
  }

  const data: any = await response.json()
  return data.video_url
}

// دمج شخص من صورة في فيديو
export async function compositePersonIntoVideo(
  videoUrl: string,
  personImageUrl: string,
  prompt: string
): Promise<string> {
  try {
    console.log("[v0] Compositing person into video...")

    // محاولة استخدام APIs
    try {
      return await compositeWithPython(videoUrl, personImageUrl, prompt)
    } catch (error) {
      console.log("[v0] Python compositing failed")
    }

    throw new Error("لم نتمكن من دمج الصورة في الفيديو")
  } catch (error) {
    console.error("[v0] Composite error:", error)
    throw error
  }
}

async function compositeWithPython(
  videoUrl: string,
  personImageUrl: string,
  prompt: string
): Promise<string> {
  // استخدام سيرفر Python للمعالجة المتقدمة
  const response = await fetch(`${process.env.PYTHON_SERVER_URL || "http://localhost:5000"}/composite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      video_url: videoUrl,
      person_image_url: personImageUrl,
      prompt,
    }),
  })

  if (!response.ok) {
    throw new Error(`Python server error: ${response.status}`)
  }

  const data: any = await response.json()
  return data.output_url
}

// تحريك صورة ساكنة (loop animation)
export async function createImageLoop(imageUrl: string, animationType: string = "subtle"): Promise<string> {
  try {
    console.log("[v0] Creating image loop animation...")

    // استخدام Canvas API أو ffmpeg لإنشاء حركة بسيطة
    // محاولة استخدام Replicate للحركة البسيطة
    try {
      return await createLoopWithReplicate(imageUrl, animationType)
    } catch (error) {
      console.log("[v0] Replicate loop failed")
    }

    throw new Error("فشل إنشاء الحركة")
  } catch (error) {
    console.error("[v0] Loop creation error:", error)
    throw error
  }
}

async function createLoopWithReplicate(
  imageUrl: string,
  animationType: string
): Promise<string> {
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${process.env.REPLICATE_API_KEY || ""}`,
    },
    body: JSON.stringify({
      version: "6e4b5f3aba6d88c07e5c8f7b8f5d4e5c1a2b3c4d",
      input: {
        image: imageUrl,
        animation_type: animationType,
        duration: 5,
        loop: true,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Replicate error: ${response.status}`)
  }

  const prediction: any = await response.json()
  let result = prediction

  // الانتظار
  while (result.status === "processing") {
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const statusResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${prediction.id}`,
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_KEY || ""}`,
        },
      }
    )

    result = await statusResponse.json()
  }

  if (result.status !== "succeeded") {
    throw new Error("Loop creation failed")
  }

  return result.output?.[0] || result.output
}
