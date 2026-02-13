export interface Message {
  id: number
  text: string
  sender: "user" | "bot"
  timestamp: Date
  imageUrl?: string
  imageUrls?: string[]
  videoUrl?: string
  audioUrl?: string
  typing?: boolean
}
