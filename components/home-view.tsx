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
    return getBranchAncestors(branchId).map((b) => b.name).join(' › ')
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

  const Header = () => (
    <div style={{ marginBottom: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <img
          src="/logo.svg"
          alt=""
          style={{ height: '96px', width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.85 }}
        />
      </div>
      <h1 style={{
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        fontSize: '56px',
        color: 'var(--text-primary)',
        letterSpacing: '-0.03em',
        lineHeight: 1,
        marginBottom: '16px',
      }}>
        Contextree
      </h1>
      <p style={{
        fontSize: '15px',
        color: 'var(--text-secondary)',
        lineHeight: '1.7',
        maxWidth: '480px',
      }}>
        A hierarchical context manager for AI conversations. Build a tree of branches — every chat inherits all context from its ancestors.
      </p>
    </div>
  )

  if (!hasContent) {
    return (
      <div className="flex-1 overflow-y-auto" style={{ padding: '52px 48px' }}>
        <Header />

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '40px' }}>
          {[
            { num: '1', label: 'Create a branch with your context' },
            { num: '2', label: 'Nest branches for specific tasks' },
            { num: '3', label: 'Open chats and start working' },
          ].map((step, i) => (
            <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '110px' }}>
                <div style={{
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-emphasis)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', color: 'var(--text-muted)',
                }}>
                  {step.num}
                </div>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.5' }}>
                  {step.label}
                </span>
              </div>
              {i < 2 && (
                <div style={{ width: '32px', height: '1px', background: 'var(--border-subtle)', marginTop: '14px' }} />
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleCreateFirstBranch}
          style={{
            padding: '10px 28px',
            border: 'none',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7C70DC, #9B8FE8)',
            color: 'white',
            fontSize: '14px',
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
    <div className="flex-1 overflow-y-auto" style={{ padding: '52px 48px' }}>
      <div style={{ maxWidth: '720px' }}>
        <Header />

        {starredChats.length > 0 && (
          <div style={{ marginBottom: '36px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '10.5px', fontWeight: 500,
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="var(--accent)">
                <path d="M5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6L5 7l-2.4 1.2.5-2.6L1.2 3.8l2.6-.4z" />
              </svg>
              Starred
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '10px',
            }}>
              {starredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  style={{
                    textAlign: 'left',
                    padding: '14px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    background: 'var(--bg-elevated)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-emphasis)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="var(--accent)" style={{ marginBottom: '10px' }}>
                    <path d="M5.5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6L1.6 3.8l2.6-.4z" />
                  </svg>
                  <div style={{
                    fontSize: '14px', fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: '4px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {chat.name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {getBranchPath(chat.branchId)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '6px' }}>
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
              fontSize: '10.5px', fontWeight: 500,
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>
              Recent chats
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {recentChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '10px 12px',
                    border: '1px solid transparent',
                    borderRadius: '10px',
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
                    width: '32px', height: '32px',
                    borderRadius: '8px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 13 13" fill="none"
                      stroke="var(--text-muted)" strokeWidth="1.3">
                      <path d="M1 3A1.5 1.5 0 012.5 1.5h8A1.5 1.5 0 0112 3v5.5A1.5 1.5 0 0110.5 10H4L1 12V3z" />
                    </svg>
                  </div>
                  {chat.starred && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="var(--accent)" style={{ flexShrink: 0 }}>
                      <path d="M5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6L5 7l-2.4 1.2.5-2.6L1.2 3.8l2.6-.4z" />
                    </svg>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px', color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {chat.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                      {getBranchPath(chat.branchId)}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
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
