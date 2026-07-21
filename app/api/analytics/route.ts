import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '@/lib/db/schema'
import { user, chat, message } from '@/lib/db/schema'
import { eq, count, gte, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const db = drizzle(
  new Pool({ connectionString: process.env.DATABASE_URL }),
  { schema }
)

// Demo data for unauthenticated users
function getDemoAnalytics() {
  const now = new Date()
  const dayMap: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const dateStr = d.toISOString().slice(0, 10)
    dayMap[dateStr] = Math.floor(Math.random() * 10) + 2
  }

  const dailyActivity = Object.entries(dayMap).map(([date, conversations]) => ({
    date,
    conversations,
  }))

  const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    messages: Math.floor(Math.random() * 20) + 5,
  }))

  return {
    user: null,
    totalUsers: 150,
    totalConversations: 423,
    totalChats: 423,
    totalMessages: 1205,
    totalImages: 89,
    totalVideos: 12,
    totalVoiceMinutes: 324,
    activeUsersNow: 23,
    activeUsers: 45,
    messagesToday: 145,
    conversationsToday: 18,
    monthlyMessages: 1205,
    monthlyImages: 89,
    subscriptionsByPlan: {
      free: 120,
      starter: 18,
      pro: 10,
      advanced: 2,
    },
    totalSubscribers: 150,
    featureUsage: {
      textGeneration: 850,
      imageGeneration: 250,
      videoGeneration: 89,
      deepSearch: 45,
      ideaToPrompt: 34,
      voiceCloning: 28,
    },
    pageviewsToday: 1250,
    visitorsToday: 234,
    messagesPerMinute: 2.35,
    averageResponseTime: 145,
    dailyActivity,
    topQueries: [
      { query: 'كيف أتعلم البرمجة', count: 45 },
      { query: 'اكتب قصة خيال علمي', count: 38 },
      { query: 'شرح الذكاء الاصطناعي', count: 32 },
      { query: 'أفكار لمشروع تطوير', count: 28 },
      { query: 'نصائح الكتابة الإبداعية', count: 25 },
    ],
    hourlyActivity,
    responseTypes: {
      text: 850,
      search: 250,
      creative: 89,
      technical: 45,
    },
    userSatisfaction: {
      positive: 800,
      neutral: 150,
      negative: 50,
    },
    systemHealth: {
      apiResponseTime: 145,
      uptime: 99.9,
      errorRate: 0.1,
    },
    lastUpdated: new Date().toISOString(),
  }
}

export async function GET() {
  try {
    // Always return demo analytics
  } catch (error) {
    console.error('[v0] Analytics error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
