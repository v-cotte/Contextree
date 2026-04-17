'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/store'
import { Message, ResponseMode, MODELS } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface ChatViewProps {
  conversationId: string
}

export default function ChatView({ conversationId }: ChatViewProps) {
  const {
    conversations,
    messages,
    projects,
    files,
    getProjectAncestors,
    addMessage,
    updateConversation,
    selectProject,
  } = useStore()

  const conversation = conversations.find((c) => c.id === conversationId)
  const conversationMessages = messages[conversationId] ?? []
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const ancestors = conversation
    ? getProjectAncestors(conversation.projectId)
    : []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationMessages, streamingContent])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  if (!conversation) return null

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }

    addMessage(conversationId, userMessage)
    setInput('')
    setLoading(true)
    setStreamingContent('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          userMessage: input.trim(),
          projects,
          filesByProject: files,
          history: conversationMessages,
          model: conversation.model,
          responseMode: conversation.responseMode,
          projectId: conversation.projectId,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Request failed')
      }

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullContent += chunk
        setStreamingContent(fullContent)
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        conversationId,
        role: 'assistant',
        content: fullContent,
        model: conversation.model,
        responseMode: conversation.responseMode,
        createdAt: new Date().toISOString(),
      }

      addMessage(conversationId, assistantMessage)
      setStreamingContent('')
    } catch (err: unknown) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        conversationId,
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
        createdAt: new Date().toISOString(),
      }
      addMessage(conversationId, errorMessage)
      setStreamingContent('')
    } finally {
      setLoading(false)
    }
  }

  const allModels = Object.values(MODELS).flat()

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-border px-5 py-3">
        <div className="flex flex-1 items-center gap-1.5 text-xs text-muted-foreground">
          {ancestors.map((ancestor, i) => (
            <span key={ancestor.id} className="flex items-center gap-1.5">
              <button
                onClick={() => selectProject(ancestor.id)}
                className="hover:text-foreground"
              >
                {ancestor.name}
              </button>
              <span>/</span>
            </span>
          ))}
          <span className="text-sm font-medium text-foreground">
            {conversation.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {ancestors.length} context{' '}
            {ancestors.length === 1 ? 'layer' : 'layers'}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {conversationMessages.length === 0 && !streamingContent ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <p className="text-sm font-medium">Start the conversation</p>
            <p className="text-xs text-muted-foreground">
              {ancestors.length > 0
                ? `Context from ${ancestors.map((a) => a.name).join(' → ')} is loaded`
                : 'No context loaded — add context to the parent project'}
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {conversationMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {streamingContent && (
              <MessageBubble
                message={{
                  id: 'streaming',
                  conversationId,
                  role: 'assistant',
                  content: streamingContent,
                  createdAt: new Date().toISOString(),
                }}
                isStreaming
              />
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-border px-5 py-3">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg border border-border focus-within:border-[#7F77DD]">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={`Ask anything — context from ${ancestors.map((a) => a.name).join(' + ')} is loaded…`}
              className="w-full resize-none bg-transparent px-3 pt-3 text-sm outline-none placeholder:text-muted-foreground"
              rows={1}
              disabled={loading}
            />
            <div className="flex items-center gap-2 px-3 pb-2 pt-1">
              {(['concise', 'detailed', 'step-by-step'] as ResponseMode[]).map(
                (mode) => (
                  <button
                    key={mode}
                    onClick={() =>
                      updateConversation(conversationId, {
                        responseMode: mode,
                      })
                    }
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                      conversation.responseMode === mode
                        ? 'border-[#AFA9EC] bg-[#EEEDFE] text-[#534AB7]'
                        : 'border-border text-muted-foreground hover:border-border hover:text-foreground'
                    )}
                  >
                    {mode}
                  </button>
                )
              )}

              <select
                value={conversation.model}
                onChange={(e) =>
                  updateConversation(conversationId, { model: e.target.value })
                }
                className="ml-auto rounded-full border border-border bg-transparent px-2.5 py-0.5 text-xs text-muted-foreground outline-none"
              >
                {allModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#7F77DD] text-white disabled:opacity-40"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M2 10L10 6 2 2v3l6 1-6 1v3z" />
                </svg>
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-center text-xs text-muted-foreground">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  isStreaming,
}: {
  message: Message
  isStreaming?: boolean
}) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-xl px-4 py-2.5 text-sm',
          isUser
            ? 'bg-[#7F77DD] text-white'
            : 'border border-border bg-muted/30 text-foreground'
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {isStreaming && (
          <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-current opacity-70" />
        )}
        {!isUser && message.model && (
          <p className="mt-1.5 text-xs opacity-50">
            {message.model} · {message.responseMode ?? 'concise'}
          </p>
        )}
      </div>
    </div>
  )
}