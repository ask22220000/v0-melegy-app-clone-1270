"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  Image,
  Film,
  Wand2,
  FileText,
  Zap,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

export function FeaturesOverview() {
  const features = [
    {
      icon: MessageSquare,
      title: "محادثة ذكية",
      description: "تحدث مع مساعدك الذكي باستخدام Groq AI",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Image,
      title: "توليد الصور",
      description: "أنشئ صور احترافية من الكلمات",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Film,
      title: "تحريك الصور",
      description: "حول صورك إلى فيديوهات متحركة رائعة",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Wand2,
      title: "تعديل الصور",
      description: "عدّل ورتقّي صورك بسهولة",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: FileText,
      title: "كتابة إبداعية",
      description: "اكتب محتوى احترافي وإبداعي",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: Zap,
      title: "معالجة سريعة",
      description: "استجابة فورية بدون تأخير",
      color: "from-yellow-500 to-orange-500",
    },
  ]

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">ميليجي - مساعدك الذكي</h1>
          <p className="text-xl text-slate-300 mb-8">
            منصة شاملة لتوليد النصوص والصور والفيديوهات باستخدام الذكاء الاصطناعي
          </p>
          <Link href="/chat">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg">
              ابدأ الآن
              <Sparkles className="mr-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all hover:shadow-xl hover:shadow-blue-500/20 p-6 rounded-lg"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} p-3 mb-4`}>
                  <Icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </Card>
            )
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center py-12 border-t border-slate-700">
          <div>
            <div className="text-4xl font-bold text-blue-400 mb-2">100K+</div>
            <div className="text-slate-400">محادثة يومية</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-purple-400 mb-2">50K+</div>
            <div className="text-slate-400">صورة موليدة</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-pink-400 mb-2">10K+</div>
            <div className="text-slate-400">فيديو متحرك</div>
          </div>
        </div>
      </div>
    </div>
  )
}
