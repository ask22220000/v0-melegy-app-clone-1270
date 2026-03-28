export const runtime = "nodejs"

// قائمة تصحيح إملائي شائعة للعامية المصرية بعد الـ STT
const EGYPTIAN_SPELLING_FIXES: [RegExp, string][] = [
  // أخطاء شائعة في التعرف على الصوت - الهمزات
  [/\bازيك\b/gi, "إزيك"],
  [/\bازى\b/gi, "إزي"],
  [/\bايه\b/gi, "إيه"],
  [/\bاه\b/gi, "آه"],
  [/\bايوه\b/gi, "أيوه"],
  [/\bانا\b/gi, "أنا"],
  [/\bانت\b/gi, "إنت"],
  [/\bانتي\b/gi, "إنتي"],
  [/\bاحنا\b/gi, "إحنا"],
  [/\bانتو\b/gi, "إنتو"],
  [/\bاكيد\b/gi, "أكيد"],
  [/\bامتى\b/gi, "إمتى"],
  [/\bامتي\b/gi, "إمتى"],
  [/\bاعمل\b/gi, "أعمل"],
  [/\bافضل\b/gi, "أفضل"],
  [/\bاروح\b/gi, "أروح"],
  [/\bاقول\b/gi, "أقول"],
  [/\bاكل\b/gi, "أكل"],
  [/\bاشتغل\b/gi, "اشتغل"],
  [/\bاشوف\b/gi, "أشوف"],
  [/\bاجيب\b/gi, "أجيب"],
  [/\bالاول\b/gi, "الأول"],
  [/\bالاخر\b/gi, "الآخر"],
  [/\bاللى\b/gi, "اللي"],
  [/\bالى\b/gi, "إلى"],
  // تصحيحات الكلمات الشائعة
  [/\bعلى\s*طول\b/gi, "على طول"],
  [/\bمش\s*عارف\b/gi, "مش عارف"],
  [/\bمش\s*كده\b/gi, "مش كده"],
  [/\bيا\s*عم\b/gi, "يا عم"],
  [/\bدلوقت\b/gi, "دلوقتي"],
  [/\bدلوقتى\b/gi, "دلوقتي"],
  [/\bبرضه\b/gi, "برضو"],
  [/\bبرضا\b/gi, "برضو"],
  [/\bعشان\s*ايه\b/gi, "عشان إيه"],
  [/\bمعلش\b/gi, "معلش"],
  [/\bيعنى\b/gi, "يعني"],
  [/\bكدا\b/gi, "كده"],
  [/\bكدة\b/gi, "كده"],
  // أخطاء Whisper الشائعة مع المصرية
  [/\bعايز\s*ايه\b/gi, "عايز إيه"],
  [/\bعاوز\s*ايه\b/gi, "عايز إيه"],
  [/\bمحتاج\s*ايه\b/gi, "محتاج إيه"],
  [/\bعامل\s*ايه\b/gi, "عامل إيه"],
  [/\bحصل\s*ايه\b/gi, "حصل إيه"],
  [/\bفى\b/gi, "في"],
  [/\bدى\b/gi, "دي"],
  [/\bهى\b/gi, "هي"],
  // تصحيح الأرقام والكلمات المختلطة
  [/\bواحد\b/gi, "واحد"],
  [/\bاتنين\b/gi, "اتنين"],
  [/\bتلاته\b/gi, "تلاتة"],
  [/\bاربعه\b/gi, "أربعة"],
  [/\bخمسه\b/gi, "خمسة"],
]

function fixEgyptianSpelling(text: string): string {
  let fixed = text
  for (const [pattern, replacement] of EGYPTIAN_SPELLING_FIXES) {
    fixed = fixed.replace(pattern, replacement)
  }
  return fixed
}

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

    // تحديد الامتداد الصحيح من اسم الملف
    const fileName = audioFile.name || "audio.webm"
    const ext = fileName.endsWith(".mp4") ? "mp4" : "webm"

    const groqForm = new FormData()
    groqForm.append("file", audioFile, `audio.${ext}`)
    groqForm.append("model", "whisper-large-v3-turbo")
    groqForm.append("language", "ar")
    groqForm.append("response_format", "verbose_json")
    groqForm.append("temperature", "0.0")
    // Whisper prompt optimized for Egyptian Arabic dialect — improves accuracy drastically
    groqForm.append(
      "prompt",
      `أنا بتكلم عامية مصرية. الكلام ده بالمصري:
إيه، إزيك، عامل إيه، تمام، ماشي، جامد، عشان، بتاع، مش، لأ، آه، أيوه، دلوقتي، قبل كده، بعدين، إمتى، فين، مين، إزاي، ليه، ده، دي، دول، هو، هي، هما، أنا، إنت، إنتي، إحنا، إنتو، هما.
كلمات شائعة: يعني، خالص، كمان، برضو، بقى، معلش، أكيد، أفضل، اللي، على طول، طب، يا عم، ولا إيه، عايز، عاوز، محتاج، هعمل، هروح، هقول، بحب، بشوف، بعمل.
أسئلة شائعة: عامل إيه، إيه الأخبار، إزيك، عايز إيه، محتاج إيه، رايح فين، جاي منين، ده إيه، إنت مين.
التحيات: صباح الخير، مساء الخير، أهلاً، سلام، باي، مع السلامة.
اكتب الكلام بالعامية المصرية زي ما اتقال بالظبط.`
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
    const rawText = (data.text || "").trim()

    // تصحيح الإملاء الشائع بعد الـ transcription
    const text = fixEgyptianSpelling(rawText)

    return Response.json({ text })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطأ غير معروف"
    return Response.json({ error: msg }, { status: 500 })
  }
}
