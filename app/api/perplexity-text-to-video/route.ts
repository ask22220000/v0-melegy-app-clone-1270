import * as fal from "@fal-ai/serverless-client"
import { NextResponse } from "next/server"
import Groq from "groq-sdk"

export const maxDuration = 300

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function translateToEnglish(prompt: string): Promise<string> {
  const hasArabic = /[\u0600-\u06FF]/.test(prompt)
  if (!hasArabic) return prompt
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator. Translate the following Arabic text (including Egyptian dialect) to English. Return ONLY the English translation — no explanations, no extra text.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
    })
    return res.choices[0]?.message?.content?.trim() || prompt
  } catch {
    return prompt
  }
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    if (!process.env.FAL_KEY) {
      return NextResponse.json({ error: "FAL_KEY is not configured" }, { status: 500 })
    }

    fal.config({ credentials: process.env.FAL_KEY })

    const englishPrompt = await translateToEnglish(prompt)

    const result = await fal.subscribe("klingai/kling-v2.5-turbo-t2v", {
      input: {
        prompt: englishPrompt,
        duration: "5",
        aspect_ratio: "16:9",
      },
    }) as any

    const videoUrl: string | undefined =
      result?.data?.video?.url || result?.video?.url

    if (!videoUrl) {
      throw new Error("No video URL returned from kling model")
    }

    return NextResponse.json({ videoUrl })
  } catch (error: any) {
    console.error("[v0] kling text-to-video error:", error)
    return NextResponse.json({ error: `فشل في توليد الفيديو: ${error.message}` }, { status: 500 })
  }
}
