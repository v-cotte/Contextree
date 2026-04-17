'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { AIProvider, MODELS } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ApiKeysDialogProps {
  open: boolean
  onClose: () => void
}

const PROVIDERS: { id: AIProvider; label: string; placeholder: string }[] = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    placeholder: 'sk-ant-...',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    placeholder: 'sk-...',
  },
  {
    id: 'google',
    label: 'Google',
    placeholder: 'AIza...',
  },
]

export default function ApiKeysDialog({ open, onClose }: ApiKeysDialogProps) {
  const [keys, setKeys] = useState<Record<AIProvider, string>>({
    anthropic: '',
    openai: '',
    google: '',
  })
  const [saved, setSaved] = useState<Record<AIProvider, boolean>>({
    anthropic: false,
    openai: false,
    google: false,
  })
  const [loading, setLoading] = useState<AIProvider | null>(null)

  useEffect(() => {
    if (!open) return
    const loadKeys = async () => {
        const supabase = createClient()
      const { data } = await supabase
        .from('api_keys')
        .select('provider, encrypted_key')
      if (data) {
        const existing: Record<string, boolean> = {}
        data.forEach((row: any) => {
          existing[row.provider] = true
        })
        setSaved(existing as Record<AIProvider, boolean>)
      }
    }
    loadKeys()
  }, [open])

  const handleSave = async (provider: AIProvider) => {
    const key = keys[provider].trim()
    if (!key) return
    setLoading(provider)
    const supabase = createClient()

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key }),
      })

      if (res.ok) {
        setSaved((prev) => ({ ...prev, [provider]: true }))
        setKeys((prev) => ({ ...prev, [provider]: '' }))
      }
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (provider: AIProvider) => {
    setLoading(provider)
    const supabase = createClient()
    try {
      await fetch('/api/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      setSaved((prev) => ({ ...prev, [provider]: false }))
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>API keys</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Keys are encrypted before storage and never returned to the client.
          Only used server-side when making AI requests.
        </p>
        <div className="space-y-4 pt-2">
          {PROVIDERS.map((provider) => (
            <div key={provider.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{provider.label}</label>
                {saved[provider.id] && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="currentColor"
                    >
                      <path d="M8.5 2.5L4 7 1.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                    Saved
                  </span>
                )}
              </div>
              {saved[provider.id] ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    ••••••••••••••••••••
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(provider.id)}
                    disabled={loading === provider.id}
                    className="h-8 text-xs text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    placeholder={provider.placeholder}
                    value={keys[provider.id]}
                    onChange={(e) =>
                      setKeys((prev) => ({
                        ...prev,
                        [provider.id]: e.target.value,
                      }))
                    }
                    className="h-8 text-xs"
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSave(provider.id)
                    }
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSave(provider.id)}
                    disabled={
                      loading === provider.id || !keys[provider.id].trim()
                    }
                    className="h-8 bg-[#7F77DD] text-xs text-white hover:bg-[#6B63C9]"
                  >
                    {loading === provider.id ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}