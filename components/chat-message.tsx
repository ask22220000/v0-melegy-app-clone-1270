"use client"

import { Copy, Download, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Image from "next/image"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  imageUrl?: string
  videoUrl?: string
  timestamp?: Date
  onCopy?: () => void
  onDownload?: () => void
  onSpeak?: () => void
}

export function ChatMessage({
  role,
  content,
  imageUrl,
  videoUrl,
  timestamp,
  onCopy,
  onDownload,
  onSpeak,
}: ChatMessageProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const handleSpeak = () => {
    if ("speechSynthesis" in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
      } else {
        const utterance = new SpeechSynthesisUtterance(content)
        utterance.lang = "ar-SA"
        window.speechSynthesis.speak(utterance)
        setIsSpeaking(true)
      }
      onSpeak?.()
    }
  }

  const isUser = role === "user"

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700"
        }`}
      >
        {/* Text Content */}
        <div className="text-sm leading-relaxed mb-2">{content}</div>

        {/* Image Content */}
        {imageUrl && (
          <div className="mt-3 relative">
            <img
              src={imageUrl}
              alt="Generated content"
              className="max-w-full rounded-lg"
            />
          </div>
        )}

        {/* Video Content */}
        {videoUrl && (
          <div className="mt-3">
            <video
              src={videoUrl}
              controls
              className="max-w-full rounded-lg"
            />
          </div>
        )}

        {/* Message Footer */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-600/30">
          {/* Timestamp */}
          {timestamp && (
            <span className="text-xs opacity-70">
              {timestamp.toLocaleTimeString("ar-SA", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1">
            {/* Copy Button */}
            {onCopy && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-slate-600/50"
                onClick={onCopy}
                title="نسخ"
              >
                <Copy className="w-3 h-3" />
              </Button>
            )}

            {/* Speak Button */}
            {onSpeak && role === "assistant" && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-slate-600/50"
                onClick={handleSpeak}
                title={isSpeaking ? "إيقاف" : "تشغيل الصوت"}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3 h-3" />
                ) : (
                  <Volume2 className="w-3 h-3" />
                )}
              </Button>
            )}

            {/* Download Button */}
            {onDownload && (imageUrl || videoUrl) && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-slate-600/50"
                onClick={onDownload}
                title="تحميل"
              >
                <Download className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
