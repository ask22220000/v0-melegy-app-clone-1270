import { getServiceRoleClient } from "@/lib/supabase/server"

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  const supabase = getServiceRoleClient()

  // ── 1. melegy_history stats ───────────────────────────────────────────────
  let totalConversations = 0
  let uniqueUsers        = 0
  let recentUsers24h     = 0
  let hourlyFromDB: { hour: number; messages: number }[] = Array.from({ length: 24 }, (_, i) => ({ hour: i, messages: 0 }))
  let topQueries: { query: string; count: number }[]     = []
  let dailyActivity: { date: string; conversations: number }[] = []

  try {
    const { count: convCount } = await supabase
      .from("melegy_history")
      .select("*", { count: "exact", head: true })
    totalConversations = convCount || 0
  } catch { /* ignore */ }

  try {
    // Unique IPs from melegy_history
    const { data: userRows } = await supabase
      .from("melegy_history")
      .select("user_ip")
      .not("user_ip", "is", null)
    const uniqueIds = new Set((userRows ?? []).map((r: any) => r.user_ip))
    uniqueUsers = uniqueIds.size
  } catch { /* ignore */ }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentRows } = await supabase
      .from("melegy_history")
      .select("user_ip")
      .gte("created_at", since)
      .not("user_ip", "is", null)
    const recent24Set = new Set((recentRows ?? []).map((r: any) => r.user_ip))
    recentUsers24h = recent24Set.size
  } catch { /* ignore */ }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: hourRows } = await supabase
      .from("melegy_history")
      .select("created_at")
      .gte("created_at", since)
    hourlyFromDB = Array.from({ length: 24 }, (_, i) => ({ hour: i, messages: 0 }))
    ;(hourRows ?? []).forEach((r: any) => {
      const h = new Date(r.created_at).getHours()
      hourlyFromDB[h].messages++
    })
  } catch { /* ignore */ }

  try {
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: titleRows } = await supabase
      .from("melegy_history")
      .select("chat_title")
      .gte("created_at", since7d)
      .not("chat_title", "is", null)
      .limit(500)
    const freq: Record<string, number> = {}
    ;(titleRows ?? []).forEach((r: any) => {
      const k = (r.chat_title as string).trim().substring(0, 60)
      if (k.length > 2) freq[k] = (freq[k] || 0) + 1
    })
    topQueries = Object.entries(freq)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  } catch { /* ignore */ }

  try {
    const { data: dailyRows } = await supabase
      .from("melegy_history")
      .select("created_at")
      .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString())

    const dayMap: Record<string, number> = {}
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0]
      dayMap[d] = 0
    }
    for (const r of dailyRows ?? []) {
      const d = (r.created_at as string).split("T")[0]
      if (dayMap[d] !== undefined) dayMap[d]++
    }
    dailyActivity = Object.entries(dayMap).map(([date, conversations]) => ({ date, conversations }))
  } catch { /* ignore */ }

  // ── 2. user_usage stats ───────────────────────────────────────────────────
  let totalImages       = 0
  let totalVideos       = 0
  let totalVoiceMinutes = 0
  let messagesToday     = 0
  let monthlyMessages   = 0
  let monthlyImages     = 0

  // Per-user tracking data
  let userList: {
    user_ip: string
    plan: string
    messages: number
    images: number
    animated_videos: number
    voice_minutes: number
    last_active: string
  }[] = []

  try {
    const today = new Date().toISOString().split("T")[0]
    const month = new Date().toISOString().slice(0, 7)

    const { data: usageRows } = await supabase
      .from("user_usage")
      .select("*")
      .order("updated_at", { ascending: false })

    const rows = usageRows ?? []

    totalImages       = rows.reduce((s: number, r: any) => s + (r.images ?? 0), 0)
    totalVideos       = rows.reduce((s: number, r: any) => s + (r.animated_videos ?? 0), 0)
    totalVoiceMinutes = rows.reduce((s: number, r: any) => s + (r.voice_minutes ?? 0), 0)

    messagesToday = rows
      .filter((r: any) => r.usage_date === today)
      .reduce((s: number, r: any) => s + (r.messages ?? 0), 0)

    const monthlyRows = rows.filter((r: any) => r.usage_month === month)
    monthlyMessages = monthlyRows.reduce((s: number, r: any) => s + (r.messages ?? 0), 0)
    monthlyImages   = monthlyRows.reduce((s: number, r: any) => s + (r.images ?? 0), 0)

    // Aggregate per user_ip (sum all dates)
    const userMap: Record<string, typeof userList[0]> = {}
    for (const r of rows) {
      const ip = r.user_ip as string
      if (!ip) continue
      if (!userMap[ip]) {
        userMap[ip] = {
          user_ip: ip,
          plan: r.plan ?? "free",
          messages: 0,
          images: 0,
          animated_videos: 0,
          voice_minutes: 0,
          last_active: r.updated_at ?? r.usage_date ?? "",
        }
      }
      userMap[ip].messages         += r.messages ?? 0
      userMap[ip].images           += r.images ?? 0
      userMap[ip].animated_videos  += r.animated_videos ?? 0
      userMap[ip].voice_minutes    += r.voice_minutes ?? 0
      // Keep latest plan and date
      if (r.plan && r.plan !== "free") userMap[ip].plan = r.plan
      const rowDate = r.updated_at ?? r.usage_date ?? ""
      if (rowDate > userMap[ip].last_active) userMap[ip].last_active = rowDate
    }
    userList = Object.values(userMap).sort((a, b) => b.messages - a.messages)
  } catch (e: any) {
    console.error("[analytics] user_usage error:", e.message)
  }

  // ── 3. subscriptions table ────────────────────────────────────────────────
  let subscriptionsByPlan = { free: 0, starter: 0, pro: 0, advanced: 0 }
  let totalSubscribers    = 0
  let activeSubscriptions: {
    user_ip: string
    plan_name: string
    status: string
    started_at: string
    expires_at: string
  }[] = []

  try {
    const { data: subRows } = await supabase
      .from("subscriptions")
      .select("user_ip, plan_name, status, started_at, expires_at")
      .order("created_at", { ascending: false })

    const rows = subRows ?? []
    activeSubscriptions = rows.map((r: any) => ({
      user_ip:    r.user_ip ?? "",
      plan_name:  r.plan_name ?? "free",
      status:     r.status ?? "unknown",
      started_at: r.started_at ?? "",
      expires_at: r.expires_at ?? "",
    }))

    // Count by plan (active only)
    const planMap: Record<string, Set<string>> = {
      free: new Set(), starter: new Set(), pro: new Set(), advanced: new Set(),
    }
    for (const r of rows) {
      if (r.status !== "active") continue
      const p = (r.plan_name ?? "free").toLowerCase() as string
      if (planMap[p]) planMap[p].add(r.user_ip ?? "")
      else planMap["free"].add(r.user_ip ?? "")
    }

    // Also count from user_usage plan field if subscriptions table is sparse
    if (userList.length > 0 && Object.values(planMap).every((s) => s.size === 0)) {
      for (const u of userList) {
        const p = (u.plan ?? "free").toLowerCase()
        if (planMap[p]) planMap[p].add(u.user_ip)
        else planMap["free"].add(u.user_ip)
      }
    }

    subscriptionsByPlan = {
      free:     planMap.free.size,
      starter:  planMap.starter.size,
      pro:      planMap.pro.size,
      advanced: planMap.advanced.size,
    }
    totalSubscribers = activeSubscriptions.length
  } catch (e: any) {
    console.error("[analytics] subscriptions error:", e.message)
  }

  // ── 4. feature_usage table ────────────────────────────────────────────────
  let featureUsageCounts = {
    textGeneration:  totalConversations,
    imageGeneration: totalImages,
    videoGeneration: totalVideos,
    deepSearch:      0,
    ideaToPrompt:    0,
    voiceCloning:    Math.round(totalVoiceMinutes),
  }

  try {
    const { data: featureRows } = await supabase
      .from("feature_usage")
      .select("feature_name")

    if (featureRows && featureRows.length > 0) {
      const freq: Record<string, number> = {}
      for (const r of featureRows) {
        const fn = (r.feature_name ?? "").toLowerCase()
        freq[fn] = (freq[fn] || 0) + 1
      }
      featureUsageCounts = {
        textGeneration:  freq["text"] ?? freq["chat"] ?? freq["text_generation"] ?? totalConversations,
        imageGeneration: freq["image"] ?? freq["image_generation"] ?? totalImages,
        videoGeneration: freq["video"] ?? freq["video_generation"] ?? totalVideos,
        deepSearch:      freq["deep_search"] ?? freq["search"] ?? 0,
        ideaToPrompt:    freq["idea"] ?? freq["idea_to_prompt"] ?? 0,
        voiceCloning:    freq["voice"] ?? freq["voice_chat"] ?? Math.round(totalVoiceMinutes),
      }
    }
  } catch { /* ignore */ }

  // ── 5. users table ────────────────────────────────────────────────────────
  try {
    const { data: usersRows } = await supabase
      .from("users")
      .select("user_ip, total_messages, total_conversations, last_active_at")

    if (usersRows && usersRows.length > 0) {
      // Merge into userList
      for (const u of usersRows) {
        const ip = u.user_ip
        if (!ip) continue
        const existing = userList.find((x) => x.user_ip === ip)
        if (existing) {
          if (!existing.messages && u.total_messages) existing.messages = u.total_messages
          if (u.last_active_at && u.last_active_at > existing.last_active) existing.last_active = u.last_active_at
        } else {
          userList.push({
            user_ip:        ip,
            plan:           "free",
            messages:       u.total_messages ?? 0,
            images:         0,
            animated_videos: 0,
            voice_minutes:  0,
            last_active:    u.last_active_at ?? "",
          })
        }
      }
      // Update uniqueUsers if users table has more
      if (usersRows.length > uniqueUsers) uniqueUsers = usersRows.length
    }
  } catch { /* ignore */ }

  // ── 6. Build hourly + derived ─────────────────────────────────────────────
  const hourlyActivity = hourlyFromDB

  const lastHourMessages = hourlyActivity[new Date().getHours()]?.messages || 0
  const messagesPerMinute = Number((lastHourMessages / 60).toFixed(2))

  // ── 7. Response ───────────────────────────────────────────────────────────
  return Response.json({
    // Core metrics (real DB)
    totalConversations,
    totalMessages:     totalConversations,
    totalUsers:        uniqueUsers,
    activeUsersNow:    recentUsers24h,
    activeUsers:       recentUsers24h,

    // No Vercel Analytics (no token needed)
    pageviewsToday:    0,
    visitorsToday:     0,

    messagesPerMinute,
    averageResponseTime: 0,

    // Plans
    subscriptionsByPlan,
    totalSubscribers,

    // Feature usage
    featureUsage: featureUsageCounts,

    // Totals
    totalImages,
    totalVideos,
    totalVoiceMinutes: Math.round(totalVoiceMinutes),
    messagesToday,
    conversationsToday: recentUsers24h,

    // Monthly
    monthlyMessages,
    monthlyImages,

    // Charts
    dailyActivity,
    hourlyActivity,

    // User tracking (NEW)
    userList,
    activeSubscriptions,

    responseTypes: { text: totalConversations, search: 0, creative: 0, technical: 0 },
    userSatisfaction: { positive: 0, neutral: 0, negative: 0 },

    systemHealth: {
      apiResponseTime: 0,
      uptime: 99.9,
      errorRate: 0,
    },

    topQueries,
    lastUpdated: new Date().toISOString(),
  })
}
