// Usage limits per plan - matching /pricing page exactly
export const PLAN_LIMITS = {
  free: {
    messagesPerDay: 10,
    imagesPerDay: 3,
    voiceMinutesPerDay: 5,
    wordsPerMonth: -1, // not applicable for free
    name: "مجاني"
  },
  startup: {
    messagesPerDay: 20,
    imagesPerDay: 10,
    voiceMinutesPerDay: 10,
    wordsPerMonth: 30000,
    name: "Start UP"
  },
  pro: {
    messagesPerDay: -1, // unlimited
    imagesPerDay: 100,
    voiceMinutesPerDay: 30,
    wordsPerMonth: -1, // unlimited
    name: "Pro"
  },
  vip: {
    messagesPerDay: -1, // unlimited
    imagesPerDay: -1, // unlimited
    voiceMinutesPerDay: 60,
    wordsPerMonth: -1, // unlimited
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
      // Silent fail
    }
  }
  
  return 'free'
}

// Get today's usage from localStorage
function getTodayUsage() {
  if (typeof window === 'undefined') return { messages: 0, images: 0, voiceMinutes: 0, date: '' }
  
  const today = new Date().toISOString().split('T')[0]
  const usage = localStorage.getItem('dailyUsage')
  
  if (usage) {
    try {
      const usageData = JSON.parse(usage)
      // Reset if it's a new day
      if (usageData.date !== today) {
        return { messages: 0, images: 0, voiceMinutes: 0, date: today }
      }
      return usageData
    } catch (e) {
      // Silent fail
    }
  }
  
  return { messages: 0, images: 0, voiceMinutes: 0, date: today }
}

// Get current month's word count
function getMonthlyWordCount() {
  if (typeof window === 'undefined') return { words: 0, month: '' }
  
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const usage = localStorage.getItem('monthlyUsage')
  
  if (usage) {
    try {
      const usageData = JSON.parse(usage)
      // Reset if it's a new month
      if (usageData.month !== currentMonth) {
        return { words: 0, month: currentMonth }
      }
      return usageData
    } catch (e) {
      // Silent fail
    }
  }
  
  return { words: 0, month: currentMonth }
}

// Save usage to localStorage
function saveUsage(usage: { messages: number; images: number; voiceMinutes: number; date: string }) {
  if (typeof window === 'undefined') return
  localStorage.setItem('dailyUsage', JSON.stringify(usage))
}

// Save monthly usage
function saveMonthlyUsage(usage: { words: number; month: string }) {
  if (typeof window === 'undefined') return
  localStorage.setItem('monthlyUsage', JSON.stringify(usage))
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

// Check if user can use voice chat
export function canUseVoiceChat(): { allowed: boolean; reason?: string; remaining?: number } {
  const plan = getUserPlan()
  const limits = PLAN_LIMITS[plan]
  const usage = getTodayUsage()
  
  // Check limit
  if (usage.voiceMinutes >= limits.voiceMinutesPerDay) {
    return {
      allowed: false,
      reason: `لقد وصلت للحد الأقصى (${limits.voiceMinutesPerDay} دقيقة/يوم) في خطة ${limits.name}. قم بالترقية للمزيد!`,
      remaining: 0
    }
  }
  
  return {
    allowed: true,
    remaining: limits.voiceMinutesPerDay - usage.voiceMinutes
  }
}

// Check monthly word limit (for startup plan)
export function canUseWords(wordCount: number): { allowed: boolean; reason?: string; remaining?: number } {
  const plan = getUserPlan()
  const limits = PLAN_LIMITS[plan]
  
  // Unlimited or not applicable
  if (limits.wordsPerMonth === -1) {
    return { allowed: true }
  }
  
  const monthlyUsage = getMonthlyWordCount()
  
  // Check if adding these words would exceed limit
  if (monthlyUsage.words + wordCount > limits.wordsPerMonth) {
    return {
      allowed: false,
      reason: `لقد وصلت للحد الأقصى (${limits.wordsPerMonth.toLocaleString()} كلمة/شهر) في خطة ${limits.name}. قم بالترقية للمزيد!`,
      remaining: Math.max(0, limits.wordsPerMonth - monthlyUsage.words)
    }
  }
  
  return {
    allowed: true,
    remaining: limits.wordsPerMonth - monthlyUsage.words
  }
}

// Increment message usage
export async function incrementMessageUsage() {
  const usage = getTodayUsage()
  usage.messages += 1
  saveUsage(usage)
}

// Increment image usage
export async function incrementImageUsage() {
  const usage = getTodayUsage()
  usage.images += 1
  saveUsage(usage)
}

// Increment voice usage (in minutes)
export async function incrementVoiceUsage(minutes: number) {
  const usage = getTodayUsage()
  usage.voiceMinutes += minutes
  saveUsage(usage)
}

// Increment word count
export async function incrementWordCount(words: number) {
  const monthlyUsage = getMonthlyWordCount()
  monthlyUsage.words += words
  saveMonthlyUsage(monthlyUsage)
}

// Get current usage stats
export function getUsageStats() {
  const plan = getUserPlan()
  const limits = PLAN_LIMITS[plan]
  const usage = getTodayUsage()
  const monthlyUsage = getMonthlyWordCount()
  
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
    },
    voice: {
      used: usage.voiceMinutes,
      limit: limits.voiceMinutesPerDay,
      remaining: limits.voiceMinutesPerDay - usage.voiceMinutes
    },
    words: {
      used: monthlyUsage.words,
      limit: limits.wordsPerMonth,
      remaining: limits.wordsPerMonth === -1 ? -1 : limits.wordsPerMonth - monthlyUsage.words
    }
  }
}
