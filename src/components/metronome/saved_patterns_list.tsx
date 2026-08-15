

import { useState } from "react"
import { Check, PencilLine, Play, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SavedPattern } from "../../lib/metronome/saved_patterns"

interface SavedPatternsListProps {
  patterns: SavedPattern[]
  activeId: string | null
  onLoad: (pattern: SavedPattern) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
}

function describe(pattern: SavedPattern) {
  const beats = pattern.pattern.grouping?.length ?? pattern.pattern.steps.length
  return `${beats} beat${beats === 1 ? "" : "s"} · ${pattern.bpm} BPM`
}

export function SavedPatternsList({ patterns, activeId, onLoad, onDelete, onRename }: SavedPatternsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  if (patterns.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-xs text-muted-foreground">
        No saved patterns yet. Build a rhythm above and save it to keep it here.
      </p>
    )
  }

  const startEditing = (pattern: SavedPattern) => {
    setEditingId(pattern.id)
    setDraftName(pattern.name)
  }

  const commitRename = (id: string) => {
    const trimmed = draftName.trim()
    if (trimmed) onRename(id, trimmed)
    setEditingId(null)
  }

  return (
    <ul className="flex flex-col gap-2">
      {patterns.map((pattern) => {
        const isActive = pattern.id === activeId
        const isEditing = editingId === pattern.id
        const isConfirmingDelete = confirmingDeleteId === pattern.id

        return (
          <li
            key={pattern.id}
            className={cn(
              "flex items-center gap-2 rounded-lg border p-2.5 transition-colors",
              isActive ? "border-primary bg-primary/10" : "border-border bg-card",
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              {isEditing ? (
                <Input
                  autoFocus
                  value={draftName}
                  maxLength={40}
                  className="h-7"
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(pattern.id)
                    if (e.key === "Escape") setEditingId(null)
                  }}
                />
              ) : (
                <>
                  <span className="truncate text-sm font-medium text-foreground">{pattern.name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {describe(pattern)}
                    {isActive ? (
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                        Loaded
                      </Badge>
                    ) : null}
                  </span>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    className="bg-muted text-muted-foreground hover:bg-muted/90"
                    size="sm"
                    aria-label="Confirm rename"
                    onClick={() => commitRename(pattern.id)}
                  >
                    <Check className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    className="bg-muted text-muted-foreground hover:bg-muted/90"
                    size="sm"
                    aria-label="Cancel rename"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </>
              ) : isConfirmingDelete ? (
                <>
                  <span className="text-xs text-muted-foreground">Delete?</span>
                  <Button
                    type="button"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    size="sm"
                    aria-label="Confirm delete"
                    onClick={() => {
                      onDelete(pattern.id)
                      setConfirmingDeleteId(null)
                    }}
                  >
                    <Check className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    className="bg-muted text-muted-foreground hover:bg-muted/90"
                    size="sm"
                    aria-label="Cancel delete"
                    onClick={() => setConfirmingDeleteId(null)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    className="bg-muted text-muted-foreground hover:bg-muted/90"
                    size="sm"
                    aria-label={`Load ${pattern.name}`}
                    onClick={() => onLoad(pattern)}
                  >
                    <Play className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    className="bg-muted text-muted-foreground hover:bg-muted/90"
                    size="sm"
                    aria-label={`Rename ${pattern.name}`}
                    onClick={() => startEditing(pattern)}
                  >
                    <PencilLine className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    className="bg-muted text-muted-foreground hover:bg-muted/90"
                    size="sm"
                    aria-label={`Delete ${pattern.name}`}
                    onClick={() => setConfirmingDeleteId(pattern.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
