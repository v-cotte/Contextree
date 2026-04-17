'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import ContextEditor from '@/components/project-view/context-editor'
import FileList from '@/components/project-view/file-list'
import ChildrenGrid from '@/components/project-view/children-grid'
import { cn } from '@/lib/utils'

interface ProjectViewProps {
  projectId: string
}

export default function ProjectView({ projectId }: ProjectViewProps) {
  const {
    projects,
    conversations,
    files,
    getProjectAncestors,
    createProject,
    createConversation,
    selectProject,
    selectConversation,
    updateProject,
  } = useStore()

  const project = projects.find((p) => p.id === projectId)
  const ancestors = getProjectAncestors(projectId)
  const parentAncestors = ancestors.slice(0, -1)
  const projectConversations = conversations.filter(
    (c) => c.projectId === projectId
  )
  const projectFiles = files[projectId] ?? []
  const childProjects = projects.filter((p) => p.parentId === projectId)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(project?.name ?? '')

  if (!project) return null

  const handleNameSave = () => {
    if (nameValue.trim()) {
      updateProject(projectId, { name: nameValue.trim() })
    }
    setEditingName(false)
  }

  const handleNewSubProject = () => {
    const sub = createProject('New project', projectId)
    selectProject(sub.id)
  }

  const handleNewConversation = () => {
    const conv = createConversation('New conversation', projectId)
    selectConversation(conv.id)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-border px-5 py-3">
        <div className="flex flex-1 items-center gap-1.5 text-xs text-muted-foreground">
          {parentAncestors.map((ancestor, i) => (
            <span key={ancestor.id} className="flex items-center gap-1.5">
              <button
                onClick={() => selectProject(ancestor.id)}
                className="hover:text-foreground"
              >
                {ancestor.name}
              </button>
              <span>/</span>
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
              className="rounded border border-border bg-background px-1.5 py-0.5 text-sm font-medium text-foreground outline-none"
            />
          ) : (
            <button
              onClick={() => {
                setNameValue(project.name)
                setEditingName(true)
              }}
              className="text-sm font-medium text-foreground hover:underline"
            >
              {project.name}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {ancestors.length > 1 && (
            <Badge variant="secondary" className="text-xs">
              {ancestors.length - 1} inherited{' '}
              {ancestors.length - 1 === 1 ? 'layer' : 'layers'}
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleNewSubProject}
            className="h-7 text-xs"
          >
            + Sub-project
          </Button>
          <Button
            size="sm"
            onClick={handleNewConversation}
            className="h-7 bg-[#7F77DD] text-xs text-white hover:bg-[#6B63C9]"
          >
            + New conversation
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="mx-auto max-w-3xl space-y-6">
          {parentAncestors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Inherited context
              </p>
              <div className="space-y-1.5">
                {parentAncestors.map((ancestor) => (
                  <div
                    key={ancestor.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="#7F77DD"
                      strokeWidth="1.5"
                    >
                      <path d="M2 6h8M6 2l4 4-4 4" />
                    </svg>
                    <span className="text-xs text-muted-foreground">
                      From{' '}
                      <button
                        onClick={() => selectProject(ancestor.id)}
                        className="font-medium text-foreground hover:underline"
                      >
                        {ancestor.name}
                      </button>
                    </span>
                    {ancestor.contextMarkdown && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {ancestor.contextMarkdown.length} chars
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Context
            </p>
            <ContextEditor
              projectId={projectId}
              value={project.contextMarkdown}
              onChange={(val) =>
                updateProject(projectId, { contextMarkdown: val })
              }
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Files
            </p>
            <FileList projectId={projectId} files={projectFiles} />
          </div>

          {(childProjects.length > 0 || projectConversations.length > 0) && (
            <>
              <Separator />
              <ChildrenGrid
                childProjects={childProjects}
                conversations={projectConversations}
                onSelectProject={selectProject}
                onSelectConversation={selectConversation}
                onNewConversation={handleNewConversation}
                onNewSubProject={handleNewSubProject}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}