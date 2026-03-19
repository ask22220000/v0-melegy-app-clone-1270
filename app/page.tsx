import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { HomeContent } from "@/components/home-content"

// v3 - no dynamic import, no ssr:false
export const dynamic = "force-dynamic"

export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (data?.user) redirect("/chat")
  return <HomeContent />
}
