export interface SearchResult {
  title: string
  snippet: string
  url: string
  relevance: number
}

export async function enhancedSearch(query: string): Promise<SearchResult[]> {
  return [
    {
      title: "نتيجة البحث 1",
      snippet: "وصف مختصر للنتيجة",
      url: "https://example.com",
      relevance: 0.9,
    },
  ]
}
