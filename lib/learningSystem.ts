interface UserPattern {
  keywords: string[]
  responses: string[]
  frequency: number
  lastUsed: string
  context: string[]
}

interface LearningData {
  userPatterns: Record<string, UserPattern>
  conversationHistory: any[]
  preferences: {
    language: string
    responseStyle: "formal" | "casual" | "technical"
    topics: Record<string, number>
  }
  personalInfo: Record<string, string>
  lastUpdated: string
}

export class LearningSystem {
  private storageKey = "meleji-learning-data"
  private learningData: LearningData

  constructor() {
    this.learningData = this.loadLearningData()
  }

  private loadLearningData(): LearningData {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(this.storageKey)
        if (stored) {
          return JSON.parse(stored)
        }
      }
    } catch (error) {
      console.error("Error loading learning data:", error)
    }

    return {
      userPatterns: {},
      conversationHistory: [],
      preferences: {
        language: "ar",
        responseStyle: "casual",
        topics: {},
      },
      personalInfo: {},
      lastUpdated: new Date().toISOString(),
    }
  }

  private saveLearningData(): void {
    try {
      if (typeof window !== "undefined") {
        this.learningData.lastUpdated = new Date().toISOString()
        localStorage.setItem(this.storageKey, JSON.stringify(this.learningData))
      }
    } catch (error) {
      console.error("Error saving learning data:", error)
    }
  }

  public learnFromInteraction(userInput: string, conversationHistory: any[]): void {
    const keywords = this.extractKeywords(userInput)
    const language = this.detectLanguage(userInput)
    const topics = this.extractTopics(userInput)

    if (language !== this.learningData.preferences.language) {
      this.learningData.preferences.language = language
    }

    topics.forEach((topic) => {
      this.learningData.preferences.topics[topic] = (this.learningData.preferences.topics[topic] || 0) + 1
    })

    const patternKey = keywords.slice(0, 3).join("-").toLowerCase()
    if (patternKey) {
      if (!this.learningData.userPatterns[patternKey]) {
        this.learningData.userPatterns[patternKey] = {
          keywords,
          responses: [],
          frequency: 0,
          lastUsed: new Date().toISOString(),
          context: [],
        }
      }

      this.learningData.userPatterns[patternKey].frequency += 1
      this.learningData.userPatterns[patternKey].lastUsed = new Date().toISOString()
    }

    this.saveLearningData()
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for"])
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .slice(0, 10)
  }

  private detectLanguage(text: string): string {
    if (/[\u0600-\u06FF]/.test(text)) return "ar"
    return "en"
  }

  private extractTopics(text: string): string[] {
    return []
  }

  public getPersonalizedContext(): string {
    const { preferences } = this.learningData
    return `User preferences: Language: ${preferences.language}, Style: ${preferences.responseStyle}`
  }
}
