"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Send, Loader2, Mic, MicOff, Trash2, Copy } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "أهلاً بيك في ميليجي! 👋 أنا مساعدك الذكي. كيف أقدر أساعدك النهاردة؟",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const toggleListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({
        title: "غير مدعوم",
        description: "المتصفح ده مش بيدعم التعرف على الصوت",
        variant: "destructive",
      })
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = "ar-EG"
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput((prev) => prev + " " + transcript)
      setIsListening(false)
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) throw new Error("فشل الرد")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""

      const assistantId = (Date.now() + 1).toString()
      
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        assistantMessage += chunk
        
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1]
          if (lastMessage?.id === assistantId) {
            return [...prev.slice(0, -1), { ...lastMessage, content: assistantMessage }]
          }
          return [...prev, { id: assistantId, role: "assistant", content: assistantMessage }]
        })
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في الرد",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "تم النسخ", description: "تم نسخ الرسالة" })
  }

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "أهلاً بيك في ميليجي! 👋 أنا مساعدك الذكي. كيف أقدر أساعدك النهاردة؟",
      },
    ])
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">ميليجي</h1>
            <p className="text-sm text-slate-400">مساعدك الذكي</p>
          </div>
          <button
            onClick={clearChat}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="مسح المحادثة"
          >
            <Trash2 className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <Card
                className={`max-w-2xl p-4 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-slate-800 text-slate-100 border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  {message.role === "assistant" && (
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="flex-shrink-0 p-1 hover:bg-slate-700 rounded transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-slate-800 border-slate-700 p-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-slate-800 border-t border-slate-700 p-4">
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 min-h-12 max-h-32 bg-slate-900 border-slate-700 text-white placeholder-slate-500 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e as any)
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={toggleListening}
                variant="outline"
                size="icon"
                className={`${isListening ? "bg-red-600 border-red-500" : "border-slate-700"}`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </form>
      </div>

      <Toaster />
    </div>
  )
}
