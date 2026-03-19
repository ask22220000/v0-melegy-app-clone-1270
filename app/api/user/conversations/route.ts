import { NextRequest, NextResponse } from "next/server"
import { getServiceRoleClient } from "@/lib/supabase/server"

// GET /api/user/conversations?user_id=<auth_uuid>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ conversations: [] })
    }

    const supabase = getServiceRoleClient()

    // melegy_history is the actual chat storage table
    const { data, error } = await supabase
      .from("melegy_history")
      .select("id, chat_title, chat_date, created_at, updated_at")
      .eq("auth_user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[user/conversations GET] error:", error.message)
      return NextResponse.json({ conversations: [] })
    }

    const conversations = (data || []).map((row: any) => ({
      id: row.id,
      title: row.chat_title ?? "محادثة",
      created_at: row.updated_at ?? row.created_at,
    }))

    return NextResponse.json({ conversations })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/user/conversations — not needed anymore (save-chat handles this)
export async function POST(request: NextRequest) {
  return NextResponse.json({ conversation: { id: null } })
}
