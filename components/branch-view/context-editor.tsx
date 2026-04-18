'use client'

import { useState } from 'react'

interface ContextEditorProps {
  branchId: string
  value: string
  onChange: (value: string) => void
}

const PLACEHOLDER = `## Role
Describe your role and responsibilities...

## Team
Who you work with, who your manager is...

## Tools
What tools and stack you use...

## How we work
Team processes, communication style...`

export default function ContextEditor({ branchId, value, onChange }: ContextEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const handleEdit = () => {
    setDraft(value)
    setIsEditing(true)
  }

  const handleSave = () => {
    onChange(draft)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraft(value)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div>
        <div style={{
          border: '1px solid var(--border-emphasis)',
          borderRadius: '10px',
          overflow: 'hidden',
          background: 'var(--bg-secondary)',
        }}>
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={PLACEHOLDER}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'var(--font-mono)',
              fontSize: '12.5px',
              lineHeight: '1.7',
              color: 'var(--text-secondary)',
            }}
          />
          <div style={{
            display: 'flex', gap: '6px',
            padding: '8px 12px',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <button
              onClick={handleSave}
              style={{
                padding: '5px 14px',
                border: 'none',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #7C70DC, #9B8FE8)',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: '5px 14px',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!value) {
    return (
      <button
        onClick={handleEdit}
        style={{
          width: '100%',
          padding: '20px',
          border: '1px dashed var(--border-default)',
          borderRadius: '10px',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: '12px',
          color: 'var(--text-faint)',
          textAlign: 'center',
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
        + Add context — describe your role, team, tools, goals...
      </button>
    )
  }

  return (
    <div
      onClick={handleEdit}
      style={{
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '14px 16px',
        background: 'var(--bg-secondary)',
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-emphasis)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
      }}
    >
      <pre style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        lineHeight: '1.7',
        color: 'var(--text-muted)',
        whiteSpace: 'pre-wrap',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 6,
        WebkitBoxOrient: 'vertical',
      }}>
        {value}
      </pre>
      <span style={{
        position: 'absolute',
        top: '10px', right: '12px',
        fontSize: '11px',
        color: 'var(--accent)',
        opacity: 0,
      }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        edit
      </span>
    </div>
  )
}