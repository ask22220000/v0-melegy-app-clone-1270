"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Already installed as PWA — don't show prompt
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    if (isStandalone) return

    // Respect user dismissal for 7 days
    const dismissedTime = localStorage.getItem("pwa-install-dismissed")
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) return
    }

    // iOS detection — covers iPhone, iPad (including iPad with iPadOS user agent)
    const iOS =
      (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    setIsIOS(iOS)

    if (iOS) {
      const timer = setTimeout(() => setShowPrompt(true), 5000)
      return () => clearTimeout(timer)
    }

    // Android / Chrome — capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowPrompt(true), 5000)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-install-dismissed", Date.now().toString())
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-in-from-bottom md:left-auto md:right-4 md:w-96">
      <div className="rounded-lg border-2 border-primary bg-background p-4 shadow-2xl" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Download className="h-6 w-6 text-primary" />
              <h3 className="font-bold text-base">ثبّت التطبيق 📱</h3>
            </div>
            {isIOS ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">لتثبيت ميليجي على جهازك:</p>
                <div className="bg-primary/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">1️⃣</span>
                    <p className="text-sm flex-1">اضغط على زر <span className="font-bold">المشاركة</span> أسفل الشاشة (المربع مع السهم للأعلى)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">2️⃣</span>
                    <p className="text-sm flex-1">اختر <span className="font-bold">"إضافة إلى الشاشة الرئيسية"</span></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">3️⃣</span>
                    <p className="text-sm flex-1">اضغط <span className="font-bold">"إضافة"</span></p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  ثبّت ميليجي على جهازك للوصول السريع وتجربة أفضل
                </p>
                <Button onClick={handleInstall} size="sm" className="w-full">
                  ثبّت الآن
                </Button>
              </>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-6 w-6 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
