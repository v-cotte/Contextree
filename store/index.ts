import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Branch,
  Chat,
  Message,
  FileAttachment,
  ResponseMode,
  TreeNode,
} from '@/types'

interface AppState {
  branches: Branch[]
  chats: Chat[]
  messages: Record<string, Message[]>
  files: Record<string, FileAttachment[]>

  selectedBranchId: string | null
  selectedChatId: string | null
  isSidebarOpen: boolean

  createBranch: (name: string, parentId: string | null) => Branch
  updateBranch: (id: string, updates: Partial<Branch>) => void
  deleteBranch: (id: string) => void

  createChat: (name: string, branchId: string) => Chat
  updateChat: (id: string, updates: Partial<Chat>) => void
  deleteChat: (id: string) => void
  toggleStarChat: (id: string) => void

  addMessage: (chatId: string, message: Message) => void
  clearMessages: (chatId: string) => void

  addFile: (branchId: string, file: FileAttachment) => void
  removeFile: (branchId: string, fileId: string) => void

  selectBranch: (id: string | null) => void
  selectChat: (id: string | null) => void
  toggleSidebar: () => void

  getTreeNodes: () => TreeNode[]
  getBranchAncestors: (branchId: string) => Branch[]
  getRecentChats: (limit?: number) => Chat[]
  getStarredChats: () => Chat[]
}

const generateId = () => crypto.randomUUID()

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      branches: [],
      chats: [],
      messages: {},
      files: {},
      selectedBranchId: null,
      selectedChatId: null,
      isSidebarOpen: true,

      createBranch: (name, parentId) => {
        const branch: Branch = {
          id: generateId(),
          name,
          parentId,
          contextMarkdown: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'local',
        }
        set((state) => ({ branches: [...state.branches, branch] }))
        return branch
      },

      updateBranch: (id, updates) => {
        set((state) => ({
          branches: state.branches.map((b) =>
            b.id === id
              ? { ...b, ...updates, updatedAt: new Date().toISOString() }
              : b
          ),
        }))
      },

      deleteBranch: (id) => {
        const state = get()
        const getDescendantIds = (branchId: string): string[] => {
          const children = state.branches.filter(
            (b) => b.parentId === branchId
          )
          return [
            branchId,
            ...children.flatMap((c) => getDescendantIds(c.id)),
          ]
        }
        const idsToDelete = getDescendantIds(id)
        const chatIdsToDelete = state.chats
          .filter((c) => idsToDelete.includes(c.branchId))
          .map((c) => c.id)

        set((state) => {
          const newMessages = { ...state.messages }
          const newFiles = { ...state.files }
          chatIdsToDelete.forEach((cid) => delete newMessages[cid])
          idsToDelete.forEach((bid) => delete newFiles[bid])
          return {
            branches: state.branches.filter(
              (b) => !idsToDelete.includes(b.id)
            ),
            chats: state.chats.filter(
              (c) => !chatIdsToDelete.includes(c.id)
            ),
            messages: newMessages,
            files: newFiles,
            selectedBranchId: idsToDelete.includes(
              state.selectedBranchId ?? ''
            )
              ? null
              : state.selectedBranchId,
            selectedChatId: chatIdsToDelete.includes(
              state.selectedChatId ?? ''
            )
              ? null
              : state.selectedChatId,
          }
        })
      },

      createChat: (name, branchId) => {
        const chat: Chat = {
          id: generateId(),
          name,
          branchId,
          model: 'claude-sonnet-4-6',
          responseMode: 'concise',
          starred: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 'local',
        }
        set((state) => ({
          chats: [...state.chats, chat],
          messages: { ...state.messages, [chat.id]: [] },
        }))
        return chat
      },

      updateChat: (id, updates) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === id
              ? { ...c, ...updates, updatedAt: new Date().toISOString() }
              : c
          ),
        }))
      },

      deleteChat: (id) => {
        set((state) => {
          const newMessages = { ...state.messages }
          delete newMessages[id]
          return {
            chats: state.chats.filter((c) => c.id !== id),
            messages: newMessages,
            selectedChatId:
              state.selectedChatId === id ? null : state.selectedChatId,
          }
        })
      },

      toggleStarChat: (id) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === id ? { ...c, starred: !c.starred } : c
          ),
        }))
      },

      addMessage: (chatId, message) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] ?? []), message],
          },
        }))
      },

      clearMessages: (chatId) => {
        set((state) => ({
          messages: { ...state.messages, [chatId]: [] },
        }))
      },

      addFile: (branchId, file) => {
        set((state) => ({
          files: {
            ...state.files,
            [branchId]: [...(state.files[branchId] ?? []), file],
          },
        }))
      },

      removeFile: (branchId, fileId) => {
        set((state) => ({
          files: {
            ...state.files,
            [branchId]: (state.files[branchId] ?? []).filter(
              (f) => f.id !== fileId
            ),
          },
        }))
      },

      selectBranch: (id) => {
        set({ selectedBranchId: id, selectedChatId: null })
      },

      selectChat: (id) => {
        set({ selectedChatId: id, selectedBranchId: null })
      },

      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
      },

      getTreeNodes: () => {
        const { branches, chats } = get()

        const buildNode = (branch: Branch): TreeNode => {
          const childBranches = branches.filter(
            (b) => b.parentId === branch.id
          )
          const childChats = chats.filter((c) => c.branchId === branch.id)
          return {
            id: branch.id,
            name: branch.name,
            type: 'branch',
            parentId: branch.parentId,
            children: [
              ...childBranches.map(buildNode),
              ...childChats.map((c) => ({
                id: c.id,
                name: c.name,
                type: 'chat' as const,
                parentId: branch.id,
                children: [],
                chatId: c.id,
                starred: c.starred,
              })),
            ],
          }
        }

        return branches
          .filter((b) => b.parentId === null)
          .map(buildNode)
      },

      getBranchAncestors: (branchId) => {
        const { branches } = get()
        const ancestors: Branch[] = []
        let current = branches.find((b) => b.id === branchId)
        while (current) {
          ancestors.unshift(current)
          current = current.parentId
            ? branches.find((b) => b.id === current!.parentId)
            : undefined
        }
        return ancestors
      },

      getRecentChats: (limit = 10) => {
        const { chats } = get()
        return [...chats]
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() -
              new Date(a.updatedAt).getTime()
          )
          .slice(0, limit)
      },

      getStarredChats: () => {
        const { chats } = get()
        return chats.filter((c) => c.starred)
      },
    }),
    {
      name: 'contextree-storage',
    }
  )
)