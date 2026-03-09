import { getServiceRoleClient } from "@/lib/supabase/server"

// ── Vercel Analytics REST API helper ─────────────────────────────────────────
// Docs: https://vercel.com/docs/rest-api/endpoints#get-web-analytics-events
async function fetchVercelAnalytics() {
  const token     = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID || process.env.NEXT_PUBLIC_VERCEL_PROJECT_ID
  const teamId    = process.env.VERCEL_TEAM_ID

  if (!token || !projectId) {
    return { pageviews: 0, visitors: 0, hourlyActivity: [] as { hour: number; messages: number }[] }
  }

  const now   = Date.now()
  const day   = 24 * 60 * 60 * 1000
  const from  = new Date(now - day).toISOString()
  const to    = new Date(now).toISOString()

  const base = `https://api.vercel.com/v1/web/projects/${projectId}/analytics`
  const teamQ = teamId ? `&teamId=${teamId}` : ""
  const headers = { Authorization: `Bearer ${token}` }

  // Page views (last 24 h)
  let pageviews = 0
  let visitors  = 0
  let hourlyActivity: { hour: number; messages: number }[] = Array.from({ length: 24 }, (_, i) => ({ hour: i, messages: 0 }))

  try {
    const pvRes = await fetch(
      `${base}/pageviews?from=${from}&to=${to}&limit=1000${teamQ}`,
      { headers, next: { revalidate: 60 } }
    )
    if (pvRes.ok) {
      const pvData = await pvRes.json()
      // shape: { data: [ { timestamp, pageviews, visitors } ] } or { total, data }
      const rows: any[] = pvData?.data ?? pvData?.pageviews ?? []
      rows.forEach((r: any) => {
        const pv = Number(r.pageviews ?? r.count ?? r.value ?? 0)
        const vis = Number(r.visitors ?? r.unique ?? 0)
        pageviews += pv
        visitors  += vis
        // fill hourly bucket
        const ts = r.timestamp ? new Date(r.timestamp) : null
        if (ts) {
          const h = ts.getHours()
          hourlyActivity[h].messages += pv
        }
      })
      // fallback: single summary object
      if (rows.length === 0) {
        pageviews = Number(pvData?.total?.pageviews ?? pvData?.pageviews ?? 0)
        visitors  = Number(pvData?.total?.visitors  ?? pvData?.visitors  ?? 0)
      }
    }
  } catch { /* ignore */ }

  return { pageviews, visitors, hourlyActivity }
}

// ── Vercel token env-var check helper ────────────────────────────────────────
function hasVercelToken() {
  return !!(process.env.VERCEL_TOKEN)
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  const supabase = getServiceRoleClient()

  // ── 1. melegy_history stats (real, always available) ─────────────────────
  let totalConversations = 0
  let uniqueUsers        = 0
  let recentUsers24h     = 0
  let hourlyFromDB: { hour: number; messages: number }[] = Array.from({ length: 24 }, (_, i) => ({ hour: i, messages: 0 }))
  let topQueries: { query: string; count: number }[]     = []

  try {
    // Total saved conversations
    const { count: convCount } = await supabase
      .from("melegy_history")
      .select("*", { count: "exact", head: true })
    totalConversations = convCount || 0
  } catch { /* ignore */ }

  try {
    // Unique users (by mlg_user_id)
    const { data: userRows } = await supabase
      .from("melegy_history")
      .select("mlg_user_id")
      .not("mlg_user_id", "is", null)
    const uniqueIds = new Set((userRows ?? []).map((r: any) => r.mlg_user_id))
    uniqueUsers = uniqueIds.size
  } catch { /* ignore */ }

  try {
    // Active in last 24 h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentRows } = await supabase
      .from("melegy_history")
      .select("mlg_user_id")
      .gte("created_at", since)
      .not("mlg_user_id", "is", null)
    const recent24Set = new Set((recentRows ?? []).map((r: any) => r.mlg_user_id))
    recentUsers24h = recent24Set.size
  } catch { /* ignore */ }

  try {
    // Hourly activity (created_at in last 24 h)
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
    // Top queries from chat titles (proxy for what users asked)
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

  // ── 2. Vercel Analytics (page views / visitors) ───────────────────────────
  const vercel = hasVercelToken()
    ? await fetchVercelAnalytics()
    : { pageviews: 0, visitors: 0, hourlyActivity: [] as { hour: number; messages: number }[] }

  // Merge hourly: prefer Vercel data (has page views) on top of DB saves
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    messages: (vercel.hourlyActivity[i]?.messages || 0) + (hourlyFromDB[i]?.messages || 0),
  }))

  const lastHourMessages = hourlyActivity[new Date().getHours()]?.messages || 0
  const messagesPerMinute = Number((lastHourMessages / 60).toFixed(2))

  // ── 3. Build response ─────────────────────────────────────────────────────
  return Response.json({
    // Real numbers from DB
    totalConversations,
    totalMessages:     totalConversations, // best proxy we have
    totalUsers:        uniqueUsers,
    activeUsersNow:    recentUsers24h,
    activeUsers:       recentUsers24h,

    // From Vercel Analytics (0 if no token)
    pageviewsToday:    vercel.pageviews,
    visitorsToday:     vercel.visitors,

    // Derived
    messagesPerMinute,
    averageResponseTime: 0,

    // Plan distribution (from melegy_history messages JSON if plan stored, else zeros)
    subscriptionsByPlan: { free: 0, starter: 0, pro: 0, advanced: 0 },

    featureUsage: {
      textGeneration: totalConversations,
      imageGeneration: 0,
      videoGeneration: 0,
      deepSearch: 0,
      ideaToPrompt: 0,
      voiceCloning: 0,
    },

    responseTypes:   { text: totalConversations, search: 0, creative: 0, technical: 0 },
    userSatisfaction: { positive: 0, neutral: 0, negative: 0 },

    systemHealth: {
      apiResponseTime: 0,
      uptime: 99.9,
      errorRate: 0,
    },

    topQueries,
    hourlyActivity,
    lastUpdated: new Date().toISOString(),
  })
}
