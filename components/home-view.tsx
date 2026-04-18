'use client'

import { useStore } from '@/store'

export default function HomeView() {
  const {
    branches,
    chats,
    getRecentChats,
    getStarredChats,
    selectBranch,
    selectChat,
    createBranch,
  } = useStore()

  const hasContent = branches.length > 0
  const recentChats = getRecentChats(8)
  const starredChats = getStarredChats()

  const handleCreateFirstBranch = () => {
    const branch = createBranch('My first branch', null)
    selectBranch(branch.id)
  }

  const getBranchPath = (branchId: string): string => {
    const { getBranchAncestors } = useStore.getState()
    return getBranchAncestors(branchId)
      .map((b) => b.name)
      .join(' › ')
  }

  const formatTime = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (!hasContent) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 px-8"
        style={{ background: 'chatvar(--bg-primary)' }}>
        <div style={{
          width: '52px', height: '52px',
          borderRadius: '14px',
          background: 'var(--accent-subtle)',
          border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
            stroke="var(--accent)" strokeWidth="1.4">
            <path d="M11 3v5M11 8l-4 6M11 8l4 6M7 14h8" />
          </svg>
        </div>

        <div className="text-center" style={{ maxWidth: '380px' }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '26px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: '10px',
          }}>
            Welcome to Contextree
          </h1>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.7',
          }}>
            Build a tree of context. Every chat inherits everything above it — so your AI always knows who you are and what you're working on.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {[
            { num: '1', label: 'Create a branch with your context' },
            { num: '2', label: 'Nest branches for specific tasks' },
            { num: '3', label: 'Open chats and start working' },
          ].map((step, i) => (
            <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '96px' }}>
                <div style={{
                  width: '26px', height: '26px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-emphasis)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', color: 'var(--text-muted)',
                }}>
                  {step.num}
                </div>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-faint)',
                  textAlign: 'center',
                  lineHeight: '1.5',
                }}>
                  {step.label}
                </span>
              </div>
              {i < 2 && (
                <div style={{
                  width: '28px', height: '1px',
                  background: 'var(--border-subtle)',
                  marginTop: '13px',
                }} />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleCreateFirstBranch}
          style={{
            padding: '9px 28px',
            border: 'none',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #7C70DC, #9B8FE8)',
            color: 'white',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Create your first branch
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '28px 28px' }}>
      <div style={{ maxWidth: '680px' }}>

        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: '22px',
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          marginBottom: '24px',
        }}>
          Home
        </h1>

        {starredChats.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '10px', fontWeight: 500,
              letterSpacing: '0.09em',
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="var(--accent)">
                <path d="M5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6L5 7l-2.4 1.2.5-2.6L1.2 3.8l2.6-.4z" />
              </svg>
              Starred
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '8px',
            }}>
              {starredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  style={{
                    textAlign: 'left',
                    padding: '12px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    background: 'var(--bg-elevated)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-emphasis)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="var(--accent)">
                      <path d="M5.5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6L1.6 3.8l2.6-.4z" />
                    </svg>
                  </div>
                  <div style={{
                    fontSize: '12.5px', fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: '3px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {chat.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                    {getBranchPath(chat.branchId)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '6px' }}>
                    {formatTime(chat.updatedAt)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {recentChats.length > 0 && (
          <div>
            <div style={{
              fontSize: '10px', fontWeight: 500,
              letterSpacing: '0.09em',
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}>
              Recent chats
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {recentChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '9px 12px',
                    border: '1px solid transparent',
                    borderRadius: '8px',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-elevated)'
                    e.currentTarget.style.borderColor = 'var(--border-subtle)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'transparent'
                  }}
                >
                  <div style={{
                    width: '28px', height: '28px',
                    borderRadius: '7px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
                      stroke="var(--text-muted)" strokeWidth="1.3">
                      <path d="M1 3A1.5 1.5 0 012.5 1.5h8A1.5 1.5 0 0112 3v5.5A1.5 1.5 0 0110.5 10H4L1 12V3z" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '12.5px',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {chat.starred && (
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="var(--accent)"
                          style={{ marginRight: '5px', verticalAlign: 'middle' }}>
                          <path d="M5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6L5 7l-2.4 1.2.5-2.6L1.2 3.8l2.6-.4z" />
                        </svg>
                      )}
                      {chat.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                      {getBranchPath(chat.branchId)}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                    {formatTime(chat.updatedAt)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}