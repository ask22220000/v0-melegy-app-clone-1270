import { generateText } from "ai"

export const runtime = "nodejs"
export const maxDuration = 30

const VOICE_SYSTEM_PROMPT = `أنت ميليجي، صاحب المستخدم المصري الودود. بتتكلم بالعامية المصرية الطبيعية زي ما الناس بتتكلم في الشارع المصري.

قواعد صارمة لازم تتبعها:
١. رد بجملة واحدة أو جملتين بالكتير - مش أكتر خالص.
٢. العامية المصرية الطبيعية فقط - زي: "آه تمام"، "لأ ده مش صح"، "جامد أوي"، "ماشي يسطا"، "يعني إيه ده"، "معلش"، "دلوقتي"، "بقى"، "برضو"، "خالص".
٣. ممنوع تماماً: نجوم، أرقام مرقمة، نقاط تعداد، markdown، إيموجي، كلام رسمي أو أكاديمي.
٤. ممنوع تبدأ ردك بـ "بالتأكيد" أو "طبعاً" أو "يسعدني" أو "بكل سرور" - دي كلمات رسمية مش طبيعية.
٥. لو السؤال عن أخبار أو معلومات حالية، جاوب مباشرة بالمعلومة بدون مقدمات.
٦. الرسائل جاية من تحويل صوت لنص - افهم المقصود حتى لو في أخطاء إملائية وصحح فهمك ورد صح.
٧. لو السؤال محتاج رقم أو تاريخ، قوله بالكلام مش بالأرقام.

معلوماتك:
- اسمك ميليجي، طورتك Vision AI Studio المصرية.
- عندك قدرة البحث على الإنترنت وتقدر تجيب أي معلومة حالية.
- لو سألك "انت مين" قول: "أنا ميليجي مساعدك الذكي المصري".
- لو سألك "مين طورك" قول: "طورتني Vision AI Studio المصرية".`

export async function POST(request: Request) {
  try {
    const { text, history } = await request.json()

    if (!text?.trim()) {
      return Response.json({ error: "No text provided" }, { status: 400 })
    }

    // Live date/time from server (Cairo timezone)
    const now = new Date()
    const currentDateTime = now.toLocaleString("ar-EG", {
      timeZone: "Africa/Cairo",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    const systemWithDate = `التاريخ والوقت الحالي بالقاهرة: ${currentDateTime}. استخدم دي دايماً لأسئلة الوقت والتاريخ.\n\n${VOICE_SYSTEM_PROMPT}`

    // Build messages array
    const messages: { role: "user" | "assistant"; content: string }[] = [
      ...(history || []).slice(-6),
      { role: "user", content: text },
    ]

    // perplexity/sonar — fast, natural, has live web search built-in
    const { text: rawReply } = await generateText({
      model: "perplexity/sonar",
      system: systemWithDate,
      messages,
      maxOutputTokens: 150,
      temperature: 0.7,
    })

    // Strip any markdown or citations that don't belong in voice output
    const reply = rawReply
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\[\d+\]/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/^\d+\.\s/gm, "")   // remove numbered lists
      .replace(/^[-•]\s/gm, "")    // remove bullet points
      .replace(/\n{2,}/g, " ")     // collapse multiple newlines
      .replace(/\n/g, " ")         // flatten newlines for TTS
      .trim()

    return Response.json({ reply })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطأ غير معروف"
    console.error("[voice/chat] Error:", msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
