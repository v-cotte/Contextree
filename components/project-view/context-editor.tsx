'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ContextEditorProps {
  projectId: string
  value: string
  onChange: (value: string) => void
}

export default function ContextEditor({
  projectId,
  value,
  onChange,
}: ContextEditorProps) {
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
      <div className="space-y-2">
        <Textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={PLACEHOLDER}
          className="min-h-[200px] font-mono text-xs"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} className="h-7 text-xs bg-[#7F77DD] text-white hover:bg-[#6B63C9]">
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="h-7 text-xs">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  if (!value) {
    return (
      <button
        onClick={handleEdit}
        className="flex w-full items-center justify-center rounded-md border border-dashed border-border py-6 text-xs text-muted-foreground hover:border-[#7F77DD] hover:text-[#7F77DD]"
      >
        + Add context — describe your role, team, tools, goals...
      </button>
    )
  }

  return (
    <div
      onClick={handleEdit}
      className="group relative cursor-pointer rounded-md border border-border bg-muted/20 p-3 hover:border-[#7F77DD]"
    >
      <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground line-clamp-6">
        {value}
      </pre>
      <div className="absolute right-2 top-2 hidden text-xs text-[#7F77DD] group-hover:block">
        edit
      </div>
    </div>
  )
}

const PLACEHOLDER = `## Role
Describe your role and responsibilities...

## Team
Who you work with, who your manager is...

## Tools
What tools and stack you use...

## How we work
Team processes, communication style...`