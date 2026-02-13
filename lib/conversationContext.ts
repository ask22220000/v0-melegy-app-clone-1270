interface ConversationState {
  userId: string
  sessionId: string
  intent: string // نية المستخدم الحالية
  emotion: string // حالة المشاعر
  topic: string // الموضوع الحالي
  entities: Record<string, any> // الكيانات المستخرجة
  history: Array<{ role: string; content: string; timestamp: number }>
  longTermMemory: Array<{ key: string; value: any; importance: number }>
}

class ConversationContextManager {
  private contexts: Map<string, ConversationState> = new Map()

  getOrCreate(userId: string): ConversationState {
    if (!this.contexts.has(userId)) {
      this.contexts.set(userId, {
        userId,
        sessionId: Date.now().toString(),
        intent: "unknown",
        emotion: "neutral",
        topic: "general",
        entities: {},
        history: [],
        longTermMemory: [],
      })
    }
    return this.contexts.get(userId)!
  }

  updateContext(userId: string, updates: Partial<ConversationState>) {
    const context = this.getOrCreate(userId)
    Object.assign(context, updates)
    this.contexts.set(userId, context)
  }

  addToHistory(userId: string, role: string, content: string) {
    const context = this.getOrCreate(userId)
    context.history.push({ role, content, timestamp: Date.now() })

    // الاحتفاظ بآخر 20 رسالة فقط في الذاكرة المباشرة
    if (context.history.length > 20) {
      const removed = context.history.shift()!
      // نقل المعلومات المهمة للذاكرة طويلة المدى
      if (this.isImportant(removed.content)) {
        this.addToLongTermMemory(userId, removed.content)
      }
    }
  }

  private isImportant(content: string): boolean {
    const importantKeywords = ["اسمي", "عمري", "أحب", "أكره", "مهم", "ضروري", "تذكر", "لا تنسى", "دايماً", "أبداً"]
    return importantKeywords.some((keyword) => content.includes(keyword))
  }

  private addToLongTermMemory(userId: string, content: string) {
    const context = this.getOrCreate(userId)
    context.longTermMemory.push({
      key: `memory_${Date.now()}`,
      value: content,
      importance: this.calculateImportance(content),
    })

    // الاحتفاظ بأهم 50 ذكرى فقط
    context.longTermMemory.sort((a, b) => b.importance - a.importance)
    if (context.longTermMemory.length > 50) {
      context.longTermMemory = context.longTermMemory.slice(0, 50)
    }
  }

  private calculateImportance(content: string): number {
    let score = 0
    if (content.includes("اسمي") || content.includes("عمري")) score += 10
    if (content.includes("أحب") || content.includes("أكره")) score += 5
    if (content.includes("مهم")) score += 8
    return score
  }

  getRelevantMemories(userId: string, query: string): string[] {
    const context = this.getOrCreate(userId)
    return context.longTermMemory
      .filter((mem) => this.isRelevant(mem.value, query))
      .slice(0, 3)
      .map((mem) => mem.value)
  }

  private isRelevant(memory: string, query: string): boolean {
    const memoryWords = memory.toLowerCase().split(/\s+/)
    const queryWords = query.toLowerCase().split(/\s+/)
    return queryWords.some((word) => memoryWords.includes(word))
  }
}

export const contextManager = new ConversationContextManager()
