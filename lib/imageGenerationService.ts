import { enhancePrompt } from "./groqService"

// استخدام APIs مجانية متعددة لتوليد الصور
export async function generateImage(prompt: string): Promise<string> {
  try {
    // تحسين الـ prompt باستخدام Groq
    const enhancedPrompt = await enhancePrompt(prompt)
    console.log("[v0] Enhanced prompt:", enhancedPrompt)

    // محاولة استخدام Pollinations.ai (مجاني وسريع)
    try {
      return await generateWithPollinations(enhancedPrompt)
    } catch (error) {
      console.log("[v0] Pollinations failed, trying alternative...")
    }

    // البديل: استخدام Hugging Face API
    try {
      return await generateWithHuggingFace(enhancedPrompt)
    } catch (error) {
      console.log("[v0] HuggingFace failed, trying alternative...")
    }

    // البديل: استخدام Prodia API (مجاني)
    try {
      return await generateWithProdia(enhancedPrompt)
    } catch (error) {
      console.log("[v0] Prodia failed")
    }

    throw new Error("جميع خدمات توليد الصور غير متاحة حالياً")
  } catch (error) {
    console.error("[v0] Image generation error:", error)
    throw error
  }
}

async function generateWithPollinations(prompt: string): Promise<string> {
  const encodedPrompt = encodeURIComponent(prompt)
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&seed=${Math.random() * 1000000}`

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })

  if (!response.ok) {
    throw new Error(`Pollinations API error: ${response.status}`)
  }

  // Pollinations returns the image directly
  const blob = await response.blob()
  const buffer = Buffer.from(await blob.arrayBuffer())
  const base64 = buffer.toString("base64")
  return `data:image/jpeg;base64,${base64}`
}

async function generateWithHuggingFace(prompt: string): Promise<string> {
  // باستخدام Hugging Face Spaces التي توفر models مجاني
  const response = await fetch("https://huggingface.co/api/inference", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY || ""}`,
    },
    body: JSON.stringify({
      inputs: prompt,
    }),
  })

  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.status}`)
  }

  const blob = await response.blob()
  const buffer = Buffer.from(await blob.arrayBuffer())
  const base64 = buffer.toString("base64")
  return `data:image/jpeg;base64,${base64}`
}

async function generateWithProdia(prompt: string): Promise<string> {
  // Prodia API - مجاني مع محدودية
  const generateResponse = await fetch("https://api.prodia.com/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      model: "absolutereality_v16.safetensors",
      negative_prompt: "ugly, blurry, low quality",
      steps: 20,
      cfg_scale: 7,
      sampler: "euler",
      seed: -1,
    }),
  })

  if (!generateResponse.ok) {
    throw new Error(`Prodia generate error: ${generateResponse.status}`)
  }

  const data: any = await generateResponse.json()
  const jobId = data.job

  // الانتظار لإنهاء التوليد
  let result = null
  for (let i = 0; i < 30; i++) {
    const checkResponse = await fetch(`https://api.prodia.com/job/${jobId}`)
    const checkData: any = await checkResponse.json()

    if (checkData.status === "succeeded") {
      result = checkData
      break
    }

    if (checkData.status === "failed") {
      throw new Error("Prodia generation failed")
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  if (!result) {
    throw new Error("Prodia generation timeout")
  }

  // تحميل الصورة وتحويلها إلى base64
  const imageResponse = await fetch(result.imageUrl)
  const blob = await imageResponse.blob()
  const buffer = Buffer.from(await blob.arrayBuffer())
  const base64 = buffer.toString("base64")
  return `data:image/jpeg;base64,${base64}`
}

export async function editImage(imageUrl: string, prompt: string): Promise<string> {
  try {
    console.log("[v0] Starting image editing...")

    // تحسين الـ prompt
    const enhancedPrompt = await enhancePrompt(`Edit image: ${prompt}`)

    // محاولة استخدام Clipdrop API (مجاني)
    try {
      return await editWithClipdrop(imageUrl, enhancedPrompt)
    } catch (error) {
      console.log("[v0] Clipdrop failed, trying alternative...")
    }

    // البديل: إعادة توليد الصورة مع السياق الجديد
    return await generateImage(`Based on the image, ${enhancedPrompt}`)
  } catch (error) {
    console.error("[v0] Image editing error:", error)
    throw error
  }
}

async function editWithClipdrop(imageUrl: string, prompt: string): Promise<string> {
  // Clipdrop API للتعديل على الصور
  const formData = new FormData()

  // تحميل الصورة
  const imageResponse = await fetch(imageUrl)
  const imageBlob = await imageResponse.blob()
  formData.append("image_file", imageBlob, "image.png")
  formData.append("prompt", prompt)

  const response = await fetch("https://clipdrop-api.co/text-to-image/v1", {
    method: "POST",
    headers: {
      "x-api-key": process.env.CLIPDROP_API_KEY || "",
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Clipdrop API error: ${response.status}`)
  }

  const blob = await response.blob()
  const buffer = Buffer.from(await blob.arrayBuffer())
  const base64 = buffer.toString("base64")
  return `data:image/jpeg;base64,${base64}`
}
