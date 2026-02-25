import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const sql = `
CREATE TABLE IF NOT EXISTS melegy_users (
  mlg_user_id   TEXT PRIMARY KEY,
  plan          TEXT NOT NULL DEFAULT 'free',
  messages_used INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_limits (
  plan           TEXT PRIMARY KEY,
  daily_messages INTEGER NOT NULL,
  label          TEXT
);

INSERT INTO plan_limits (plan, daily_messages, label) VALUES
  ('free',    10,    'مجاني'),
  ('startup', 100,   'ستارتر'),
  ('pro',     500,   'برو'),
  ('vip',     99999, 'VIP')
ON CONFLICT (plan) DO NOTHING;

CREATE TABLE IF NOT EXISTS conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL REFERENCES melegy_users(mlg_user_id) ON DELETE CASCADE,
  title      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
`

async function run() {
  console.log("[v0] Running migration via Supabase rpc...")

  const { error } = await supabase.rpc("exec_sql", { query: sql })

  if (error) {
    console.log("[v0] RPC failed, trying pg directly...")
    // fallback: try via REST
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    })
    const text = await res.text()
    console.log("[v0] REST response:", text)
  } else {
    console.log("[v0] Migration done via RPC")
  }

  // Verify
  const { data, error: e2 } = await supabase.from("melegy_users").select("*").limit(1)
  if (e2) {
    console.log("[v0] Verify failed:", e2.message)
  } else {
    console.log("[v0] melegy_users verified OK, rows:", data)
  }
}

run().catch(console.error)
