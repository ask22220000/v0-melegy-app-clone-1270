import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const arabicToEnglish: Record<string, string> = {
      // Religious/Coptic Art
      "الفن القبطي":
        "Coptic art style, traditional Egyptian Christian iconography, gold leaf details, religious Byzantine influence, sacred religious art",
      "فن قبطي": "Coptic art style, traditional Egyptian Christian iconography, gold leaf details, Byzantine style",
      العدرا: "Virgin Mary, Saint Mary, blessed mother Mary, religious icon painting, holy figure with halo",
      العذراء: "Virgin Mary, Saint Mary, blessed mother, religious Christian icon, holy Madonna",
      "مريم العذراء": "Virgin Mary, Saint Mary Mother of God, holy religious figure",
      مريم: "Virgin Mary, Saint Mary, Madonna",
      "السيد المسيح": "Jesus Christ, Son of God, religious holy icon, sacred figure, Messiah",
      المسيح: "Jesus Christ, holy savior, religious figure",
      القديس: "Christian Saint, holy figure, religious icon, blessed person with halo",
      القديسة: "female Christian Saint, holy woman, religious icon, blessed person with halo",
      الأيقونة: "religious icon painting, Byzantine style art, traditional Orthodox icon, gold background",
      أيقونة: "icon painting, Byzantine religious art, traditional sacred image",

      // Ancient Egyptian
      فرعوني:
        "ancient Egyptian pharaonic style, hieroglyphics, golden details, ancient Egypt royal art, dynasty period",
      فرعونى: "ancient Egyptian pharaonic style, hieroglyphics, papyrus art, ancient civilization",
      الأهرامات: "Great Pyramids of Giza, ancient Egyptian monuments, desert landscape, sphinx nearby",
      اهرامات: "Egyptian pyramids, ancient stone monuments, desert scenery",
      معبد: "ancient Egyptian temple, pharaonic columns, hieroglyphic walls",
      فرعون: "Egyptian Pharaoh, royal ancient Egyptian king, golden crown, ceremonial dress",

      // Art Styles
      واقعي: "photorealistic, ultra realistic, lifelike, high detail photography",
      واقعية: "photorealistic style, realistic rendering, lifelike quality",
      كرتون: "cartoon style, animated art, illustration, colorful drawing",
      رسم: "artistic painting, hand drawn art, painted illustration",
      لوحة: "artistic painting, canvas art, fine art style",
      بورتريه: "portrait photography, professional headshot, face close-up",
      بورتريت: "portrait art, face painting, headshot style",

      // Nature & Landscapes
      طبيعة: "natural landscape, nature scenery, outdoor environment, wilderness",
      "منظر طبيعي": "scenic landscape, beautiful nature view, outdoor vista",
      جبال: "mountains, mountain range, peaks, alpine scenery",
      بحر: "sea, ocean, water, coastal scenery",
      نهر: "river, flowing water, riverside landscape",
      صحراء: "desert landscape, sand dunes, arid environment",
      غابة: "forest, woodland, trees, natural greenery",

      // Colors
      ألوان: "vivid colors, colorful, bright hues",
      "ألوان زاهية": "vibrant colors, bright vivid hues, saturated colors",
      ذهبي: "golden, gold color, metallic gold",
      أزرق: "blue color, azure, cerulean",
      أحمر: "red color, crimson, scarlet",
      أخضر: "green color, emerald, verdant",

      // Quality terms
      جميل: "beautiful, aesthetic, visually appealing",
      جميلة: "beautiful, gorgeous, stunning",
      احترافي: "professional quality, high-end, expert level",
      احترافية: "professional style, expert quality",
      عالي: "high quality, premium, superior",
      "جودة عالية": "high quality, premium quality, top tier",
    }

    let enhancedPrompt = prompt.toLowerCase()

    // Replace Arabic terms with detailed English equivalents
    for (const [arabic, english] of Object.entries(arabicToEnglish)) {
      const regex = new RegExp(arabic, "gi")
      enhancedPrompt = enhancedPrompt.replace(regex, english)
    }

    // Remove common Arabic filler words
    const fillerWords = [
      "عاوز",
      "عايز",
      "اعمللي",
      "اعملي",
      "اعمل",
      "صورة",
      "باسلوب",
      "بأسلوب",
      "بإسلوب",
      "لـ",
      "ل",
      "في",
      "من",
      "على",
      "مع",
      "عن",
      "إلى",
      "الى",
    ]

    fillerWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi")
      enhancedPrompt = enhancedPrompt.replace(regex, "")
    })

    // Clean up extra spaces
    enhancedPrompt = enhancedPrompt.replace(/\s+/g, " ").trim()

    // Add quality enhancers if not already present
    const qualityEnhancers =
      ", masterpiece quality, ultra high resolution, highly detailed, professional art, sharp focus, perfect composition, 8K quality, award winning"

    const finalPrompt = enhancedPrompt + qualityEnhancers

    return NextResponse.json({ enhancedPrompt: finalPrompt })
  } catch (error) {
    console.error("[v0] Prompt enhancement error:", error)
    return NextResponse.json({ error: "Failed to enhance prompt" }, { status: 500 })
  }
}
