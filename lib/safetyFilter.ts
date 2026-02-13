export class SafetyFilter {
  private blockedWords = ["عنف", "إرهاب", "كراهية", "تمييز", "إساءة"]

  private sensitiveTopics = ["سياسة", "دين", "جنس"]

  checkSafety(text: string): { isSafe: boolean; reason?: string } {
    const lowerText = text.toLowerCase()

    // فحص الكلمات المحظورة
    for (const word of this.blockedWords) {
      if (lowerText.includes(word)) {
        return { isSafe: false, reason: `محتوى غير مناسب: ${word}` }
      }
    }

    // تحذير للمواضيع الحساسة
    for (const topic of this.sensitiveTopics) {
      if (lowerText.includes(topic)) {
        console.log(`[v0] تحذير: موضوع حساس - ${topic}`)
      }
    }

    return { isSafe: true }
  }

  filterResponse(text: string): string {
    let filtered = text

    // إزالة أي محتوى غير مناسب من الرد
    for (const word of this.blockedWords) {
      const regex = new RegExp(word, "gi")
      filtered = filtered.replace(regex, "***")
    }

    return filtered
  }
}

export const safetyFilter = new SafetyFilter()
