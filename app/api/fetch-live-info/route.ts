import { generateText } from 'ai'

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query) {
      return Response.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const result = await generateText({
      model: 'google/gemini-2-flash',
      system: `You are an expert information assistant. Provide accurate, up-to-date information about the user's query. 
      Format your response in Arabic if the query is in Arabic.
      Be concise and factual.`,
      prompt: query,
      maxOutputTokens: 1024,
    })

    return Response.json({
      success: true,
      content: result.text,
      query: query,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error fetching live info:', error)
    return Response.json(
      { error: error.message || 'Failed to fetch information' },
      { status: 500 }
    )
  }
}
