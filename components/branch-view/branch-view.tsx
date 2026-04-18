'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import ContextEditor from '@/components/branch-view/context-editor'
import FileList from '@/components/branch-view/file-list'
import ChatsGrid from '@/components/branch-view/chats-grid'

interface BranchViewProps {
  branchId: string
}

export default function BranchView({ branchId }: BranchViewProps) {
  const {
    branches,
    chats,
    files,
    getBranchAncestors,
    createBranch,
    createChat,
    selectBranch,
    selectChat,
    updateBranch,
    deleteBranch,
  } = useStore()

  const branch = branches.find((b) => b.id === branchId)
  const ancestors = getBranchAncestors(branchId)
  const parentAncestors = ancestors.slice(0, -1)
  const branchChats = chats.filter((c) => c.branchId === branchId)
  const branchFiles = files[branchId] ?? []
  const childBranches = branches.filter((b) => b.parentId === branchId)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(branch?.name ?? '')

  if (!branch) return null

  const handleNameSave = () => {
    if (nameValue.trim()) updateBranch(branchId, { name: nameValue.trim() })
    setEditingName(false)
  }

  const handleNewSubBranch = () => {
    const sub = createBranch('New branch', branchId)
    selectBranch(sub.id)
  }

  const handleNewChat = () => {
    const chat = createChat('New chat', branchId)
    selectChat(chat.id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '0 20px',
        height: '46px',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '12px', color: 'var(--text-faint)',
          flex: 1, minWidth: 0,
        }}>
          {parentAncestors.map((ancestor) => (
            <span key={ancestor.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <button
                onClick={() => selectBranch(ancestor.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '12px', color: 'var(--text-faint)',
                  padding: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)' }}
              >
                {ancestor.name}
              </button>
              <span style={{ color: 'var(--border-emphasis)' }}>›</span>
            </span>
          ))}
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
                borderRadius: '5px',
                padding: '2px 8px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          ) : (
            <button
              onClick={() => { setNameValue(branch.name); setEditingName(true) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500,
                color: 'var(--text-primary)',
                padding: 0,
              }}
            >
              {branch.name}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {ancestors.length > 1 && (
            <span style={{
              fontSize: '10.5px',
              padding: '2px 8px',
              borderRadius: '20px',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent)',
            }}>
              {ancestors.length - 1} inherited {ancestors.length - 1 === 1 ? 'layer' : 'layers'}
            </span>
          )}
          <button
            onClick={handleNewSubBranch}
            style={{
              padding: '4px 12px',
              border: '1px solid var(--border-default)',
              borderRadius: '7px',
              background: 'transparent',
              fontSize: '11.5px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-emphasis)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            + Sub-branch
          </button>
          <button
            onClick={handleNewChat}
            style={{
              padding: '4px 12px',
              border: 'none',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #7C70DC, #9B8FE8)',
              fontSize: '11.5px',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            + New chat
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px' }}>
        <div style={{ maxWidth: '680px' }}>

          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '28px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: '20px',
            lineHeight: 1.2,
          }}>
            {branch.name}
          </h1>

        {parentAncestors.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '10px', fontWeight: 500,
              letterSpacing: '0.09em',
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Inherited context
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {parentAncestors.slice(-4).map((ancestor, i, arr) => (
                <div
                  key={ancestor.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--accent-subtle)',
                    border: '1px solid var(--accent-border)',
                    opacity: i === 0 && arr.length === 3 ? 0.5 : 1,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"
                    stroke="var(--accent)" strokeWidth="1.5">
                    <path d="M1 5.5h9M5.5 1l4.5 4.5-4.5 4.5" />
                  </svg>
                  <button
                    onClick={() => selectBranch(ancestor.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '12.5px', fontWeight: 500,
                      color: 'var(--accent)', padding: 0,
                    }}
                  >
                    {i === 0 && arr.length === 4 && parentAncestors.length > 4
                      ? `+${parentAncestors.length - 3} more layers`
                      : ancestor.name}
                  </button>
                  {ancestor.contextMarkdown && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: '11px',
                      color: 'var(--text-faint)',
                    }}>
                      {ancestor.contextMarkdown.length} chars
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '10px', fontWeight: 500,
              letterSpacing: '0.09em',
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Context
            </div>
            <ContextEditor
              branchId={branchId}
              value={branch.contextMarkdown}
              onChange={(val) => updateBranch(branchId, { contextMarkdown: val })}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '10px', fontWeight: 500,
              letterSpacing: '0.09em',
              color: 'var(--text-faint)',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Files
            </div>
            <FileList branchId={branchId} files={branchFiles} />
          </div>

          {(childBranches.length > 0 || branchChats.length > 0) && (
            <>
              <div style={{
                height: '1px',
                background: 'var(--border-subtle)',
                margin: '20px 0',
              }} />
              <ChatsGrid
                childBranches={childBranches}
                chats={branchChats}
                onSelectBranch={selectBranch}
                onSelectChat={selectChat}
                onNewChat={handleNewChat}
                onNewSubBranch={handleNewSubBranch}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}