"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Plus,
  History,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  LogOut,
  Trash2,
  MessageSquare,
  Zap,
} from "lucide-react"

interface ChatHistory {
  id: string
  title: string
  date: string
  messages: any[]
}

interface ChatSidebarProps {
  chatHistories: ChatHistory[]
  onNewChat: () => void
  onSelectChat: (id: string) => void
  onDeleteChat: (id: string) => void
  onClearAll: () => void
  theme: "light" | "dark"
  onThemeToggle: () => void
  onSettingsClick?: () => void
}

export function ChatSidebar({
  chatHistories,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onClearAll,
  theme,
  onThemeToggle,
  onSettingsClick,
}: ChatSidebarProps) {
  return (
    <div className="w-64 h-screen bg-slate-900 border-r border-slate-700 flex flex-col p-4">
      {/* Header */}
      <div className="mb-6">
        <Button
          onClick={onNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          محادثة جديدة
        </Button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto mb-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">
          السجل
        </h3>
        {chatHistories.length === 0 ? (
          <p className="text-xs text-slate-500">لا توجد محادثات بعد</p>
        ) : (
          <div className="space-y-2">
            {chatHistories.map((chat) => (
              <div
                key={chat.id}
                className="group"
              >
                <button
                  onClick={() => onSelectChat(chat.id)}
                  className="w-full text-left p-2 rounded hover:bg-slate-800 transition-colors text-sm text-slate-300 hover:text-white truncate"
                  title={chat.title}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </div>
                  <div className="text-xs text-slate-500 ml-5">{chat.date}</div>
                </button>
                <button
                  onClick={() => onDeleteChat(chat.id)}
                  className="hidden group-hover:block absolute right-6 p-1 hover:bg-slate-700 rounded"
                >
                  <Trash2 className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-slate-700 pt-4 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-300 hover:text-white"
          onClick={onThemeToggle}
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 mr-2" />
              الوضع الفاتح
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 mr-2" />
              الوضع الغامق
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-300 hover:text-white"
          onClick={onSettingsClick}
        >
          <Settings className="w-4 h-4 mr-2" />
          الإعدادات
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-300 hover:text-white"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          مساعدة
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-red-400 hover:text-red-300"
          onClick={onClearAll}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          حذف الكل
        </Button>
      </div>

      {/* Pro Badge */}
      <Card className="mt-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-semibold text-white">الخطة المجانية</span>
        </div>
        <p className="text-xs text-slate-300">
          استمتع بجميع المميزات بدون حدود!
        </p>
      </Card>
    </div>
  )
}
