import { NextRequest, NextResponse } from "next/server"
import { checkVideoLimit, incrementDailyUsage } from "@/lib/db"

export const runtime   = "nodejs"
export const maxDuration = 300

const FAL_KEY  = "08544582-ba61-43d5-a263-bf6e43c270d0:a5ed3043bd0c93140f12b73f4eeb242f"
const FAL_BASE = "https://queue.fal.run"
const MODEL    = "fal-ai/wan/v2.6/image-to-video/flash"

// ── Translate prompt to English via Groq ──────────────────────────────────
async function translatePrompt(text: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return text
  const hasArabic = /[\u0600-\u06FF]/.test(text)
  if (!hasArabic) return text
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a translator. Translate Arabic/Egyptian dialect text to English for AI video generation. Return ONLY the English translation, nothing else.",
          },
          { role: "user", content: text },
        ],
        max_tokens: 300,
        temperature: 0.2,
      }),
    })
    if (!res.ok) return text
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || text
  } catch {
    return text
  }
}

// ── Submit job to fal queue ────────────────────────────────────────────────
async function submitJob(input: object): Promise<string> {
  const res = await fetch(`${FAL_BASE}/${MODEL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${FAL_KEY}` },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`fal submit failed ${res.status}: ${err}`)
  }
  const data = await res.json()
  return data.request_id as string
}

// ── Poll queue until COMPLETED or FAILED ──────────────────────────────────
async function pollResult(requestId: string): Promise<any> {
  const deadline = Date.now() + 4 * 60 * 1000
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 5000))
    const statusRes = await fetch(`${FAL_BASE}/${MODEL}/requests/${requestId}/status`, {
      headers: { Authorization: `Key ${FAL_KEY}` },
    })
    if (!statusRes.ok) continue
    const status = await statusRes.json()
    if (status.status === "COMPLETED") {
      const resultRes = await fetch(`${FAL_BASE}/${MODEL}/requests/${requestId}`, {
        headers: { Authorization: `Key ${FAL_KEY}` },
      })
      if (!resultRes.ok) throw new Error("Failed to fetch result")
      return await resultRes.json()
    }
    if (status.status === "FAILED") throw new Error(`fal job failed: ${JSON.stringify(status)}`)
  }
  throw new Error("Timeout: video generation took too long")
}

// ── Main handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, prompt, imageUrl, duration = "5", resolution = "720p" } = body

    if (!imageUrl) return NextResponse.json({ error: "imageUrl مطلوب" }, { status: 400 })

    // Check usage limit
    if (userId) {
      const allowed = await checkVideoLimit(userId)
      if (!allowed) {
        return NextResponse.json(
          { error: "وصلت للحد اليومي من الفيديوهات. قم بالترقية للمزيد." },
          { status: 429 }
        )
      }
    }

    // Translate prompt
    const englishPrompt = await translatePrompt(
      prompt || "Animate this image with smooth natural cinematic motion"
    )

    const finalPrompt = `${englishPrompt}, smooth natural motion, cinematic quality, high fidelity`
    const negativePrompt = "low quality, blurry, distorted, watermark, text, artifacts"

    // Submit to fal queue
    const requestId = await submitJob({
      prompt:                  finalPrompt,
      image_url:               imageUrl,
      duration,
      resolution,
      negative_prompt:         negativePrompt,
      enable_prompt_expansion: false,
      enable_safety_checker:   true,
    })

    // Poll for result
    const result = await pollResult(requestId)

    const videoUrl =
      result?.video?.url ??
      result?.data?.video?.url ??
      result?.videos?.[0]?.url

    if (!videoUrl) throw new Error("No video URL in response")

    // Increment usage
    if (userId) await incrementDailyUsage(userId, "animated_videos", 1)

    return NextResponse.json({
      videoUrl,
      seed:         result?.seed         ?? result?.data?.seed,
      actualPrompt: result?.actual_prompt ?? englishPrompt,
    })
  } catch (err: any) {
    console.error("[animate-image] error:", err?.message)
    return NextResponse.json(
      { error: err?.message ?? "فشل توليد الفيديو، حاول مرة أخرى" },
      { status: 500 }
    )
  }
}
