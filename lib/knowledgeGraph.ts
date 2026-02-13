interface KnowledgeNode {
  id: string
  type: string
  content: string
  metadata: Record<string, any>
  connections: string[]
  timestamp: number
}

class KnowledgeGraph {
  private nodes: Map<string, KnowledgeNode> = new Map()

  addNode(type: string, content: string, metadata: Record<string, any> = {}): string {
    const id = `${type}_${Date.now()}`
    this.nodes.set(id, {
      id,
      type,
      content,
      metadata,
      connections: [],
      timestamp: Date.now(),
    })
    return id
  }

  connect(nodeId1: string, nodeId2: string) {
    const node1 = this.nodes.get(nodeId1)
    const node2 = this.nodes.get(nodeId2)

    if (node1 && node2) {
      if (!node1.connections.includes(nodeId2)) {
        node1.connections.push(nodeId2)
      }
      if (!node2.connections.includes(nodeId1)) {
        node2.connections.push(nodeId1)
      }
    }
  }

  search(query: string, type?: string): KnowledgeNode[] {
    const results: KnowledgeNode[] = []
    const lowerQuery = query.toLowerCase()

    for (const node of this.nodes.values()) {
      if (type && node.type !== type) continue

      if (node.content.toLowerCase().includes(lowerQuery)) {
        results.push(node)
      }
    }

    return results.sort((a, b) => b.timestamp - a.timestamp)
  }

  getConnected(nodeId: string): KnowledgeNode[] {
    const node = this.nodes.get(nodeId)
    if (!node) return []

    return node.connections.map((id) => this.nodes.get(id)).filter((n) => n !== undefined) as KnowledgeNode[]
  }
}

export const knowledgeGraph = new KnowledgeGraph()
