'use client'

import { useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { useStore } from '@/store'
import { TreeNode } from '@/types'
import ApiKeysDialog from '@/components/api-keys-dialog'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'


interface SidebarProps {
  user: User
}

export default function Sidebar({ user }: SidebarProps) {
  const [apiKeysOpen, setApiKeysOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const isResizing = useRef(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true
    const startX = e.clientX
    const startWidth = sidebarWidth

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const newWidth = Math.min(400, Math.max(180, startWidth + e.clientX - startX))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      isResizing.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const {
    getTreeNodes,
    createBranch,
    selectBranch,
    selectChat,
    selectedBranchId,
    selectedChatId,
  } = useStore()

  const router = useRouter()
  const nodes = getTreeNodes()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const handleNewBranch = () => {
    const branch = createBranch('New branch', null)
    selectBranch(branch.id)
  }

  return (
    <aside style={{
      width: `${sidebarWidth}px`,
      flexShrink: 0,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        padding: '14px 12px 10px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
      }}>
        <button
          onClick={() => { selectBranch(null); selectChat(null) }}
          style={{
            flex: 1,
            textAlign: 'left',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '17px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            Contextree
          </span>
        </button>
        <button
          onClick={handleNewBranch}
          title="New branch"
          style={{
            width: '26px', height: '26px',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-faint)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-elevated)'
            e.currentTarget.style.color = 'var(--accent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-faint)'
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6.5 1v11M1 6.5h11" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {nodes.length === 0 ? (
          <p style={{
            padding: '16px 12px',
            fontSize: '12px',
            color: 'var(--text-faint)',
            textAlign: 'center',
            lineHeight: '1.6',
          }}>
            No branches yet
          </p>
        ) : (
          nodes.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              depth={0}
              selectedBranchId={selectedBranchId}
              selectedChatId={selectedChatId}
              onSelectBranch={selectBranch}
              onSelectChat={selectChat}
            />
          ))
        )}
      </div>

      <div style={{
        padding: '10px 10px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0,
        position: 'relative',
      }}>
        <button
          onClick={handleNewBranch}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 10px',
            borderRadius: '7px',
            border: '1px dashed var(--border-default)',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '11.5px',
            color: 'var(--text-faint)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.color = 'var(--accent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)'
            e.currentTarget.style.color = 'var(--text-faint)'
          }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5.5 1v9M1 5.5h9" />
          </svg>
          New branch
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setApiKeysOpen(true)}
            title="API keys"
            style={{
              width: '30px', height: '30px',
              borderRadius: '7px',
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-faint)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-elevated)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-faint)'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="6.5" cy="6.5" r="5" />
              <circle cx="6.5" cy="6.5" r="1.5" />
              <path d="M6.5 1.5v1.5M6.5 9.5v1.5M1.5 6.5h1.5M9.5 6.5h1.5" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          title={user.email}
          style={{
            width: '30px', height: '30px',
            borderRadius: '50%',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {user.email?.[0].toUpperCase()}
        </button>

        {userMenuOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: '52px',
              left: '10px',
              right: '10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: '10px',
              padding: '6px',
              zIndex: 50,
            }}
          >
            <div style={{
              padding: '6px 10px 8px',
              fontSize: '11px',
              color: 'var(--text-faint)',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '4px',
            }}>
              {user.email}
            </div>
            <button
              onClick={() => { setApiKeysOpen(true); setUserMenuOpen(false) }}
              style={{
                width: '100%', textAlign: 'left',
                padding: '6px 10px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              API keys
            </button>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%', textAlign: 'left',
                padding: '6px 10px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                fontSize: '12.5px',
                color: 'var(--danger)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '4px',
          height: '100%',
          cursor: 'col-resize',
          zIndex: 10,
          background: 'transparent',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      />

      <ApiKeysDialog open={apiKeysOpen} onClose={() => setApiKeysOpen(false)} />
    </aside>
  )
}

interface TreeItemProps {
  node: TreeNode
  depth: number
  selectedBranchId: string | null
  selectedChatId: string | null
  onSelectBranch: (id: string) => void
  onSelectChat: (id: string) => void
}

function TreeItem({
  node,
  depth,
  selectedBranchId,
  selectedChatId,
  onSelectBranch,
  onSelectChat,
}: TreeItemProps) {
  const [expanded, setExpanded] = useState(true)
  const isBranch = node.type === 'branch'
  const isSelected = isBranch
    ? selectedBranchId === node.id
    : selectedChatId === node.id
  const hasChildren = node.children.length > 0

  const handleClick = () => {
    if (isBranch) {
      onSelectBranch(node.id)
      if (!expanded) setExpanded(true)
    } else {
      onSelectChat(node.id)
    }
  }

  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: `4px 8px 4px ${8 + Math.min(depth, 5) * 16}px`,
    cursor: 'pointer',
    borderRadius: 0,
    background: isSelected ? 'var(--bg-elevated)' : 'transparent',
    borderLeft: isSelected && !isBranch ? '2px solid var(--accent)' : '2px solid transparent',
  }

  return (
    <div>
      <div
        style={baseStyle}
        onClick={handleClick}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'transparent'
        }}
      >
        {isBranch ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            style={{
              width: '16px', height: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-faint)',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
              flexShrink: 0,
              padding: 0,
            }}
          >
            {hasChildren ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M3 2l4 3-4 3V2z" />
              </svg>
            ) : (
              <span style={{ width: '10px' }} />
            )}
          </button>
        ) : (
          <span style={{ width: '16px', flexShrink: 0 }} />
        )}

        {isBranch ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            stroke={isSelected ? 'var(--accent)' : 'var(--text-faint)'}
            strokeWidth="1.4"
            style={{ flexShrink: 0 }}>
            <rect x="1" y="2" width="12" height="10" rx="2" />
            <path d="M1 5h12" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
            stroke={isSelected ? 'var(--accent)' : node.starred ? 'var(--accent)' : 'var(--text-faint)'}
            strokeWidth="1.3"
            style={{ flexShrink: 0 }}>
            <path d="M1 3A1.5 1.5 0 012.5 1.5h8A1.5 1.5 0 0112 3v5.5A1.5 1.5 0 0110.5 10H4L1 12V3z" />
          </svg>
        )}

        <span style={{
          flex: 1,
          fontSize: '12.5px',
          color: isSelected
            ? 'var(--text-primary)'
            : 'var(--text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontWeight: isSelected ? 500 : 400,
        }}>
          {node.starred && !isBranch && (
            <svg width="9" height="9" viewBox="0 0 10 10" fill="var(--accent)"
              style={{ marginRight: '4px', verticalAlign: 'middle' }}>
              <path d="M5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6L5 7l-2.4 1.2.5-2.6L1.2 3.8l2.6-.4z" />
            </svg>
          )}
          {node.name}
        </span>
      </div>

      {isBranch && expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedBranchId={selectedBranchId}
              selectedChatId={selectedChatId}
              onSelectBranch={onSelectBranch}
              onSelectChat={onSelectChat}
            />
          ))}
        </div>
      )}
    </div>
  )
}