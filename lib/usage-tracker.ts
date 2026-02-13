// Usage limits per plan
export const PLAN_LIMITS = {
  free: {
    messagesPerDay: 10,
    imagesPerDay: 3,
    name: "مجاني"
  },
  startup: {
    messagesPerDay: 20,
    imagesPerDay: 10,
    name: "Start UP"
  },
  pro: {
    messagesPerDay: -1, // unlimited
    imagesPerDay: 100,
    name: "Pro"
  },
  vip: {
    messagesPerDay: -1, // unlimited
    imagesPerDay: -1, // unlimited
    name: "VIP"
  }
} as const

export type PlanType = keyof typeof PLAN_LIMITS

// Get user's current plan from subscription
export function getUserPlan(): PlanType {
  if (typeof window === 'undefined') return 'free'
  
  // Check for active subscription in localStorage
  const subscription = localStorage.getItem('activeSubscription')
  if (subscription) {
    try {
      const subData = JSON.parse(subscription)
      const now = new Date().getTime()
      const expiresAt = new Date(subData.expiresAt).getTime()
      
      // Check if subscription is still valid
      if (expiresAt > now) {
        return subData.plan as PlanType
      }
    } catch (e) {
      console.error('[v0] Error parsing subscription:', e)
    }
  }
  
  return 'free'
}

// Get today's usage from localStorage
function getTodayUsage() {
  if (typeof window === 'undefined') return { messages: 0, images: 0, date: '' }
  
  const today = new Date().toISOString().split('T')[0]
  const usage = localStorage.getItem('dailyUsage')
  
  if (usage) {
    try {
      const usageData = JSON.parse(usage)
      // Reset if it's a new day
      if (usageData.date !== today) {
        return { messages: 0, images: 0, date: today }
      }
      return usageData
    } catch (e) {
      console.error('[v0] Error parsing usage:', e)
    }
  }
  
  return { messages: 0, images: 0, date: today }
}

// Save usage to localStorage
function saveUsage(usage: { messages: number; images: number; date: string }) {
  if (typeof window === 'undefined') return
  localStorage.setItem('dailyUsage', JSON.stringify(usage))
}

// Check if user can send a message
export function canSendMessage(): { allowed: boolean; reason?: string; remaining?: number } {
  const plan = getUserPlan()
  const limits = PLAN_LIMITS[plan]
  const usage = getTodayUsage()
  
  // Unlimited messages
  if (limits.messagesPerDay === -1) {
    return { allowed: true }
  }
  
  // Check limit
  if (usage.messages >= limits.messagesPerDay) {
    return {
      allowed: false,
      reason: `لقد وصلت للحد الأقصى (${limits.messagesPerDay} رسالة/يوم) في خطة ${limits.name}. قم بالترقية للمزيد!`,
      remaining: 0
    }
  }
  
  return {
    allowed: true,
    remaining: limits.messagesPerDay - usage.messages
  }
}

// Check if user can generate an image
export function canGenerateImage(): { allowed: boolean; reason?: string; remaining?: number } {
  const plan = getUserPlan()
  const limits = PLAN_LIMITS[plan]
  const usage = getTodayUsage()
  
  // Unlimited images
  if (limits.imagesPerDay === -1) {
    return { allowed: true }
  }
  
  // Check limit
  if (usage.images >= limits.imagesPerDay) {
    return {
      allowed: false,
      reason: `لقد وصلت للحد الأقصى (${limits.imagesPerDay} صورة/يوم) في خطة ${limits.name}. قم بالترقية للمزيد!`,
      remaining: 0
    }
  }
  
  return {
    allowed: true,
    remaining: limits.imagesPerDay - usage.images
  }
}

// Increment message usage
export async function incrementMessageUsage() {
  const usage = getTodayUsage()
  usage.messages += 1
  saveUsage(usage)
  
  // Track in analytics
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'trackMessage',
        data: { type: 'text' }
      })
    })
  } catch (e) {
    console.error('[v0] Error tracking message:', e)
  }
}

// Increment image usage
export async function incrementImageUsage() {
  const usage = getTodayUsage()
  usage.images += 1
  saveUsage(usage)
  
  // Track in analytics
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'trackFeature',
        data: { feature: 'image_generation' }
      })
    })
  } catch (e) {
    console.error('[v0] Error tracking image:', e)
  }
}

// Get current usage stats
export function getUsageStats() {
  const plan = getUserPlan()
  const limits = PLAN_LIMITS[plan]
  const usage = getTodayUsage()
  
  return {
    plan,
    planName: limits.name,
    messages: {
      used: usage.messages,
      limit: limits.messagesPerDay,
      remaining: limits.messagesPerDay === -1 ? -1 : limits.messagesPerDay - usage.messages
    },
    images: {
      used: usage.images,
      limit: limits.imagesPerDay,
      remaining: limits.imagesPerDay === -1 ? -1 : limits.imagesPerDay - usage.images
    }
  }
}
