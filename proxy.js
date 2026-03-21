export async function POST(request) {
  const { updateSession } = await import("./lib/supabase/middleware.js")
  return await updateSession(request)
}

export function GET() {
  return new Response("Proxy is working", { status: 200 })
}
