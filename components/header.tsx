"use client"

import { MessageSquare, Home, Moon, Sun, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/contexts/AppContext"
import Link from "next/link"
import { useState, useEffect } from "react"

type HeaderProps = {
  showChatHistory?: boolean
  onChatHistoryClick?: () => void
  showHomeButton?: boolean
}

export function Header({ showChatHistory = false, onChatHistoryClick, showHomeButton = false }: HeaderProps) {
  const { translations, language, setLanguage } = useApp()
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "dark"
    setTheme(savedTheme)
    document.documentElement.classList.toggle("dark", savedTheme === "dark")
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar")
  }

  if (!mounted) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-2 sm:p-4 md:p-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="bg-card backdrop-blur-md border-border/50 flex items-center gap-2 text-foreground hover:text-foreground"
            aria-label={theme === "dark" ? "التبديل للوضع المضيء" : "Switch to light mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="bg-card backdrop-blur-md border-border/50 flex items-center gap-1.5 text-foreground hover:text-foreground font-bold min-w-[52px]"
            aria-label={language === "ar" ? "Switch to English" : "التبديل للعربية"}
          >
            <Languages className="h-4 w-4 shrink-0" />
            <span className="text-xs">{translations.languageToggle}</span>
          </Button>

          {showHomeButton && (
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="bg-background/20 backdrop-blur-md border-border/50 flex items-center gap-2 text-white hover:text-white"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">{translations.home}</span>
              </Button>
            </Link>
          )}

          {showChatHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={onChatHistoryClick}
              className="bg-background/20 backdrop-blur-md border-border/50 flex items-center gap-2 text-white hover:text-white"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{translations.history}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
