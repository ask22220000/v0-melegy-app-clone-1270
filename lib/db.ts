/**
 * lib/db.ts — DynamoDB client using zero external packages.
 * Uses AWS Signature V4 + Node.js built-in `crypto` + native `fetch`.
 *
 * Single-table design:
 *   PK               SK                     Purpose
 *   USER#{userId}    META                   User profile & plan info
 *   USER#{userId}    USAGE#{date}           Daily usage counters
 *   USER#{userId}    CHAT#{ts}#{id}         Conversation record
 *   ANALYTICS        GLOBAL                 Global counters
 *   ANALYTICS        PLAN_COUNTS            Per-plan subscriber counts
 */

import { createHmac, createHash } from "crypto"

// ─── Config ──────────────────────────────────────────────────────────────────
function cfg() {
  return {
    region: process.env.AWS_REGION ?? "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    sessionToken: process.env.AWS_SESSION_TOKEN,
    table: process.env.DYNAMODB_TABLE_NAME ?? "",
  }
}

// ─── AWS Signature V4 ────────────────────────────────────────────────────────
function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex")
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest()
}

function getSigningKey(secret: string, date: string, region: string, service: string): Buffer {
  const kDate    = hmacSha256(`AWS4${secret}`, date)
  const kRegion  = hmacSha256(kDate, region)
  const kService = hmacSha256(kRegion, service)
  return hmacSha256(kService, "aws4_request")
}

async function dynamoRequest(target: string, body: object): Promise<any> {
  const { region, accessKeyId, secretAccessKey, sessionToken } = cfg()

  const endpoint  = `https://dynamodb.${region}.amazonaws.com/`
  const service   = "dynamodb"
  const now       = new Date()
  const amzDate   = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z"
  const dateStamp = amzDate.slice(0, 8)

  const payload    = JSON.stringify(body)
  const bodyHash   = sha256Hex(payload)

  const headers: Record<string, string> = {
    "content-type": "application/x-amz-json-1.0",
    "x-amz-date": amzDate,
    "x-amz-target": target,
    "host": `dynamodb.${region}.amazonaws.com`,
    "x-amz-content-sha256": bodyHash,
  }
  if (sessionToken) headers["x-amz-security-token"] = sessionToken

  const sortedHeaderNames = Object.keys(headers).sort()
  const canonicalHeaders  = sortedHeaderNames.map(k => `${k}:${headers[k]}\n`).join("")
  const signedHeaders     = sortedHeaderNames.join(";")

  const canonicalRequest = [
    "POST",
    "/",
    "",
    canonicalHeaders,
    signedHeaders,
    bodyHash,
  ].join("\n")

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n")

  const signingKey = getSigningKey(secretAccessKey, dateStamp, region, service)
  const signature  = createHmac("sha256", signingKey).update(stringToSign).digest("hex")

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { ...headers, Authorization: authHeader },
    body: payload,
  })

  const text = await res.text()
  if (!res.ok) {
    const err = JSON.parse(text)
    // Ignore ConditionalCheckFailedException (item already exists)
    if (err?.__type?.includes("ConditionalCheckFailedException")) return {}
    throw new Error(`DynamoDB ${target} error ${res.status}: ${text}`)
  }
  return text ? JSON.parse(text) : {}
}

// ─── DynamoDB AttributeValue helpers ────────────────────────────────────────
function marshal(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue
    if (typeof v === "string")        out[k] = { S: v }
    else if (typeof v === "number")   out[k] = { N: String(v) }
    else if (typeof v === "boolean")  out[k] = { BOOL: v }
    else if (Array.isArray(v))        out[k] = { S: JSON.stringify(v) }
    else if (typeof v === "object")   out[k] = { S: JSON.stringify(v) }
  }
  return out
}

function unmarshal(item: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(item)) {
    if (v.S !== undefined) {
      // Try parse JSON arrays/objects
      if ((v.S.startsWith("[") || v.S.startsWith("{"))) {
        try { out[k] = JSON.parse(v.S); continue } catch {}
      }
      out[k] = v.S
    } else if (v.N !== undefined) out[k] = Number(v.N)
    else if (v.BOOL !== undefined) out[k] = v.BOOL
    else if (v.NULL !== undefined) out[k] = null
    else if (v.L !== undefined)   out[k] = v.L.map((i: any) => unmarshal({ _: i })._)
    else if (v.M !== undefined)   out[k] = unmarshal(v.M)
  }
  return out
}

const TABLE = () => cfg().table

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserMeta {
  userId: string
  plan: "free" | "startup" | "pro" | "vip"
  planExpiresAt?: string
  theme?: string
  createdAt: string
  updatedAt: string
}

export interface DailyUsage {
  userId: string
  date: string
  messages: number
  images: number
  animated_videos: number
  voice_minutes: number
}

export interface ConversationItem {
  id: string
  SK: string
  userId: string
  title: string
  date: string
  createdAt: string
  messages: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: number
    imageUrl?: string
    videoUrl?: string
  }>
}

export interface AnalyticsGlobal {
  totalMessages: number
  totalImages: number
  totalVideos: number
  totalVoiceMinutes: number
  totalUsers: number
}

// ─── User Meta ────────────────────────────────────────────────────────────────
export async function getUserMeta(userId: string): Promise<UserMeta | null> {
  const res = await dynamoRequest("DynamoDB_20120810.GetItem", {
    TableName: TABLE(),
    Key: { PK: { S: `USER#${userId}` }, SK: { S: "META" } },
  })
  return res.Item ? (unmarshal(res.Item) as UserMeta) : null
}

export async function ensureUserMeta(userId: string): Promise<UserMeta> {
  const existing = await getUserMeta(userId)
  if (existing) return existing

  const now: string = new Date().toISOString()
  const meta: UserMeta = { userId, plan: "free", theme: "dark", createdAt: now, updatedAt: now }

  await dynamoRequest("DynamoDB_20120810.PutItem", {
    TableName: TABLE(),
    Item: { PK: { S: `USER#${userId}` }, SK: { S: "META" }, ...marshal(meta) },
    ConditionExpression: "attribute_not_exists(PK)",
  })
  return meta
}

export async function getEffectivePlan(userId: string): Promise<"free" | "startup" | "pro" | "vip"> {
  const meta = await getUserMeta(userId)
  if (!meta) return "free"
  if (meta.plan === "free") return "free"
  if (meta.planExpiresAt && new Date(meta.planExpiresAt) < new Date()) {
    await dynamoRequest("DynamoDB_20120810.UpdateItem", {
      TableName: TABLE(),
      Key: { PK: { S: `USER#${userId}` }, SK: { S: "META" } },
      UpdateExpression: "SET #plan = :free, updatedAt = :now",
      ExpressionAttributeNames: { "#plan": "plan" },
      ExpressionAttributeValues: { ":free": { S: "free" }, ":now": { S: new Date().toISOString() } },
    })
    return "free"
  }
  return meta.plan
}

export async function setUserSubscription(
  userId: string,
  plan: "free" | "startup" | "pro" | "vip",
  durationDays: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString()
  await dynamoRequest("DynamoDB_20120810.UpdateItem", {
    TableName: TABLE(),
    Key: { PK: { S: `USER#${userId}` }, SK: { S: "META" } },
    UpdateExpression: "SET #plan = :plan, planExpiresAt = :exp, updatedAt = :now",
    ExpressionAttributeNames: { "#plan": "plan" },
    ExpressionAttributeValues: {
      ":plan": { S: plan },
      ":exp":  { S: expiresAt },
      ":now":  { S: new Date().toISOString() },
    },
  })
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function todayEgypt(): string {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10)
}
export function monthEgypt(): string { return todayEgypt().slice(0, 7) }

// ─── Daily Usage ──────────────────────────────────────────────────────────────
export async function getDailyUsage(userId: string, date: string): Promise<DailyUsage> {
  const res = await dynamoRequest("DynamoDB_20120810.GetItem", {
    TableName: TABLE(),
    Key: { PK: { S: `USER#${userId}` }, SK: { S: `USAGE#${date}` } },
  })
  return res.Item
    ? (unmarshal(res.Item) as DailyUsage)
    : { userId, date, messages: 0, images: 0, animated_videos: 0, voice_minutes: 0 }
}

export async function incrementDailyUsage(
  userId: string, date: string,
  field: "messages" | "images" | "animated_videos" | "voice_minutes",
  amount = 1
): Promise<void> {
  await dynamoRequest("DynamoDB_20120810.UpdateItem", {
    TableName: TABLE(),
    Key: { PK: { S: `USER#${userId}` }, SK: { S: `USAGE#${date}` } },
    UpdateExpression: "SET #f = if_not_exists(#f, :zero) + :amount, userId = :uid, #date = :date",
    ExpressionAttributeNames: { "#f": field, "#date": "date" },
    ExpressionAttributeValues: {
      ":zero":   { N: "0" },
      ":amount": { N: String(amount) },
      ":uid":    { S: userId },
      ":date":   { S: date },
    },
  })
}

// ─── Conversations ────────────────────────────────────────────────────────────
export async function getConversations(userId: string, limit = 100): Promise<ConversationItem[]> {
  const res = await dynamoRequest("DynamoDB_20120810.Query", {
    TableName: TABLE(),
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
    ExpressionAttributeValues: {
      ":pk":     { S: `USER#${userId}` },
      ":prefix": { S: "CHAT#" },
    },
    ScanIndexForward: false,
    Limit: limit,
  })
  return ((res.Items ?? []) as any[]).map(unmarshal) as ConversationItem[]
}

export async function saveConversation(data: {
  userId: string; title: string; date: string
  messages: ConversationItem["messages"]
}): Promise<string> {
  const ts = Date.now()
  const id = `${ts}-${Math.random().toString(36).slice(2, 8)}`
  const SK = `CHAT#${ts}#${id}`

  await dynamoRequest("DynamoDB_20120810.PutItem", {
    TableName: TABLE(),
    Item: marshal({
      PK: `USER#${data.userId}`, SK, id,
      userId: data.userId, title: data.title, date: data.date,
      createdAt: new Date().toISOString(),
      messages: data.messages, // will be JSON.stringify'd by marshal
    }),
  })
  return id
}

export async function updateConversationMessages(
  userId: string, SK: string,
  messages: ConversationItem["messages"]
): Promise<void> {
  await dynamoRequest("DynamoDB_20120810.UpdateItem", {
    TableName: TABLE(),
    Key: { PK: { S: `USER#${userId}` }, SK: { S: SK } },
    UpdateExpression: "SET messages = :msgs, updatedAt = :now",
    ExpressionAttributeValues: {
      ":msgs": { S: JSON.stringify(messages) },
      ":now":  { S: new Date().toISOString() },
    },
  })
}

export async function deleteConversation(userId: string, SK: string): Promise<void> {
  await dynamoRequest("DynamoDB_20120810.DeleteItem", {
    TableName: TABLE(),
    Key: { PK: { S: `USER#${userId}` }, SK: { S: SK } },
  })
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function getAnalytics(): Promise<AnalyticsGlobal> {
  const res = await dynamoRequest("DynamoDB_20120810.GetItem", {
    TableName: TABLE(),
    Key: { PK: { S: "ANALYTICS" }, SK: { S: "GLOBAL" } },
  })
  return res.Item
    ? (unmarshal(res.Item) as AnalyticsGlobal)
    : { totalMessages: 0, totalImages: 0, totalVideos: 0, totalVoiceMinutes: 0, totalUsers: 0 }
}

export async function incrementAnalytics(field: keyof AnalyticsGlobal, amount = 1): Promise<void> {
  await dynamoRequest("DynamoDB_20120810.UpdateItem", {
    TableName: TABLE(),
    Key: { PK: { S: "ANALYTICS" }, SK: { S: "GLOBAL" } },
    UpdateExpression: "SET #f = if_not_exists(#f, :zero) + :amount",
    ExpressionAttributeNames: { "#f": field as string },
    ExpressionAttributeValues: { ":zero": { N: "0" }, ":amount": { N: String(amount) } },
  })
}

export async function countUsersByPlan(): Promise<Record<string, number>> {
  const res = await dynamoRequest("DynamoDB_20120810.GetItem", {
    TableName: TABLE(),
    Key: { PK: { S: "ANALYTICS" }, SK: { S: "PLAN_COUNTS" } },
  })
  return res.Item ? (unmarshal(res.Item) as Record<string, number>) : {}
}

export async function incrementPlanCount(plan: string, delta: number): Promise<void> {
  await dynamoRequest("DynamoDB_20120810.UpdateItem", {
    TableName: TABLE(),
    Key: { PK: { S: "ANALYTICS" }, SK: { S: "PLAN_COUNTS" } },
    UpdateExpression: "SET #plan = if_not_exists(#plan, :zero) + :delta",
    ExpressionAttributeNames: { "#plan": plan },
    ExpressionAttributeValues: { ":zero": { N: "0" }, ":delta": { N: String(delta) } },
  })
}

// ─── Scan helpers for analytics page ─────────────────────────────────────────
export async function scanAllUsers(): Promise<UserMeta[]> {
  const results: UserMeta[] = []
  let lastKey: any = undefined

  do {
    const body: any = {
      TableName: TABLE(),
      FilterExpression: "SK = :meta",
      ExpressionAttributeValues: { ":meta": { S: "META" } },
    }
    if (lastKey) body.ExclusiveStartKey = lastKey

    const res = await dynamoRequest("DynamoDB_20120810.Scan", body)
    results.push(...((res.Items ?? []) as any[]).map(unmarshal) as UserMeta[])
    lastKey = res.LastEvaluatedKey
  } while (lastKey)

  return results
}

export async function scanRecentChats(sinceDaysAgo: number): Promise<ConversationItem[]> {
  const since = new Date(Date.now() - sinceDaysAgo * 86400000).toISOString()
  const results: ConversationItem[] = []
  let lastKey: any = undefined

  do {
    const body: any = {
      TableName: TABLE(),
      FilterExpression: "begins_with(SK, :prefix) AND createdAt >= :since",
      ExpressionAttributeValues: {
        ":prefix": { S: "CHAT#" },
        ":since":  { S: since },
      },
    }
    if (lastKey) body.ExclusiveStartKey = lastKey

    const res = await dynamoRequest("DynamoDB_20120810.Scan", body)
    results.push(...((res.Items ?? []) as any[]).map(unmarshal) as ConversationItem[])
    lastKey = res.LastEvaluatedKey
  } while (lastKey)

  return results
}
