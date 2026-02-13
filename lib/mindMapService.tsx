export interface MindMapNode {
  id: string
  label: string
  children?: MindMapNode[]
  level: number
}

export interface MindMapResult {
  success: boolean
  mindMap?: MindMapNode
  html?: string
  error?: string
}

function generateNodeId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function createMindMap(topic: string, content: string): MindMapResult {
  try {
    const lines = content.split("\n").filter((line) => line.trim())

    const rootNode: MindMapNode = {
      id: generateNodeId(),
      label: topic,
      level: 0,
      children: [],
    }

    const nodeStack: { node: MindMapNode; indent: number }[] = [{ node: rootNode, indent: -1 }]

    lines.forEach((line) => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return

      const indent = line.search(/\S/)
      const label = trimmedLine.replace(/^[-•*]\s*/, "")

      const newNode: MindMapNode = {
        id: generateNodeId(),
        label: label,
        level: Math.floor(indent / 2) + 1,
        children: [],
      }

      while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].indent >= indent) {
        nodeStack.pop()
      }

      const parentNode = nodeStack[nodeStack.length - 1].node
      if (!parentNode.children) {
        parentNode.children = []
      }
      parentNode.children.push(newNode)

      nodeStack.push({ node: newNode, indent })
    })

    const html = generateMindMapHTML(rootNode)

    return {
      success: true,
      mindMap: rootNode,
      html,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create mind map",
    }
  }
}

function generateMindMapHTML(node: MindMapNode): string {
  const colors = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-blue-500",
    "from-yellow-500 to-orange-500",
  ]

  function renderNode(node: MindMapNode, depth = 0): string {
    const colorClass = colors[depth % colors.length]
    const hasChildren = node.children && node.children.length > 0

    return `
      <div class="mind-map-node" style="margin-left: ${depth * 40}px; margin-bottom: 16px;">
        <div class="flex items-center gap-3 mb-3">
          <div class="px-4 py-2 rounded-xl bg-gradient-to-r ${colorClass} text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-300">
            ${node.label}
          </div>
          ${depth > 0 ? '<div class="w-8 h-0.5 bg-gradient-to-r ' + colorClass + '"></div>' : ""}
        </div>
        ${
          hasChildren
            ? `
          <div class="mind-map-children">
            ${node.children!.map((child) => renderNode(child, depth + 1)).join("")}
          </div>
        `
            : ""
        }
      </div>
    `
  }

  return `
    <div class="mind-map-container p-6 rounded-2xl" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1);">
      ${renderNode(node)}
    </div>
  `
}

export function shouldCreateMindMap(input: string): boolean {
  const mindMapKeywords = [
    "mind map",
    "خريطة ذهنية",
    "خريطه ذهنيه",
    "منظم أفكار",
    "نظم أفكار",
    "organize ideas",
    "structure thoughts",
    "map out",
    "نظم الأفكار",
    "اعمل خريطة",
    "كون خريطة",
    "ارسم خريطة",
  ]

  return mindMapKeywords.some((keyword) => input.toLowerCase().includes(keyword.toLowerCase()))
}
