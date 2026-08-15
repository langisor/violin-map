

import { useEffect, useId, useState } from "react"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SavePatternDialogProps {
  /** Name to prefill the field with, e.g. the currently loaded saved pattern's name. */
  defaultName?: string
  /** Whether a pattern with the entered name already exists (case-insensitive). */
  checkExisting: (name: string) => boolean
  onSave: (name: string) => void
  disabled?: boolean
}

export function SavePatternDialog({ defaultName, checkExisting, onSave, disabled }: SavePatternDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(defaultName ?? "")
  const inputId = useId()

  useEffect(() => {
    if (open) setName(defaultName ?? "")
  }, [open, defaultName])

  const trimmed = name.trim()
  const willOverwrite = trimmed.length > 0 && checkExisting(trimmed)

  const handleSave = () => {
    if (!trimmed) return
    onSave(trimmed)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger disabled={disabled}>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" disabled={disabled}>
          <Save className="size-3.5" />
          Save pattern
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save custom pattern</DialogTitle>
          <DialogDescription>Give this rhythm a name so you can load it again later.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={inputId} className="text-xs text-muted-foreground">
            Pattern name
          </Label>
          <Input
            id={inputId}
            autoFocus
            value={name}
            placeholder="e.g. Verse groove"
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSave()
              }
            }}
          />
          {willOverwrite ? (
            <p className="text-xs text-amber-500">A saved pattern with this name already exists and will be overwritten.</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={!trimmed} onClick={handleSave}>
            {willOverwrite ? "Overwrite" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
