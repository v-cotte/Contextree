'use client'

import { useRef, useState } from 'react'
import { useStore } from '@/store'
import { FileAttachment } from '@/types'

interface FileListProps {
  projectId: string
  files: FileAttachment[]
}

export default function FileList({ projectId, files }: FileListProps) {
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
        const res = await fetch('/api/extract-text', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        text = data.text ?? ''
      } else {
        text = await file.text()
      }

      addFile(projectId, {
        id: crypto.randomUUID(),
        projectId,
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
    <div className="space-y-2">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="group flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-muted-foreground"
              >
                <rect x="2" y="1" width="8" height="10" rx="1" />
                <path d="M4 4h4M4 6h4M4 8h2" />
              </svg>
              <span className="text-xs text-muted-foreground">{file.name}</span>
              <button
                onClick={() => removeFile(projectId, file.id)}
                className="hidden text-xs text-muted-foreground hover:text-destructive group-hover:block"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.pdf,.docx"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-[#7F77DD] hover:text-[#7F77DD] disabled:opacity-50"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M6 2v8M2 6h8" />
          </svg>
          {uploading ? 'Uploading...' : 'Upload file'}
        </button>
      </div>
    </div>
  )
}