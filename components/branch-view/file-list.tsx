'use client'

import { useRef, useState } from 'react'
import { useStore } from '@/store'
import { FileAttachment } from '@/types'

interface FileListProps {
  branchId: string
  files: FileAttachment[]
}

export default function FileList({ branchId, files }: FileListProps) {
  const { addFile, removeFile } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    try {
      let text = ''
      if (file.type === 'text/plain' || file.name.endsWith('.md')) {
        text = await file.text()
      } else if (file.type === 'application/pdf') {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/extract-text', { method: 'POST', body: formData })
        const data = await res.json()
        text = data.text ?? ''
      } else {
        text = await file.text()
      }

      addFile(branchId, {
        id: crypto.randomUUID(),
        branchId,
        name: file.name,
        type: file.type,
        extractedText: text,
        createdAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {files.map((file) => (
            <div
              key={file.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '4px 10px',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                background: 'var(--bg-elevated)',
                fontSize: '11.5px',
                color: 'var(--text-muted)',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"
                stroke="currentColor" strokeWidth="1.4">
                <rect x="1.5" y="0.5" width="8" height="10" rx="1" />
                <path d="M3 3.5h5M3 5.5h5M3 7.5h3" />
              </svg>
              {file.name}
              <button
                onClick={() => removeFile(branchId, file.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-faint)',
                  padding: '0 0 0 2px',
                  fontSize: '14px',
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,.pdf,.docx"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px',
          border: '1px dashed var(--border-default)',
          borderRadius: '7px',
          background: 'transparent',
          fontSize: '12px',
          color: 'var(--text-faint)',
          cursor: uploading ? 'not-allowed' : 'pointer',
          width: 'fit-content',
        }}
        onMouseEnter={(e) => {
          if (!uploading) {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.color = 'var(--accent)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-default)'
          e.currentTarget.style.color = 'var(--text-faint)'
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"
          stroke="currentColor" strokeWidth="1.5">
          <path d="M5.5 1v7M2 5l3.5-3.5L9 5" />
          <path d="M1 9.5h9" />
        </svg>
        {uploading ? 'Uploading...' : 'Upload file'}
      </button>
    </div>
  )
}