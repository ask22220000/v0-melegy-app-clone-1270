import { NextRequest, NextResponse } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Direct REST calls to Supabase — no client library, no schema cache issues
function dbHeaders() {
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
    "Prefer": "return=representation",
  }
}

function generateMlgId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let id = "mlg-"
  for (let i = 0; i < 12; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

// POST /api/user — create new anonymous user
export async function POST() {
  try {
    // Generate unique random ID
    let mlgUserId = generateMlgId()

    // Check uniqueness (up to 5 attempts)
    for (let i = 0; i < 5; i++) {
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/melegy_users?mlg_user_id=eq.${mlgUserId}&select=mlg_user_id`,
        { headers: dbHeaders() }
      )
      const existing = await checkRes.json()
      if (!Array.isArray(existing) || existing.length === 0) break
      mlgUserId = generateMlgId()
    }

    // Insert new user
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/melegy_users`, {
      method: "POST",
      headers: dbHeaders(),
      body: JSON.stringify({
        mlg_user_id: mlgUserId,
        plan: "free",
        messages_used: 0,
      }),
    })

    if (!insertRes.ok) {
      const err = await insertRes.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }

    const rows = await insertRes.json()
    const user = Array.isArray(rows) ? rows[0] : rows

    return NextResponse.json({ user: { mlg_user_id: user.mlg_user_id, plan: user.plan, messages_used: user.messages_used } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET /api/user?id=mlg-xxx — fetch user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mlgUserId = searchParams.get("id")
    if (!mlgUserId) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    // Fetch user
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/melegy_users?mlg_user_id=eq.${mlgUserId}&select=mlg_user_id,plan,messages_used,created_at,last_seen_at`,
      { headers: dbHeaders() }
    )
    const users = await userRes.json()

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // Fetch plan limits
    const limitsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/plan_limits?plan=eq.${user.plan}&select=daily_messages,label`,
      { headers: dbHeaders() }
    )
    const limits = await limitsRes.json()
    const limit = Array.isArray(limits) ? limits[0] : null

    // Update last_seen_at
    await fetch(
      `${SUPABASE_URL}/rest/v1/melegy_users?mlg_user_id=eq.${mlgUserId}`,
      {
        method: "PATCH",
        headers: dbHeaders(),
        body: JSON.stringify({ last_seen_at: new Date().toISOString() }),
      }
    )

    return NextResponse.json({
      user: {
        ...user,
        plan_label: limit?.label || user.plan,
        daily_limit: limit?.daily_messages || 10,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
