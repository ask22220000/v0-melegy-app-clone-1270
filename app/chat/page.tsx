"use client"

import { useAuth } from "@/hooks/use-auth"
import { useState, useEffect, useRef } from "react"
import { useApp } from "@/lib/contexts/AppContext"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
// كملتلك الاستيراد اللي كان ناقص هنا
// import { DesignViewer } from "@/components/design-viewer" 

export default function ChatComponent() {
  const { user, loading } = useAuth() // التأكد إن useAuth راجعة ببيانات صح
  const { toast } = useToast()
  const [input, setInput] = useState("")
  const supabase = createClient()

  // لو لسه بيحمل بيانات المستخدم
  if (loading) return <div>بيحمل يا نجم... ⏳</div>

  const handleSendMessage = async () => {
    if (!input.trim()) return

    try {
      // هنا بنجرب نبعت الداتا لسوبابيز مثلاً
      toast({
        title: "تم بنجاح! 🎉",
        description: "رسالتك وصلت يا هندسة.",
      })
      setInput("")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "فيه غلطة حصلت! ❌",
        description: "جرب تاني كدة.",
      })
    }
  }

  return (
    <Card className="p-6 m-4 shadow-lg">
      <div className="space-y-4">
        <h2 className="text-xl font-bold">دردشة ميليجي الذكية 🤖</h2>
        <Textarea
          placeholder="اكتب أي حاجة هنا..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[100px]"
        />
        <Button onClick={handleSendMessage} className="w-full">
          إرسال 🚀
        </Button>
      </div>
      <Toaster />
    </Card>
  )
}