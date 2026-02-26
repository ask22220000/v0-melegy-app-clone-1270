import { apiKeyManager } from "./apiKeyManager"

interface SearchResult {
  title: string
  snippet: string
  url: string
  source: string
  relevanceScore: number
  timestamp?: string
}

interface SearchResponse {
  results: SearchResult[]
  totalResults: number
  searchTime: number
}

export class SearchService {
  private apiKey: string

  constructor() {
    this.apiKey = apiKeyManager.getCurrentKey()
  }

  async searchInternet(query: string, sources: string[] = ["all"]): Promise<SearchResponse> {
    const startTime = Date.now()
    const results: SearchResult[] = []

    try {
      // DuckDuckGo Search
      if (sources.includes("all") || sources.includes("duckduckgo")) {
        const ddgResults = await this.searchDuckDuckGo(query)
        results.push(...ddgResults)
      }

      // Wikipedia Search
      if (sources.includes("all") || sources.includes("wikipedia")) {
        const wikiResults = await this.searchWikipedia(query)
        results.push(...wikiResults)
      }

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore)

      return {
        results: results.slice(0, 10),
        totalResults: results.length,
        searchTime: Date.now() - startTime,
      }
    } catch (error) {
      console.error("[SearchService] Error:", error)
      return {
        results: [],
        totalResults: 0,
        searchTime: Date.now() - startTime,
      }
    }
  }

  private async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`)
      const data = await response.json()

      const results: SearchResult[] = []

      if (data.AbstractText) {
        results.push({
          title: data.Heading || "DuckDuckGo Result",
          snippet: data.AbstractText,
          url: data.AbstractURL || "",
          source: "DuckDuckGo",
          relevanceScore: 0.9,
        })
      }

      if (data.RelatedTopics) {
        data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
          if (topic.Text) {
            results.push({
              title: topic.Text.split(" - ")[0] || "Related Topic",
              snippet: topic.Text,
              url: topic.FirstURL || "",
              source: "DuckDuckGo",
              relevanceScore: 0.7,
            })
          }
        })
      }

      return results
    } catch (error) {
      console.error("[SearchService] DuckDuckGo error:", error)
      return []
    }
  }

  private async searchWikipedia(query: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`,
      )
      const data = await response.json()

      const results: SearchResult[] = []

      if (data.query?.search) {
        data.query.search.slice(0, 3).forEach((result: any) => {
          results.push({
            title: result.title,
            snippet: result.snippet.replace(/<[^>]*>/g, ""),
            url: `https://ar.wikipedia.org/wiki/${encodeURIComponent(result.title)}`,
            source: "Wikipedia",
            relevanceScore: 0.85,
            timestamp: result.timestamp,
          })
        })
      }

      return results
    } catch (error) {
      console.error("[SearchService] Wikipedia error:", error)
      return []
    }
  }

  calculateRelevance(query: string, text: string): number {
    const queryWords = query.toLowerCase().split(" ")
    const textLower = text.toLowerCase()

    let matches = 0
    queryWords.forEach((word) => {
      if (textLower.includes(word)) matches++
    })

    return matches / queryWords.length
  }
}
