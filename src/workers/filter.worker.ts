interface FlatNode {
  id: string
  key: string
  preview: string
}

interface TreeNode {
  id: string
  key: string
  preview: string
  children?: TreeNode[]
}

let nodeIndex: FlatNode[] = []

self.onmessage = (e: MessageEvent) => {
  if (e.data.type === "index") {
    nodeIndex = flattenTree(e.data.treeData)
  } else if (e.data.type === "filter") {
    const pattern: string = (e.data.pattern || "").toLowerCase().trim()
    if (!pattern) {
      self.postMessage({ type: "result", matchingIds: [] as string[] })
      return
    }
    const matchingIds: string[] = []
    for (let i = 0; i < nodeIndex.length; i++) {
      const node = nodeIndex[i]
      if (
        node.key.toLowerCase().includes(pattern) ||
        node.preview.toLowerCase().includes(pattern)
      ) {
        matchingIds.push(node.id)
      }
    }
    self.postMessage({ type: "result", matchingIds })
  }
}

function flattenTree(nodes: TreeNode[]): FlatNode[] {
  const result: FlatNode[] = []
  function walk(list: TreeNode[]) {
    for (const node of list) {
      result.push({ id: node.id, key: node.key, preview: node.preview })
      if (node.children && node.children.length > 0) {
        walk(node.children)
      }
    }
  }
  walk(nodes)
  return result
}
