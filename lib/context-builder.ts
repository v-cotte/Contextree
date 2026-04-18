import {
  Branch,
  FileAttachment,
  Chat,
  Message,
  ContextLayer,
  ResponseMode,
  RESPONSE_MODE_INSTRUCTIONS,
} from '@/types'

export interface BuildContextInput {
  chat: Chat
  branches: Branch[]
  filesByBranch: Record<string, FileAttachment[]>
  history: Message[]
  userMessage: string
}

export interface BuiltPrompt {
  system: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  layerCount: number
  fileCount: number
  estimatedTokens: number
}

const MAX_SAFE_DEPTH = 50
const APPROX_CHARS_PER_TOKEN = 4

export function getAncestorChain(
  branchId: string,
  branches: Branch[]
): Branch[] {
  const byId = new Map(branches.map((b) => [b.id, b]))
  const chain: Branch[] = []
  const visited = new Set<string>()

  let current = byId.get(branchId)
  let depth = 0

  while (current) {
    if (visited.has(current.id)) {
      console.warn(`[contextree] cycle detected at branch ${current.id}`)
      break
    }
    if (depth >= MAX_SAFE_DEPTH) {
      console.warn(`[contextree] max depth ${MAX_SAFE_DEPTH} reached`)
      break
    }
    visited.add(current.id)
    chain.unshift(current)
    depth += 1
    if (current.parentId === null) break
    const parent = byId.get(current.parentId)
    if (!parent) {
      console.warn(
        `[contextree] parent ${current.parentId} missing for ${current.id}`
      )
      break
    }
    current = parent
  }

  return chain
}

export function buildContextLayers(
  ancestorChain: Branch[],
  filesByBranch: Record<string, FileAttachment[]>
): ContextLayer[] {
  return ancestorChain
    .map<ContextLayer>((branch) => ({
      branchId: branch.id,
      branchName: branch.name,
      contextMarkdown: branch.contextMarkdown?.trim() ?? '',
      files: filesByBranch[branch.id] ?? [],
    }))
    .filter(
      (layer) => layer.contextMarkdown.length > 0 || layer.files.length > 0
    )
}

export function renderContextBlock(layers: ContextLayer[]): string {
  if (layers.length === 0) return ''

  const parts: string[] = []

  layers.forEach((layer, index) => {
    const isLast = index === layers.length - 1
    const role = isLast ? 'active branch' : 'inherited context'
    parts.push(`<layer name="${escapeXml(layer.branchName)}" role="${role}">`)

    if (layer.contextMarkdown) {
      parts.push(layer.contextMarkdown)
    }

    if (layer.files.length > 0) {
      parts.push('')
      layer.files.forEach((file) => {
        const text = (file.extractedText ?? '').trim()
        if (!text) return
        parts.push(`<file name="${escapeXml(file.name)}">`)
        parts.push(text)
        parts.push('</file>')
      })
    }

    parts.push('</layer>')
    parts.push('')
  })

  return parts.join('\n').trim()
}

function baseSystemInstruction(responseMode: ResponseMode): string {
  return [
    'You are a proactive assistant helping the user with their work.',
    'Use the context layers below to understand who the user is, what they are working on, and how they work.',
    'Inner layers override outer layers when they conflict. The "active branch" layer is the most specific.',
    'Never fabricate details that are not in the context. If something is unclear, say so plainly.',
    '',
    RESPONSE_MODE_INSTRUCTIONS[responseMode],
  ].join('\n')
}

export function buildPrompt(input: BuildContextInput): BuiltPrompt {
  const { chat, branches, filesByBranch, history, userMessage } = input

  const chain = getAncestorChain(chat.branchId, branches)
  const layers = buildContextLayers(chain, filesByBranch)
  const contextBlock = renderContextBlock(layers)
  const instruction = baseSystemInstruction(chat.responseMode)

  const system = contextBlock
    ? `${instruction}\n\n<context>\n${contextBlock}\n</context>`
    : instruction

  const messages = [
    ...history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ]

  const fileCount = layers.reduce((sum, l) => sum + l.files.length, 0)
  const estimatedTokens = estimateTokenCount(system, messages)

  return {
    system,
    messages,
    layerCount: layers.length,
    fileCount,
    estimatedTokens,
  }
}

export function estimateTokenCount(
  system: string,
  messages: { role: string; content: string }[]
): number {
  const totalChars =
    system.length + messages.reduce((sum, m) => sum + m.content.length, 0)
  return Math.ceil(totalChars / APPROX_CHARS_PER_TOKEN)
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}