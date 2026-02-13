"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown, MessageSquare, Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface FeedbackButtonProps {
  question: string
  answer: string
  sessionId: string
  onFeedbackSent?: () => void
}

export function FeedbackButton({ question, answer, sessionId, onFeedbackSent }: FeedbackButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [correctionType, setCorrectionType] = useState<string>("other")
  const [correctedAnswer, setCorrectedAnswer] = useState("")
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [rating, setRating] = useState<"up" | "down" | null>(null)

  const handleQuickRating = async (isPositive: boolean) => {
    setRating(isPositive ? "up" : "down")

    try {
      await fetch("/api/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_rating",
          data: {
            question,
            answer,
            rating: isPositive ? 5 : 1,
            isHelpful: isPositive,
            sessionId,
          },
        }),
      })

      if (!isPositive) {
        setShowDialog(true)
      }
    } catch (error) {
      console.error("Error recording rating:", error)
    }
  }

  const handleSubmitCorrection = async () => {
    setIsSubmitting(true)

    try {
      await fetch("/api/learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_correction",
          data: {
            sessionId,
            originalQuestion: question,
            originalAnswer: answer,
            correctedAnswer: correctedAnswer || undefined,
            correctionType,
            userFeedback: feedback,
          },
        }),
      })

      setSubmitted(true)
      setTimeout(() => {
        setShowDialog(false)
        setSubmitted(false)
        setCorrectedAnswer("")
        setFeedback("")
        onFeedbackSent?.()
      }, 1500)
    } catch (error) {
      console.error("Error submitting correction:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      <Button
        variant="ghost"
        size="sm"
        className={`h-6 w-6 p-0 ${rating === "up" ? "text-green-500" : "text-gray-400 hover:text-green-500"}`}
        onClick={() => handleQuickRating(true)}
      >
        <ThumbsUp className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-6 w-6 p-0 ${rating === "down" ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
        onClick={() => handleQuickRating(false)}
      >
        <ThumbsDown className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500"
        onClick={() => setShowDialog(true)}
      >
        <MessageSquare className="h-3 w-3" />
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1a2a3a] border-[#2a3a4a] text-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">ساعدني اتعلم</DialogTitle>
            <DialogDescription className="text-right text-gray-400">
              لو الرد مش مظبوط، قولي الصح عشان اتعلم منك
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-green-400 font-medium">شكراً! اتعلمت حاجة جديدة</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 mb-2 block">نوع المشكلة</Label>
                <RadioGroup value={correctionType} onValueChange={setCorrectionType} className="space-y-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="wrong_info" id="wrong_info" />
                    <Label htmlFor="wrong_info" className="text-sm">
                      معلومة غلط
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="incomplete" id="incomplete" />
                    <Label htmlFor="incomplete" className="text-sm">
                      الرد ناقص
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="tone" id="tone" />
                    <Label htmlFor="tone" className="text-sm">
                      الأسلوب مش مناسب
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="language" id="language" />
                    <Label htmlFor="language" className="text-sm">
                      اللغة مش واضحة
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="text-sm">
                      حاجة تانية
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">الرد الصحيح (اختياري)</Label>
                <Textarea
                  value={correctedAnswer}
                  onChange={(e) => setCorrectedAnswer(e.target.value)}
                  placeholder="اكتب الرد الصح لو عايز..."
                  className="bg-[#0a1628] border-[#2a3a4a] text-white resize-none"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">ملاحظات إضافية (اختياري)</Label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="أي حاجة تانية عايز تقولها..."
                  className="bg-[#0a1628] border-[#2a3a4a] text-white resize-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-[#2a3a4a] text-gray-300"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleSubmitCorrection}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? "جاري الإرسال..." : "إرسال"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
