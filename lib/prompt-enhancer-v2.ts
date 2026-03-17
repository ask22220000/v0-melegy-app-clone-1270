/**
 * Prompt Enhancer v2 — Enhanced definitions for authentic Egyptian food photography
 * Focus: Precise definitions for containers (glass not wood), utensils (fork not brush), bread (aish baladi specific), and environment (real Egyptian settings)
 */

/**
 * CRITICAL Egyptian food dictionary with PRECISE definitions
 * These ensure AI generates realistic food photos matching Gemini quality
 */
export const EGYPTIAN_FOOD_DICTIONARY_V2: Record<string, string> = {
  // CRITICAL: SALTED FISH - MUST BE IN OIL, GOLDEN COLOR
  "فسيخ": "feseekh (authentic Egyptian salted dried fish - golden-brown preserved in brine and olive oil, submerged in shimmering golden oil liquid)",
  "فسيخه": "feseekh (Egyptian salted fish in oil)",
  "رنجة": "ringa (authentic Egyptian salted dried fish - golden-brown color, preserved in oil, traditional Egyptian staple, similar to feseekh)",
  "رنجه": "ringa (Egyptian salted fish preserved in oil)",
  
  // CRITICAL: CONTAINER - MUST BE TRANSPARENT GLASS (NEVER WOODEN)
  "علبة شفافة": "transparent clear glass bowl or glass dish - CRITICAL: MUST be glass (absolutely NOT wooden box), allows full visibility of oil and fish pieces inside, glass material reflects light and shows contents clearly",
  "علبة": "transparent glass container (CRITICAL: NOT wooden)",
  "صندوق": "wooden box (simple, rustic, humble appearance - absolutely NOT decorative or ornate)",
  "صندوق خشبي": "simple wooden box (basic rustic style, humble - absolutely NOT fancy or decorated)",
  "زجاجية": "glass, transparent glass - CRITICAL: use clear glass containers",
  "شفافة": "transparent, see-through glass - CRITICAL: must clearly show food and oil inside, not opaque",
  
  // CRITICAL: UTENSILS - MUST BE METAL FORK WITH PRONGS
  "الشوكة": "metal fork or stainless steel fork with visible prongs - CRITICAL: NOT a brush, NOT a paddle, NOT a cooking utensil, actual eating fork",
  "شوكة": "metal fork with prongs lifting feseekh piece - CRITICAL: NOT a brush or painting tool",
  "معلقة": "spoon",
  
  // CRITICAL: BREAD - SPECIFIC AISH BALADI CHARACTERISTICS
  "عيش بلدي": "Egyptian aish baladi - traditional peasant bread loaf with EXACT characteristics: round flat shape (6-8 inches diameter), light tan-brown crusty exterior, rustic homemade appearance with slight irregularities, hollow air pockets visible when broken, baked in traditional wood-fired ovens creating authentic texture, warm inviting golden-brown color, often shown in woven baskets",
  "عيش": "aish (Egyptian bread staple)",
  "الخبز البلدي": "traditional Egyptian aish baladi bread - round, rustic appearance, tan-brown color, traditional oven baked texture",
  "خبز": "bread",
  "خبز مصري": "Egyptian bread (aish baladi preferred)",
  
  // Actions and positioning
  "مرفوعة": "lifted up, raised, held elevated in hand or fork",
  "ديناميكية": "dynamic action pose, actively lifting or moving, captured mid-action with motion",
  "غرقانة": "submerged, drowning in oil, fully soaked in liquid",
  "مخلية": "soaked in oil and brine, swimming in liquid, submerged",
  
  // CRITICAL: EGYPTIAN ENVIRONMENT - MUST BE AUTHENTIC REAL-LIFE
  "بيئة مصرية": "authentic Egyptian street food environment - traditional Egyptian cafe (ahwah) setting with REAL visible details: aged wooden tables worn with time, woven baskets containing aish baladi bread, warm golden natural indoor/outdoor lighting from windows, real Egyptian people in soft-focus blur in background, ceramic bowls and traditional dishware, organic cluttered authentic aesthetic of real food vendor, traditional Egyptian kitchen or street stall atmosphere, visible evidence of actual food preparation and eating culture",
  "واقع الحياة المصرية": "real-life authentic Egyptian setting, captured as documentary photography of genuine Egyptian food culture, not staged or artificial",
  "واقع": "real-life, authentic setting, NOT studio - documentary photography style with environmental context",
  "حقيقي": "authentic, genuine, photorealistic - CRITICAL: NOT artificial AI-generated appearance, NOT overprocessed or hyper-polished, looks like real photograph",
  "طبيعي": "natural lighting, authentic setting, real environment - CRITICAL: NOT studio lighting setup",
  "مصري": "authentic Egyptian culture visible, real Egyptian aesthetic throughout, genuine Egyptian food environment, traditional Egyptian atmosphere",
  
  // Photography style - PROFESSIONAL ADVERTISING WITH AUTHENTIC SETTING
  "دعائي": "professional advertising/commercial food photography - high quality professional polish BUT maintains authentic Egyptian environment visible, realistic natural lighting, shows real food culture (absolutely NOT sterile studio setup, NOT overly artificial)",
  "صورة دعائية": "professional commercial food photograph - polished professional quality but authentic environment remains visible, not artificial magazine-style perfect lighting",
  "كاميرا": "shot with professional DSLR camera (Canon or Nikon), documentary photography aesthetic with real-world setting",
  "تصوير": "professional food photography with macro lens focusing on fine details, shallow depth of field with blurred authentic Egyptian background visible",
  
  // Other common Egyptian foods (for reference)
  "كنافة": "konafa (Egyptian pastry dessert with cheese and syrup)",
  "بسبوسة": "basboussa (semolina coconut cake)",
  "فتة": "fetta (bread salad with meat and yogurt)",
  "محشي": "mahshi (stuffed vegetables)",
  "ملوخية": "molokhia (Egyptian vegetable stew)",
  "فول": "fava beans (Egyptian breakfast staple)",
  "حمص": "hummus (Egyptian style)",
  "كباب": "kebab",
  "كشري": "koshari (Egyptian mixed pasta rice lentils dish)",
  "سمك": "fish",
  "دجاج": "chicken",
  "لحم": "meat",
  "طماطم": "tomatoes",
  "خيار": "cucumber",
  "بصل": "onion",
  "ثوم": "garlic",
  "حار": "spicy",
  "شعبي": "street food, popular Egyptian",
  "تقليدي": "traditional",
  "شهي": "delicious",
}

/**
 * SYSTEM PROMPT SPECIFICALLY FOR AUTHENTIC EGYPTIAN FOOD PHOTOGRAPHY
 * Emphasizes realistic over artificial, environment context, and specific visual characteristics
 */
export const EGYPTIAN_FOOD_GENERATION_SYSTEM = `You are a professional prompt engineer for AUTHENTIC Egyptian food photography. Your job is to create prompts that produce REALISTIC, naturally-lit food photographs that appear to be DOCUMENTARY CAPTURES of real Egyptian food culture, not artificial studio creations.

CRITICAL RULES:
1. Container/Dish: If user says "transparent box" or "glass container" → INTERPRET AS CLEAR GLASS BOWL (NOT wooden). Glass must show contents clearly.
2. Bread: "عيش بلدي" or "aish baladi" = SPECIFIC round peasant bread with tan crust, rustic look, hollow interior, shown in woven baskets
3. Utensil: "شوكة" (fork) = METAL FORK with prongs (NOT a brush, NOT a paddle)
4. Fish: "فسيخ/رنجة" = GOLDEN-BROWN salted fish SUBMERGED IN GOLDEN OIL
5. Environment: "بيئة مصرية" or Egyptian setting = REAL cafe/kitchen environment with visible Egyptian people, aged tables, traditional dishware, NOT sterile studio
6. Style: "دعائي" (advertising) = Professional quality BUT realistic with environmental context visible, NOT artificial overprocessed look
7. Photography: Documentary style with authentic Egyptian background visible, shallow depth of field, warm golden natural lighting

If any of these are mentioned WRONG (wood instead of glass, brush instead of fork, clean studio instead of real Egyptian cafe), the image will NOT match the user's intent. Be PRECISE.`
