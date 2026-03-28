import { generateWithFalRouter } from "@/lib/falRouterService"

export const runtime = "nodejs"
export const maxDuration = 30

const VOICE_SYSTEM_PROMPT = `أنت ميليجي، صاحب المستخدم المصري الودود. بتتكلم بالعامية المصرية الطبيعية تماماً زي ما الناس بتتكلم في الشارع المصري.

---
مهمتك الأساسية:
- الكلام الجاي ليك جاي من تحويل صوت لنص (Speech-to-Text) وممكن يكون فيه أخطاء إملائية أو كلمات مش واضحة. افهم قصد الكلام صح حتى لو الكتابة غلط، وأجاوب على المعنى الصح.
- أمثلة على أخطاء الـ STT المصري: "ازيك" تعني "إزيك"، "ايه" تعني "إيه"، "اه" تعني "آه"، "انا" تعني "أنا"، "انت" تعني "إنت".

---
قواعد الرد الصارمة:
١. رد بجملة أو جملتين طبيعيتين كحد أقصى — مش قائمة مش فقرات.
٢. العامية المصرية الطبيعية فقط بدون فصحى: "آه تمام"، "لأ ده مش صح"، "جامد أوي"، "ماشي يسطا"، "يعني إيه ده"، "معلش"، "دلوقتي"، "بقى"، "برضو"، "خالص"، "ولا إيه"، "طب"، "على طول".
٣. ممنوع تماماً: نجوم، أرقام مرقمة، نقاط تعداد، markdown، إيموجي، حروف خاصة، كلام رسمي أو أكاديمي.
٤. ممنوع تبدأ بـ: "بالتأكيد" أو "طبعاً" أو "يسعدني" أو "بكل سرور" أو "بالطبع" — دي كلمات روبوت مش صاحب.
٥. لو السؤال عن معلومة أو خبر، جاوب مباشرة بالمعلومة بدون مقدمات ولا تعليقات.
٦. لو في أرقام أو تواريخ، قولها بالكلام مش بالرقم — زي "ألفين وعشرين" بدل "2020".
٧. لو السؤال مش واضح أو مش فاهمه، اسأل بطريقة طبيعية مصرية: "ممكن توضحلي أكتر؟" أو "تقصد إيه بالظبط؟"

---
شخصيتك:
- اسمك ميليجي، طورتك Vision AI Studio المصرية.
- أنت صاحب ودود مش روبوت رسمي.
- بتحب تساعد وبتكون موجود دايماً.
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

    // Build messages array — keep last 8 turns for better context
    const messages: { role: "user" | "assistant" | "system"; content: string }[] = [
      ...(history || []).slice(-8),
      { role: "user", content: text },
    ]

    // Using Fal OpenRouter for fast, natural responses
    const rawReply = await generateWithFalRouter(
      systemWithDate,
      messages,
      { maxTokens: 200, temperature: 0.75 }
    )

    // Strip any markdown, citations, or formatting that doesn't belong in voice output
    const reply = rawReply
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\[\d+\]/g, "")          // remove citation numbers [1]
      .replace(/#{1,6}\s/g, "")         // remove headings
      .replace(/^\d+\.\s/gm, "")        // remove numbered lists
      .replace(/^[-•–]\s/gm, "")        // remove bullet points
      .replace(/\n{2,}/g, "، ")         // collapse multiple newlines to comma pause
      .replace(/\n/g, " ")              // flatten single newlines
      .replace(/\s{2,}/g, " ")          // collapse extra spaces
      .replace(/[()[\]{}]/g, "")        // remove brackets
      .trim()

    // إضافة: لو الرد بيبدأ بكلام رسمي نحذفها ونبدأ من بعدها
    const formalStarts = ["بالتأكيد،", "بالتأكيد", "طبعاً،", "طبعاً", "بالطبع،", "بالطبع", "يسعدني", "بكل سرور"]
    let cleanReply = reply
    for (const start of formalStarts) {
      if (cleanReply.startsWith(start)) {
        cleanReply = cleanReply.slice(start.length).replace(/^[،,\s]+/, "").trim()
        // capitalize first letter if needed
        if (cleanReply.length > 0) {
          cleanReply = cleanReply.charAt(0).toUpperCase() + cleanReply.slice(1)
        }
        break
      }
    }

    return Response.json({ reply: cleanReply || reply })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطأ غير معروف"
    console.error("[voice/chat] Error:", msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
