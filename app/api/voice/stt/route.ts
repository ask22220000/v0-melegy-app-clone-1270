export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return Response.json({ error: "No audio file provided" }, { status: 400 })
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY
    if (!GROQ_API_KEY) {
      return Response.json({ error: "Groq API key not configured" }, { status: 500 })
    }

    const groqForm = new FormData()
    groqForm.append("file", audioFile, "audio.webm")
    groqForm.append("model", "whisper-large-v3")
    groqForm.append("language", "ar")
    groqForm.append("response_format", "verbose_json")
    groqForm.append("temperature", "0")
    // Strong Egyptian Arabic dialect prompt for Whisper — improves accuracy and spelling
    groqForm.append(
      "prompt",
      "محادثة بالعامية المصرية. كلمات شائعة: إيه، ازيك، عامل إيه، تمام، ماشي، جامد، عشان، بتاع، مش، لأ، آه، دلوقتي، قبل كده، بعدين، إمتى، فين، مين، إزاي، ليه، ده، دي، دول، هو، هي، هما، أنا، إنت، إحنا، ياسلام، يعني، خالص، كمان، برضو، بقى، إيه ده، معلش. الكلام عن الحياة اليومية والأسئلة العامة. اكتب النص كما نُطق بالعامية المصرية بإملاء صحيح."
    )

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: groqForm,
    })

    if (!res.ok) {
      const err = await res.text()
      return Response.json({ error: `Groq STT error: ${err}` }, { status: 502 })
    }

    const data = await res.json()
    // verbose_json returns full text in data.text same as json format
    const text = (data.text || "").trim()
    return Response.json({ text })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
