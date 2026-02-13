"use client"

import { PlanType } from "./usage-tracker"

export function setActiveSubscription(plan: PlanType) {
  if (typeof window === 'undefined') return
  
  // Set subscription with far future expiry (100 years)
  const subscription = {
    plan,
    expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    activatedAt: new Date().toISOString()
  }
  
  localStorage.setItem('activeSubscription', JSON.stringify(subscription))
}

export function clearSubscription() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('activeSubscription')
}
