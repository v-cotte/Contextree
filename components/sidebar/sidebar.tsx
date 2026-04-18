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
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [isOpen, setIsOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const isResizing = useRef(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true
    const startX = e.clientX
    const startWidth = sidebarWidth
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      setSidebarWidth(Math.min(400, Math.max(200, startWidth + e.clientX - startX)))
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
    createChat,
    selectBranch,
    selectChat,
    selectedBranchId,
    selectedChatId,
    branches,
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

  const handleNewChat = () => {
    const branchId = selectedBranchId ?? branches[0]?.id
    if (branchId) {
      const chat = createChat('New chat', branchId)
      selectChat(chat.id)
    } else {
      const branch = createBranch('New branch', null)
      const chat = createChat('New chat', branch.id)
      selectChat(chat.id)
    }
  }

  const filterNodes = (nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query.trim()) return nodes
    const q = query.toLowerCase()
    const filterNode = (node: TreeNode): TreeNode | null => {
      const matches = node.name.toLowerCase().includes(q)
      const filteredChildren = node.children.map(filterNode).filter(Boolean) as TreeNode[]
      if (matches || filteredChildren.length > 0) return { ...node, children: filteredChildren }
      return null
    }
    return nodes.map(filterNode).filter(Boolean) as TreeNode[]
  }

  const visibleNodes = filterNodes(nodes, searchQuery)

  // Collapsed sidebar — just toggle button
  if (!isOpen) {
    return (
      <aside style={{
        width: '52px',
        flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        padding: '14px 0',
      }}>
        <button
          onClick={() => setIsOpen(true)}
          title="Open sidebar"
          style={{
            width: '32px', height: '32px',
            borderRadius: '8px', border: 'none',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-faint)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-faint)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="1" y="1" width="14" height="14" rx="3" />
            <path d="M5 1v14" />
          </svg>
        </button>
      </aside>
    )
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

      {/* Header */}
      <div style={{
        padding: '14px 12px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <button
          onClick={() => { selectBranch(null); selectChat(null) }}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '22px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            Contextree
          </span>
        </button>

        <button
          onClick={() => setIsOpen(false)}
          title="Close sidebar"
          style={{
            width: '28px', height: '28px',
            borderRadius: '7px', border: 'none',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-faint)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-faint)' }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="1" y="1" width="14" height="14" rx="3" />
            <path d="M5 1v14" />
          </svg>
        </button>
      </div>

      {/* Actions */}
      <div style={{ padding: '4px 10px 8px', display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
        <button
          onClick={handleNewBranch}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px',
            borderRadius: '9px', border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--accent)',
            fontSize: '14px', fontWeight: 500,
            textAlign: 'left',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 2v12M2 8h12" />
          </svg>
          New branch
        </button>

        <button
          onClick={handleNewChat}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px',
            borderRadius: '9px', border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="15" height="15" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M1 3A1.5 1.5 0 012.5 1.5h8A1.5 1.5 0 0112 3v5.5A1.5 1.5 0 0110.5 10H4L1 12V3z" />
          </svg>
          New chat
        </button>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '7px 10px',
          borderRadius: '9px',
          border: `1px solid ${searchFocused ? 'var(--border-emphasis)' : 'transparent'}`,
          background: searchFocused || searchQuery ? 'var(--bg-elevated)' : 'transparent',
          cursor: 'text',
        }}
          onClick={() => (document.getElementById('sidebar-search') as HTMLInputElement)?.focus()}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--text-faint)" strokeWidth="1.4">
            <circle cx="6" cy="6" r="4.5" />
            <path d="M9.5 9.5l3 3" />
          </svg>
          <input
            id="sidebar-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: '14px', color: 'var(--text-secondary)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 0, lineHeight: 1 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Your tree */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>
        <div style={{
          padding: '10px 14px 6px',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
        }}>
          Your tree
        </div>

        {visibleNodes.length === 0 ? (
          <p style={{
            padding: '12px 14px',
            fontSize: '13px',
            color: 'var(--text-muted)',
            lineHeight: '1.6',
          }}>
            {searchQuery ? 'No results' : 'No branches yet'}
          </p>
        ) : (
          visibleNodes.map((node) => (
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

      {/* Bottom */}
      <div style={{
        padding: '10px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0,
        position: 'relative',
      }}>
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
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-faint)' }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="6.5" cy="6.5" r="5" />
            <circle cx="6.5" cy="6.5" r="1.5" />
            <path d="M6.5 1.5v1.5M6.5 9.5v1.5M1.5 6.5h1.5M9.5 6.5h1.5" />
          </svg>
        </button>

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
            fontSize: '12px', fontWeight: 500,
          }}
        >
          {user.email?.[0].toUpperCase()}
        </button>

        {userMenuOpen && (
          <div style={{
            position: 'absolute',
            bottom: '52px', left: '10px', right: '10px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            padding: '6px',
            zIndex: 50,
          }}>
            <div style={{
              padding: '6px 10px 8px',
              fontSize: '11px', color: 'var(--text-faint)',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '4px',
            }}>
              {user.email}
            </div>
            <button
              onClick={() => { setApiKeysOpen(true); setUserMenuOpen(false) }}
              style={{
                width: '100%', textAlign: 'left',
                padding: '6px 10px', borderRadius: '6px',
                border: 'none', background: 'transparent',
                fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer',
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
                padding: '6px 10px', borderRadius: '6px',
                border: 'none', background: 'transparent',
                fontSize: '13px', color: 'var(--danger)', cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute', top: 0, right: 0,
          width: '4px', height: '100%',
          cursor: 'col-resize', zIndex: 10, background: 'transparent',
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

function TreeItem({ node, depth, selectedBranchId, selectedChatId, onSelectBranch, onSelectChat }: TreeItemProps) {
  const [expanded, setExpanded] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { deleteBranch, deleteChat } = useStore()
  const isBranch = node.type === 'branch'
  const isSelected = isBranch ? selectedBranchId === node.id : selectedChatId === node.id
  const hasChildren = node.children.length > 0

  const handleClick = () => {
    if (isBranch) { onSelectBranch(node.id); if (!expanded) setExpanded(true) }
    else onSelectChat(node.id)
  }

  const baseStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: `6px 8px 6px ${8 + Math.min(depth, 5) * 16}px`,
    cursor: 'pointer', borderRadius: 0,
    background: isSelected ? 'var(--bg-elevated)' : 'transparent',
    borderLeft: isSelected && !isBranch ? '2px solid var(--accent)' : '2px solid transparent',
  }

  return (
    <div>
      <div
        style={baseStyle}
        onClick={handleClick}
        onMouseEnter={(e) => { setHovered(true); if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={(e) => { setHovered(false); setConfirmDelete(false); if (!isSelected) e.currentTarget.style.background = 'transparent' }}
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
              transition: 'transform 0.15s', flexShrink: 0, padding: 0,
            }}
          >
            {hasChildren
              ? <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M3 2l4 3-4 3V2z" /></svg>
              : <span style={{ width: '10px' }} />}
          </button>
        ) : (
          <span style={{ width: '16px', flexShrink: 0 }} />
        )}

        {isBranch ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            stroke={isSelected ? 'var(--accent)' : 'var(--text-faint)'}
            strokeWidth="1.4" style={{ flexShrink: 0 }}>
            <rect x="1" y="2" width="12" height="10" rx="2" />
            <path d="M1 5h12" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
            stroke={isSelected ? 'var(--accent)' : node.starred ? 'var(--accent)' : 'var(--text-faint)'}
            strokeWidth="1.3" style={{ flexShrink: 0 }}>
            <path d="M1 3A1.5 1.5 0 012.5 1.5h8A1.5 1.5 0 0112 3v5.5A1.5 1.5 0 0110.5 10H4L1 12V3z" />
          </svg>
        )}

        {node.starred && !isBranch && (
          <svg width="9" height="9" viewBox="0 0 10 10" fill="var(--accent)" style={{ flexShrink: 0 }}>
            <path d="M5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6L5 7l-2.4 1.2.5-2.6L1.2 3.8l2.6-.4z" />
          </svg>
        )}

        <span style={{
          flex: 1, fontSize: '13.5px',
          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontWeight: isSelected ? 500 : 400,
        }}>
          {node.name}
        </span>

        {(hovered || confirmDelete) && (
          confirmDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { if (isBranch) deleteBranch(node.id); else deleteChat(node.chatId!) }}
                style={{ height: '18px', padding: '0 6px', borderRadius: '4px', border: 'none', background: 'var(--danger)', color: '#fff', fontSize: '10.5px', cursor: 'pointer', flexShrink: 0 }}
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ height: '18px', width: '18px', borderRadius: '4px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-faint)', fontSize: '11px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
              style={{ width: '18px', height: '18px', flexShrink: 0, borderRadius: '4px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-faint)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)' }}
              title={isBranch ? 'Delete branch' : 'Delete chat'}
            >
              <svg width="11" height="11" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M2 3.5h9M5 3.5V2.5h3v1M4.5 3.5l.5 7h3l.5-7" />
              </svg>
            </button>
          )
        )}
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
