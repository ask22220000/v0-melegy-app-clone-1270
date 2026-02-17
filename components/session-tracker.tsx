"use client"

import { useSessionTracking, trackUser } from "@/hooks/use-session-tracking"
import { useEffect } from "react"

export function SessionTracker() {
  useSessionTracking()

  useEffect(() => {
    // Track user on first visit with error handling
    try {
      trackUser().catch(() => {
        // Silently fail - don't disrupt user experience
      })
    } catch (error) {
      // Silently fail - don't disrupt user experience
    }
  }, [])

  return null
}
