'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { useStore } from '@/store'
import Sidebar from '@/components/sidebar/sidebar'
import BranchView from '@/components/branch-view/branch-view'
import ChatView from '@/components/chat-view/chat-view'
import HomeView from '@/components/home-view'

interface AppShellProps {
  user: User
}

export default function AppShell({ user }: AppShellProps) {
  const [mounted, setMounted] = useState(false)
  const { selectedChatId, selectedBranchId } = useStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center"
        style={{ background: 'var(--bg-secondary)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden"
      style={{ background: 'var(--bg-secondary)' }}>
      <Sidebar user={user} />
      <main className="flex-1 overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-primary)' }}>
        {selectedChatId ? (
          <ChatView chatId={selectedChatId} />
        ) : selectedBranchId ? (
          <BranchView branchId={selectedBranchId} />
        ) : (
          <HomeView />
        )}
      </main>
    </div>
  )
}