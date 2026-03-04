"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, FolderKanban, MoreHorizontal, Pencil, Trash2, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BoardForm } from "./BoardForm"
import { DeleteConfirmDialog } from "@/components/crm/DeleteConfirmDialog"
import { deleteBoard, archiveBoard } from "@/lib/actions/boards"
import type { Board } from "@/lib/types/tasks"

interface BoardListProps {
  boards: (Board & { task_count: number })[]
}

export function BoardList({ boards }: BoardListProps) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteBoard(deleteTarget.id)
    setDeleteTarget(null)
    router.refresh()
  }

  const handleArchive = async (board: Board) => {
    await archiveBoard(board.id, true)
    router.refresh()
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-[0.85rem] text-[var(--text-muted)] font-light">
          {boards.length} board{boards.length !== 1 ? "s" : ""}
        </p>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Board
        </Button>
      </div>

      {/* Board grid */}
      {boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] mb-5">
            <FolderKanban className="h-6 w-6 text-[var(--text-dim)]" />
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] mb-2">
            No boards yet
          </h3>
          <p className="text-[0.88rem] text-[var(--text-muted)] font-light text-center max-w-sm mb-6">
            Create your first board to start organizing tasks.
          </p>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-6"
          >
            New Board
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <div
              key={board.id}
              onClick={() => router.push(`/tasks/${board.id}`)}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 cursor-pointer hover:border-[rgba(212,115,78,0.2)] transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                    <FolderKanban className="h-4 w-4 text-[var(--text-dim)]" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="text-[0.92rem] text-[var(--text)] font-light leading-tight">
                      {board.name}
                    </h3>
                    <p className="text-[0.72rem] text-[var(--text-dim)] font-light mt-0.5">
                      {board.task_count} task{board.task_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[var(--text-dim)] hover:text-[var(--text)] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[var(--bg-card)] border-[var(--border)]">
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); router.push(`/tasks/${board.id}`) }}
                      className="text-[var(--text-muted)] focus:text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); handleArchive(board) }}
                      className="text-[var(--text-muted)] focus:text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]"
                    >
                      <Archive className="h-3.5 w-3.5 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(board) }}
                      className="text-red-400 focus:text-red-300 focus:bg-[rgba(232,224,212,0.05)]"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {board.description && (
                <p className="text-[0.82rem] text-[var(--text-muted)] font-light line-clamp-2">
                  {board.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <BoardForm open={showCreate} onOpenChange={setShowCreate} />

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        onConfirm={handleDelete}
        title="Delete Board"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? All tasks in this board will be permanently deleted.`}
      />
    </>
  )
}
