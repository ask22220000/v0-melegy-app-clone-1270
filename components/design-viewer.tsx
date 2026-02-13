"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Download, Type, Move } from "lucide-react"

interface TextLayer {
  content: string
  position: string
  style: {
    fontSize: string
    fontWeight: string
    color: string
    textShadow: string
    fontFamily: string
  }
}

interface DesignViewerProps {
  backgroundImage: string
  textLayer: TextLayer | null
  onTextUpdate?: (newText: string) => void
}

export function DesignViewer({ backgroundImage, textLayer, onTextUpdate }: DesignViewerProps) {
  const [editableText, setEditableText] = useState(textLayer?.content || "")
  const [fontSize, setFontSize] = useState(48)
  const [textColor, setTextColor] = useState("#ffffff")
  const [position, setPosition] = useState(textLayer?.position || "center")
  const [fontFamily, setFontFamily] = useState("Cairo")
  const [isZoomed, setIsZoomed] = useState(false)

  const getPositionStyles = () => {
    const base = {
      position: "absolute" as const,
      left: "50%",
      transform: "translateX(-50%)",
      width: "90%",
      textAlign: "center" as const,
    }

    switch (position) {
      case "top":
        return { ...base, top: "10%" }
      case "center":
        return { ...base, top: "50%", transform: "translate(-50%, -50%)" }
      case "bottom":
        return { ...base, bottom: "10%" }
      default:
        return { ...base, top: "50%", transform: "translate(-50%, -50%)" }
    }
  }

  return (
    <>
      {/* Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <img
            src={backgroundImage}
            alt="zoomed design"
            className="max-w-[90%] max-h-[90%] object-contain"
          />
          <Button className="absolute top-4 right-4" variant="ghost" onClick={() => setIsZoomed(false)}>
            <Download className="h-6 w-6 rotate-45" />
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {/* Design Preview */}
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-900 border border-gray-800 group">
          {/* Download Button (Floating) */}
          <div className="absolute top-2 right-2 z-10">
            <Button
              size="sm"
              variant="default"
              onClick={(e) => {
                e.stopPropagation()
                console.log("[v0] Download design button clicked")
                // Trigger same download logic
                const canvas = document.createElement("canvas")
                const ctx = canvas.getContext("2d")
                if (!ctx) return

                const img = new Image()
                img.crossOrigin = "anonymous"
                
                img.onload = () => {
                  canvas.width = img.width
                  canvas.height = img.height
                  ctx.drawImage(img, 0, 0)
                  
                  if (editableText) {
                    ctx.font = `bold ${fontSize * (img.width / 1024)}px ${fontFamily}, sans-serif`
                    ctx.fillStyle = textColor
                    ctx.shadowColor = "rgba(0, 0, 0, 0.8)"
                    ctx.shadowBlur = 8
                    ctx.shadowOffsetX = 2
                    ctx.shadowOffsetY = 2
                    ctx.textAlign = "center"
                    
                    const x = canvas.width / 2
                    let y = canvas.height / 2
                    if (position === "top") y = canvas.height * 0.1
                    if (position === "bottom") y = canvas.height * 0.9
                    
                    ctx.fillText(editableText, x, y)
                  }
                  
                  canvas.toBlob((blob) => {
                    if (blob) {
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = "Melegy Image Generate.png"
                      a.click()
                      URL.revokeObjectURL(url)
                    }
                  }, "image/png")
                }
                
                img.src = backgroundImage
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-2 shadow-lg"
            >
              <Download className="h-4 w-4 mr-1" />
              تنزيل
            </Button>
          </div>

          <img
            src={backgroundImage}
            alt="Design Background"
            className="w-full h-full object-cover cursor-pointer"
            crossOrigin="anonymous"
            onClick={() => {
              console.log("[v0] Design image clicked, opening zoom")
              setIsZoomed(true)
            }}
            onLoad={() => console.log("[v0] Design image loaded successfully:", backgroundImage)}
            onError={(e) => {
              console.error("[v0] Design image failed to load:", backgroundImage)
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg"
            }}
          />

          {editableText && (
          <div
            style={{
              ...getPositionStyles(),
              fontSize: `${fontSize}px`,
              fontWeight: "bold",
              color: textColor,
              textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
              fontFamily: `${fontFamily}, sans-serif`,
              padding: "16px",
              direction: /[\u0600-\u06FF]/.test(editableText) ? "rtl" : "ltr",
            }}
          >
            {editableText}
          </div>
          )}
        </div>

        {/* Text Controls */}
        {textLayer && (
        <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-400">تعديل النص</span>
          </div>

          <Input
            value={editableText}
            onChange={(e) => {
              setEditableText(e.target.value)
              onTextUpdate?.(e.target.value)
            }}
            placeholder="اكتب النص هنا..."
            className="bg-gray-800 border-gray-700 text-white"
          />

          <div className="space-y-2">
            <label className="text-sm text-gray-400">حجم الخط: {fontSize}px</label>
            <Slider
              value={[fontSize]}
              onValueChange={([val]) => setFontSize(val)}
              min={24}
              max={96}
              step={2}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">لون النص</label>
            <div className="flex gap-2 items-center flex-wrap">
              {["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00"].map((color) => (
                <button
                  key={color}
                  onClick={() => setTextColor(color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    textColor === color ? "border-cyan-400" : "border-gray-700"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-700"
                title="اختر لون مخصص"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              <Move className="w-4 h-4" />
              موضع النص
            </label>
            <div className="flex gap-2">
              {[
                { id: "top", label: "أعلى" },
                { id: "center", label: "وسط" },
                { id: "bottom", label: "أسفل" },
              ].map((pos) => (
                <Button
                  key={pos.id}
                  onClick={() => setPosition(pos.id)}
                  variant={position === pos.id ? "default" : "outline"}
                  size="sm"
                  className={position === pos.id ? "bg-cyan-600" : ""}
                >
                  {pos.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400 flex items-center gap-2">
              <Type className="w-4 h-4" />
              نوع الخط
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2"
            >
              <optgroup label="خطوط عربية">
                <option value="Cairo">Cairo - كايرو</option>
                <option value="Amiri">Amiri - أميري</option>
                <option value="Tajawal">Tajawal - تجوال</option>
                <option value="Almarai">Almarai - المرعي</option>
                <option value="Changa">Changa - شانجا</option>
                <option value="El Messiri">El Messiri - المسيري</option>
                <option value="Lalezar">Lalezar - لالیزار</option>
                <option value="Mada">Mada - مدى</option>
                <option value="Markazi Text">Markazi Text - مركزي</option>
              </optgroup>
              <optgroup label="خطوط إنجليزية">
                <option value="Poppins">Poppins</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Oswald">Oswald</option>
                <option value="Bebas Neue">Bebas Neue</option>
                <option value="Inter">Inter</option>
              </optgroup>
            </select>
          </div>

          <Button
            onClick={async () => {
              console.log("[v0] Download design clicked")
              try {
                const canvas = document.createElement("canvas")
                const ctx = canvas.getContext("2d")
                if (!ctx) return

                // Create image element
                const img = new Image()
                img.crossOrigin = "anonymous"
                
                img.onload = () => {
                  canvas.width = img.width
                  canvas.height = img.height
                  
                  // Draw background
                  ctx.drawImage(img, 0, 0)
                  
                  // Draw text if exists
                  if (editableText) {
                    ctx.font = `bold ${fontSize * (img.width / 1024)}px ${fontFamily}, sans-serif`
                    ctx.fillStyle = textColor
                    ctx.shadowColor = "rgba(0, 0, 0, 0.8)"
                    ctx.shadowBlur = 8
                    ctx.shadowOffsetX = 2
                    ctx.shadowOffsetY = 2
                    ctx.textAlign = "center"
                    
                    const x = canvas.width / 2
                    let y = canvas.height / 2
                    if (position === "top") y = canvas.height * 0.1
                    if (position === "bottom") y = canvas.height * 0.9
                    
                    ctx.fillText(editableText, x, y)
                  }
                  
                  // Download
                  canvas.toBlob((blob) => {
                    if (blob) {
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `design-${Date.now()}.png`
                      a.click()
                      URL.revokeObjectURL(url)
                      console.log("[v0] Design downloaded successfully")
                    }
                  }, "image/png")
                }
                
                img.src = backgroundImage
              } catch (error) {
                console.error("[v0] Download failed:", error)
              }
            }}
            className="w-full bg-gradient-to-r from-cyan-600 to-purple-600"
          >
            <Download className="w-4 h-4 ml-2" />
            تحميل التصميم
          </Button>
        </div>
        )}
      </div>
    </>
  )
}
