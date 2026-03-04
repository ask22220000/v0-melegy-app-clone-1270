"use client"

import { ImageIcon, Wand2, Film, Video } from "lucide-react"
import { useApp } from "@/lib/contexts/AppContext"

type FeatureItem = {
  icon: string
  titleAr: string
  descAr: string
  titleEn: string
  descEn: string
}

const FEATURES: FeatureItem[] = [
  { icon: "🖼️",   titleAr: "تحليل الصور",              descAr: "فهم وتحليل الصور بذكاء متقدم",                      titleEn: "Image Analysis",       descEn: "Understand and analyze images with advanced AI" },
  { icon: "🔍",   titleAr: "مساعد البحث العميق",         descAr: "بحث شامل مع التحقق من المصادر",                     titleEn: "Deep Search",          descEn: "Comprehensive search with source verification" },
  { icon: "🧠",   titleAr: "تنظيم الخرائط الذهنية",     descAr: "تحويل الأفكار المعقدة لخرائط منظمة",                titleEn: "Mind Maps",            descEn: "Transform complex ideas into organized maps" },
  { icon: "✨",   titleAr: "تحويل الأفكار لبرومبت",     descAr: "إنشاء برومبت مخصص من أفكارك",                      titleEn: "Idea to Prompt",       descEn: "Create custom prompts from your ideas" },
  { icon: "💬",   titleAr: "التواصل التكيفي",            descAr: "يتكيف مع أسلوبك في التواصل",                       titleEn: "Adaptive Communication", descEn: "Adapts to your communication style" },
  { icon: "💡",   titleAr: "حل المشاكل الإبداعي",       descAr: "تحليل متعدد الزوايا للمشكلات",                     titleEn: "Creative Problem Solving", descEn: "Multi-angle analysis of problems" },
  { icon: "🎨",   titleAr: "توليد الصور",               descAr: "إنشاء صور فنية احترافية",                           titleEn: "Image Generation",     descEn: "Creating professional artistic images" },
  { icon: "📊",   titleAr: "تصميم جداول البيانات",      descAr: "جداول منظمة بمنهجية علمية",                        titleEn: "Spreadsheet Design",   descEn: "Organized tables with scientific methodology" },
  { icon: "🤔",   titleAr: "تفكير عميق",                descAr: "تحليل شامل ومنطقي متقدم",                          titleEn: "Deep Thinking",        descEn: "Comprehensive and advanced logical analysis" },
  { icon: "wand", titleAr: "تعديل الصور بالذكاء",       descAr: "تعديل الصور بوصف نصي بسيط",                        titleEn: "AI Image Editing",     descEn: "Edit images with simple text descriptions" },
  { icon: "film", titleAr: "تحريك الصور",               descAr: "حول صورك لفيديو متحرك سلس",                        titleEn: "Image Animation",      descEn: "Turn your images into smooth animated videos" },
  { icon: "video", titleAr: "توليد الفيديو",            descAr: "إنشاء فيديوهات احترافية بالذكاء الاصطناعي",        titleEn: "Video Generation",     descEn: "Create professional AI-generated videos" },
]

export function Features() {
  const { language } = useApp()

  return (
    <section className="container mx-auto px-6 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {FEATURES.map((feature, index) => (
          <div
            key={index}
            className="group relative bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:scale-105"
          >
            <div className="text-5xl mb-4">
              {feature.icon === "🖼️" ? <ImageIcon className="h-12 w-12 text-blue-400" />
                : feature.icon === "wand"  ? <Wand2  className="h-12 w-12 text-pink-400" />
                : feature.icon === "film"  ? <Film   className="h-12 w-12 text-purple-400" />
                : feature.icon === "video" ? <Video  className="h-12 w-12 text-cyan-400" />
                : feature.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3" dir={language === "ar" ? "rtl" : "ltr"}>
              {language === "ar" ? feature.titleAr : feature.titleEn}
            </h3>
            <p className="text-white/60 leading-relaxed" dir={language === "ar" ? "rtl" : "ltr"}>
              {language === "ar" ? feature.descAr : feature.descEn}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
