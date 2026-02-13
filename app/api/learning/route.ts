import { type NextRequest, NextResponse } from "next/server"
import { MLLearningService } from "@/lib/mlLearningService"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case "record_correction": {
        const success = await MLLearningService.recordCorrection({
          sessionId: data.sessionId,
          originalQuestion: data.originalQuestion,
          originalAnswer: data.originalAnswer,
          correctedAnswer: data.correctedAnswer,
          correctionType: data.correctionType || "other",
          userFeedback: data.userFeedback,
          context: data.context,
        })
        return NextResponse.json({ success })
      }

      case "record_rating": {
        const success = await MLLearningService.recordQualityRating({
          question: data.question,
          answer: data.answer,
          rating: data.rating,
          isHelpful: data.isHelpful,
          sessionId: data.sessionId,
        })
        return NextResponse.json({ success })
      }

      case "get_learning_context": {
        const context = await MLLearningService.generateLearningContext(data.question)
        return NextResponse.json({ context })
      }

      case "get_stats": {
        const stats = await MLLearningService.getLearningStats()
        return NextResponse.json(stats)
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("[Learning API] Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const stats = await MLLearningService.getLearningStats()
    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
