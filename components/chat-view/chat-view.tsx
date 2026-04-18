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
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    setMenuOpen(false)
    setModelOpen(false)
    setConfirmingDelete(false)
  }, [chatId])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setConfirmingDelete(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '0 24px',
        height: '60px',
        flexShrink: 0,
      }}>

        {/* Left: name button (dropdown trigger) or rename input */}
        <div ref={menuRef} style={{ position: 'relative' }}>
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
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-emphasis)',
                borderRadius: '8px',
                padding: '5px 12px',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '18px',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '320px',
              }}
            />
          ) : (
            <button
              onClick={() => { setMenuOpen((o) => !o); setConfirmingDelete(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: menuOpen ? 'var(--bg-elevated)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '5px 10px',
                cursor: 'pointer',
                maxWidth: '480px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
              onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.background = 'transparent' }}
            >
              {chat.starred && (
                <svg width="11" height="11" viewBox="0 0 10 10" fill="var(--accent)" style={{ flexShrink: 0 }}>
                  <path d="M5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6L5 7l-2.4 1.2.5-2.6L1.2 3.8l2.6-.4z" />
                </svg>
              )}
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: '18px',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {chat.name}
              </span>
              <svg width="13" height="13" viewBox="0 0 10 10" fill="none" stroke="var(--text-faint)" strokeWidth="1.5"
                style={{ flexShrink: 0, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                <path d="M2 3.5l3 3 3-3" />
              </svg>
            </button>
          )}

          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: '14px',
                padding: '6px',
                zIndex: 50,
                minWidth: '200px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
              }}
            >
              <button
                onClick={() => { toggleStarChat(chatId); setMenuOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', textAlign: 'left',
                  padding: '9px 14px', borderRadius: '8px',
                  border: 'none', background: 'transparent',
                  fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <svg width="15" height="15" viewBox="0 0 14 14"
                  fill={chat.starred ? 'var(--accent)' : 'none'}
                  stroke={chat.starred ? 'var(--accent)' : 'currentColor'}
                  strokeWidth="1.3">
                  <path d="M7 1l1.8 3.6 4 .6-2.9 2.8.7 4L7 10l-3.6 1.9.7-4L1.2 5.2l4-.6z" />
                </svg>
                {chat.starred ? 'Unstar' : 'Star'}
              </button>

              <button
                onClick={() => { setNameValue(chat.name); setEditingName(true); setMenuOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', textAlign: 'left',
                  padding: '9px 14px', borderRadius: '8px',
                  border: 'none', background: 'transparent',
                  fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <svg width="15" height="15" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M2 10h2l6-6-2-2-6 6v2zM8.5 2.5l2 2" />
                </svg>
                Rename
              </button>

              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '5px 0' }} />

              {confirmingDelete ? (
                <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Delete this chat?</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={handleDelete}
                      style={{
                        flex: 1, padding: '6px 0', borderRadius: '7px',
                        border: 'none', background: 'var(--danger)', color: '#fff',
                        fontSize: '13px', cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      style={{
                        flex: 1, padding: '6px 0', borderRadius: '7px',
                        border: '1px solid var(--border-default)', background: 'transparent',
                        color: 'var(--text-faint)', fontSize: '13px', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', textAlign: 'left',
                    padding: '9px 14px', borderRadius: '8px',
                    border: 'none', background: 'transparent',
                    fontSize: '14px', color: 'var(--danger)', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <svg width="15" height="15" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M2 3.5h9M5 3.5V2.5h3v1M4.5 3.5l.5 7h3l.5-7" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: breadcrumb path */}
        {ancestors.length > 0 && (
          <div style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: '5px',
            flexShrink: 0,
          }}>
            {ancestors.map((ancestor, i) => (
              <span key={ancestor.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <button
                  onClick={() => selectBranch(ancestor.id)}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    fontSize: '12.5px', color: 'var(--text-faint)',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)' }}
                >
                  {ancestor.name}
                </button>
                {i < ancestors.length - 1 && (
                  <span style={{ color: 'var(--text-faint)', fontSize: '12px' }}>›</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 12px' }}>
        {chatMessages.length === 0 && !streamingContent ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: '8px',
          }}>
            <p style={{ fontSize: '28px', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', letterSpacing: '-0.01em' }}>
              Start the conversation
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-faint)' }}>
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

      <div style={{ flexShrink: 0, padding: '14px 24px 20px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{
            border: '1px solid var(--border-default)',
            borderRadius: '16px',
            background: 'var(--bg-secondary)',
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
                padding: '16px 18px 8px',
                fontSize: '15px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                lineHeight: '1.6',
                borderRadius: '16px 16px 0 0',
              }}
              rows={1}
              disabled={loading}
            />
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px 12px',
            }}>
              {(['concise', 'detailed', 'step-by-step'] as ResponseMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateChat(chatId, { responseMode: mode })}
                  style={{
                    fontSize: '12px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: 'none',
                    background: chat.responseMode === mode
                      ? 'var(--bg-elevated)'
                      : 'transparent',
                    color: chat.responseMode === mode
                      ? 'var(--text-primary)'
                      : 'var(--text-faint)',
                    fontWeight: chat.responseMode === mode ? 500 : 400,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (chat.responseMode !== mode) e.currentTarget.style.color = 'var(--text-muted)'
                  }}
                  onMouseLeave={(e) => {
                    if (chat.responseMode !== mode) e.currentTarget.style.color = 'var(--text-faint)'
                  }}
                >
                  {mode}
                </button>
              ))}

              <div style={{ marginLeft: 'auto', position: 'relative' }}>
                <button
                  onClick={() => setModelOpen((o) => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-default)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {allModels.find((m) => m.id === chat.model)?.label ?? chat.model}
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{ transform: modelOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                    <path d="M2 3.5l3 3 3-3" />
                  </svg>
                </button>

                {modelOpen && (
                  <div
                    onMouseLeave={() => setModelOpen(false)}
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 6px)',
                      right: 0,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '12px',
                      padding: '5px',
                      zIndex: 50,
                      minWidth: '170px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                  >
                    {allModels.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { updateChat(chatId, { model: m.id }); setModelOpen(false) }}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '7px 12px',
                          borderRadius: '7px',
                          border: 'none',
                          background: m.id === chat.model ? 'var(--accent-subtle)' : 'transparent',
                          color: m.id === chat.model ? 'var(--accent)' : 'var(--text-secondary)',
                          fontSize: '13px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          if (m.id !== chat.model) e.currentTarget.style.background = 'var(--bg-hover)'
                        }}
                        onMouseLeave={(e) => {
                          if (m.id !== chat.model) e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                style={{
                  width: '34px', height: '34px',
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
                <svg width="13" height="13" viewBox="0 0 11 11" fill="none" stroke="white" strokeWidth="1.8">
                  <path d="M1 9.5L9.5 5.5 1 1.5v3l7 1-7 1v3z" />
                </svg>
              </button>
            </div>
          </div>
          <p style={{
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-faint)',
            marginTop: '8px',
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