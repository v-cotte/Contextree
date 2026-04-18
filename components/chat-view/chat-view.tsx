'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/store'
import { Message, ResponseMode, MODELS } from '@/types'

interface ChatViewProps {
  chatId: string
}

export default function ChatView({ chatId }: ChatViewProps) {
  const {
    chats,
    messages,
    branches,
    files,
    getBranchAncestors,
    addMessage,
    updateChat,
    toggleStarChat,
    deleteChat,
    selectBranch,
    selectChat,
  } = useStore()

  const chat = chats.find((c) => c.id === chatId)
  const chatMessages = messages[chatId] ?? []
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(chat?.name ?? '')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const ancestors = chat ? getBranchAncestors(chat.branchId) : []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, streamingContent])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  if (!chat) return null

  const handleNameSave = () => {
    if (nameValue.trim()) updateChat(chatId, { name: nameValue.trim() })
    setEditingName(false)
  }

  const handleDelete = () => {
    const branchId = chat.branchId
    deleteChat(chatId)
    selectChat(null)
    selectBranch(branchId)
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      chatId,
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    }

    addMessage(chatId, userMessage)
    setInput('')
    setLoading(true)
    setStreamingContent('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          userMessage: input.trim(),
          branches,
          filesByBranch: files,
          history: chatMessages,
          model: chat.model,
          responseMode: chat.responseMode,
          branchId: chat.branchId,
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
        chatId,
        role: 'assistant',
        content: fullContent,
        model: chat.model,
        responseMode: chat.responseMode,
        createdAt: new Date().toISOString(),
      }

      addMessage(chatId, assistantMessage)
      setStreamingContent('')

      if (chatMessages.length === 0) {
        const firstWords = input.trim().split(' ').slice(0, 5).join(' ')
        updateChat(chatId, { name: firstWords })
      }
    } catch (err: unknown) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        chatId,
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
        createdAt: new Date().toISOString(),
      }
      addMessage(chatId, errorMessage)
      setStreamingContent('')
    } finally {
      setLoading(false)
    }
  }

  const allModels = Object.values(MODELS).flat()
  const totalFiles = Object.values(files)
    .flat()
    .filter((f) => ancestors.some((a) => a.id === f.branchId)).length

  const estimatedTokens = Math.round(
    ancestors.reduce((sum, a) => sum + (a.contextMarkdown?.length ?? 0), 0) / 4
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '0 16px',
        height: '46px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        {editingName ? (
          <input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave()
              if (e.key === 'Escape') setEditingName(false)
            }}
            style={{
              flex: 1,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-emphasis)',
              borderRadius: '5px',
              padding: '3px 10px',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '15px',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        ) : (
          <span style={{
            flex: 1,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '15px',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {chat.name}
          </span>
        )}

        <button
          onClick={() => toggleStarChat(chatId)}
          title={chat.starred ? 'Unstar' : 'Star'}
          style={{
            width: '28px', height: '28px',
            borderRadius: '6px', border: 'none',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: chat.starred ? 'var(--accent)' : 'var(--text-faint)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14"
            fill={chat.starred ? 'var(--accent)' : 'none'}
            stroke={chat.starred ? 'var(--accent)' : 'currentColor'}
            strokeWidth="1.3">
            <path d="M7 1l1.8 3.6 4 .6-2.9 2.8.7 4L7 10l-3.6 1.9.7-4L1.2 5.2l4-.6z" />
          </svg>
        </button>

        <div style={{ width: '1px', height: '16px', background: 'var(--border-default)' }} />

        <button
          onClick={() => { setNameValue(chat.name); setEditingName(true) }}
          title="Rename"
          style={{
            width: '28px', height: '28px',
            borderRadius: '6px', border: 'none',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-faint)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-faint)' }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M2 10h2l6-6-2-2-6 6v2zM8.5 2.5l2 2" />
          </svg>
        </button>

        <button
          onClick={handleDelete}
          title="Delete"
          style={{
            width: '28px', height: '28px',
            borderRadius: '6px', border: 'none',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-faint)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--danger)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-faint)' }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M2 3.5h9M5 3.5V2.5h3v1M4.5 3.5l.5 7h3l.5-7" />
          </svg>
        </button>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        flexShrink: 0,
      }}>
        {ancestors.map((ancestor, i) => (
          <span key={ancestor.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => selectBranch(ancestor.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '10.5px',
                padding: '2px 8px',
                borderRadius: '20px',
                background: 'var(--accent-subtle)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent)',
                cursor: 'pointer',
              }}
            >
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 5h8M5 1l4 4-4 4" />
              </svg>
              {ancestor.name}
            </button>
            {i < ancestors.length - 1 && (
              <span style={{ color: 'var(--border-emphasis)', fontSize: '11px' }}>›</span>
            )}
          </span>
        ))}
        <span style={{
          marginLeft: 'auto',
          fontSize: '10.5px',
          color: 'var(--text-faint)',
          padding: '2px 8px',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)',
        }}>
          ~{estimatedTokens.toLocaleString()} tokens
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 12px' }}>
        {chatMessages.length === 0 && !streamingContent ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: '8px',
          }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              Start the conversation
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
              {ancestors.length > 0
                ? `Context from ${ancestors.map((a) => a.name).join(' › ')} is loaded`
                : 'No context — add context to the parent branch'}
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {chatMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {streamingContent && (
              <MessageBubble
                message={{
                  id: 'streaming',
                  chatId,
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

      <div style={{ flexShrink: 0, padding: '10px 16px 14px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            background: 'var(--bg-secondary)',
            overflow: 'hidden',
          }}>
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
              placeholder={`Ask anything — ${ancestors.map((a) => a.name).join(' + ')} context loaded…`}
              style={{
                width: '100%',
                resize: 'none',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '12px 14px 6px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                lineHeight: '1.5',
              }}
              rows={1}
              disabled={loading}
            />
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 10px 8px',
            }}>
              {(['concise', 'detailed', 'step-by-step'] as ResponseMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateChat(chatId, { responseMode: mode })}
                  style={{
                    fontSize: '10.5px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: chat.responseMode === mode
                      ? 'var(--accent-border)'
                      : 'var(--border-default)',
                    background: chat.responseMode === mode
                      ? 'var(--accent-subtle)'
                      : 'transparent',
                    color: chat.responseMode === mode
                      ? 'var(--accent)'
                      : 'var(--text-faint)',
                    cursor: 'pointer',
                  }}
                >
                  {mode}
                </button>
              ))}

              <select
                value={chat.model}
                onChange={(e) => updateChat(chatId, { model: e.target.value })}
                style={{
                  marginLeft: 'auto',
                  fontSize: '10.5px',
                  padding: '3px 8px',
                  borderRadius: '20px',
                  border: '1px solid var(--border-default)',
                  background: 'transparent',
                  color: 'var(--text-faint)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {allModels.map((m) => (
                  <option key={m.id} value={m.id} style={{ background: '#1A1A24' }}>
                    {m.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                style={{
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  border: 'none',
                  background: loading || !input.trim()
                    ? 'var(--border-emphasis)'
                    : 'linear-gradient(135deg, #7C70DC, #9B8FE8)',
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="white" strokeWidth="1.8">
                  <path d="M1 9.5L9.5 5.5 1 1.5v3l7 1-7 1v3z" />
                </svg>
              </button>
            </div>
          </div>
          <p style={{
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-faint)',
            marginTop: '6px',
          }}>
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
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div>
        <div style={{
          maxWidth: '85%',
          padding: '10px 14px',
          borderRadius: isUser ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
          fontSize: '13px',
          lineHeight: '1.65',
          background: isUser ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
          border: `1px solid ${isUser ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
          color: isUser ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}>
          <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
          {isStreaming && (
            <span style={{
              display: 'inline-block',
              width: '2px', height: '14px',
              background: 'var(--accent)',
              marginLeft: '2px',
              verticalAlign: 'middle',
              animation: 'pulse 1s infinite',
            }} />
          )}
        </div>
        {!isUser && message.model && (
          <p style={{
            fontSize: '10.5px',
            color: 'var(--text-faint)',
            marginTop: '4px',
            paddingLeft: '4px',
          }}>
            {message.model} · {message.responseMode ?? 'concise'}
          </p>
        )}
      </div>
    </div>
  )
}