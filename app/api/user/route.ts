import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "public" },
  })
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
export async function POST(request: NextRequest) {
  try {
    const db = getClient()
    let mlgUserId = generateMlgId()

    // Ensure uniqueness
    for (let i = 0; i < 5; i++) {
      const { data } = await db
        .from("melegy_users")
        .select("mlg_user_id")
        .eq("mlg_user_id", mlgUserId)
        .maybeSingle()
      if (!data) break
      mlgUserId = generateMlgId()
    }

    const now = new Date().toISOString()
    const { data: user, error } = await db
      .from("melegy_users")
      .insert({
        mlg_user_id: mlgUserId,
        plan: "free",
        messages_used: 0,
        messages_daily_reset_at: now,
        voice_minutes_used: 0,
        voice_minutes_daily_reset_at: now,
        image_edits_used: 0,
        image_edits_daily_reset_at: now,
        created_at: now,
        last_seen_at: now,
        user_agent: request.headers.get("user-agent") || "",
        ip_address: request.headers.get("x-forwarded-for") || "",
      })
      .select("mlg_user_id, plan, messages_used, created_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET /api/user?id=mlg-xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mlgUserId = searchParams.get("id")
    if (!mlgUserId) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const db = getClient()

    // Get user with plan info
    const { data: user, error } = await db
      .from("melegy_users")
      .select("mlg_user_id, plan, plan_expires_at, messages_used, messages_daily_reset_at, voice_minutes_used, image_edits_used, created_at")
      .eq("mlg_user_id", mlgUserId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Get plan limits
    const { data: planLimit } = await db
      .from("plan_limits")
      .select("label, daily_messages, daily_image_edits, daily_voice_minutes")
      .eq("plan", user.plan)
      .maybeSingle()

    // Check if plan expired
    let currentPlan = user.plan
    if (user.plan_expires_at && new Date(user.plan_expires_at) < new Date()) {
      currentPlan = "free"
      await db.from("melegy_users").update({ plan: "free" }).eq("mlg_user_id", mlgUserId)
    }

    // Update last_seen_at
    db.from("melegy_users")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("mlg_user_id", mlgUserId)
      .then(() => {})

    // Get user's conversations
    const { data: conversations } = await db
      .from("melegy_conversations")
      .select("id, title, created_at, updated_at")
      .eq("mlg_user_id", mlgUserId)
      .order("updated_at", { ascending: false })

    return NextResponse.json({
      user: {
        mlg_user_id: user.mlg_user_id,
        plan: currentPlan,
        plan_expires_at: user.plan_expires_at,
        plan_label: planLimit?.label || currentPlan,
        messages_used: user.messages_used,
        daily_limit: planLimit?.daily_messages ?? 10,
        voice_minutes_used: user.voice_minutes_used,
        daily_voice_limit: planLimit?.daily_voice_minutes ?? 30,
        image_edits_used: user.image_edits_used,
        daily_image_edits_limit: planLimit?.daily_image_edits ?? 3,
        conversations: conversations || [],
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
