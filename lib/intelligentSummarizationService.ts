import { NLPService } from "./nlpService"

export class IntelligentSummarizationService {
  private nlp = new NLPService()

  public summarize(text: string, maxLength = 200): string {
    const summary = this.nlp.summarizeText(text, maxLength)
    return summary.summary
  }

  public extractKeyPoints(text: string): string[] {
    const summary = this.nlp.summarizeText(text)
    return summary.keyPoints
  }
}
