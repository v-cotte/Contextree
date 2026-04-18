'use client'

import { Branch, Chat } from '@/types'

interface ChatsGridProps {
  childBranches: Branch[]
  chats: Chat[]
  onSelectBranch: (id: string) => void
  onSelectChat: (id: string) => void
  onNewChat: () => void
  onNewSubBranch: () => void
}

export default function ChatsGrid({
  childBranches,
  chats,
  onSelectBranch,
  onSelectChat,
  onNewChat,
  onNewSubBranch,
}: ChatsGridProps) {
  const cardStyle: React.CSSProperties = {
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    padding: '12px',
    cursor: 'pointer',
    background: 'var(--bg-elevated)',
    textAlign: 'left',
    width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {childBranches.length > 0 && (
        <div>
          <div style={{
            fontSize: '10px', fontWeight: 500,
            letterSpacing: '0.09em',
            color: 'var(--text-faint)',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            Sub-branches
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '8px',
          }}>
            {childBranches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => onSelectBranch(branch.id)}
                style={cardStyle}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"
                  stroke="var(--accent)" strokeWidth="1.4"
                  style={{ marginBottom: '8px', display: 'block' }}>
                  <rect x="1" y="2" width="12" height="10" rx="2" />
                  <path d="M1 5h12" />
                </svg>
                <div style={{
                  fontSize: '12.5px', fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '3px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {branch.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                  {branch.contextMarkdown ? 'Has context' : 'No context yet'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {chats.length > 0 && (
        <div>
          <div style={{
            fontSize: '10px', fontWeight: 500,
            letterSpacing: '0.09em',
            color: 'var(--text-faint)',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            Chats
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '8px',
          }}>
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                style={cardStyle}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-emphasis)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
                    stroke={chat.starred ? 'var(--accent)' : 'var(--text-faint)'}
                    strokeWidth="1.3">
                    <path d="M1 3A1.5 1.5 0 012.5 1.5h8A1.5 1.5 0 0112 3v5.5A1.5 1.5 0 0110.5 10H4L1 12V3z" />
                  </svg>
                  {chat.starred && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="var(--accent)">
                      <path d="M5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6L5 7l-2.4 1.2.5-2.6L1.2 3.8l2.6-.4z" />
                    </svg>
                  )}
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
                  {chat.model}
                </div>
              </button>
            ))}
            <button
              onClick={onNewChat}
              style={{
                border: '1px dashed var(--border-default)',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                background: 'transparent',
                minHeight: '72px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
                stroke="var(--text-faint)" strokeWidth="1.4">
                <path d="M6.5 1v11M1 6.5h11" />
              </svg>
              <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                New chat
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}