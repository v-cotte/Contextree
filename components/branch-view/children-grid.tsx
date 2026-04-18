'use client'

import { Branch, Chat } from '@/types'
import { cn } from '@/lib/utils'

interface ChildrenGridProps {
  childProjects: Branch[]
  chats: Chat[]
  onselectBranch: (id: string) => void
  onselectChat: (id: string) => void
  onNewchat: () => void
  onNewSubProject: () => void
}

export default function ChildrenGrid({
  childProjects,
  chats,
  onselectBranch,
  onselectChat,
  onNewchat,
  onNewSubProject,
}: ChildrenGridProps) {
  return (
    <div className="space-y-4">
      {childProjects.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sub-projects
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {childProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => onselectBranch(project.id)}
                className="flex flex-col gap-1.5 rounded-lg border border-border bg-background p-3 text-left hover:border-[#7F77DD]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="#7F77DD"
                  strokeWidth="1.4"
                >
                  <rect x="2" y="3" width="12" height="10" rx="2" />
                </svg>
                <span className="text-xs font-medium">{project.name}</span>
                <span className="text-xs text-muted-foreground">
                  {project.contextMarkdown ? 'Has context' : 'No context yet'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {chats.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            chats
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {chats.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onselectChat(conv.id)}
                className="flex flex-col gap-1.5 rounded-lg border border-border bg-background p-3 text-left hover:border-[#7F77DD]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  className="text-muted-foreground"
                >
                  <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H5l-3 2V4z" />
                </svg>
                <span className="text-xs font-medium">{conv.name}</span>
                <span className="text-xs text-muted-foreground">
                  {conv.model}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}