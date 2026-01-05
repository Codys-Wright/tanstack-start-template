"use client"

import { useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { LockIcon, UnlockIcon } from "lucide-react"

import { Button } from "@shadcn/components/ui/button"
import {
  Tooltip,
  Tooltip.Content,
  Tooltip.Trigger,
} from "@shadcn/components/ui/tooltip"

export function EditModeTogglePlugin() {
  const [editor] = useLexicalComposerContext()
  const [isEditable, setIsEditable] = useState(() => editor.isEditable())

  return (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <Button
          variant={"ghost"}
          onClick={() => {
            editor.setEditable(!editor.isEditable())
            setIsEditable(editor.isEditable())
          }}
          title="Read-Only Mode"
          aria-label={`${!isEditable ? "Unlock" : "Lock"} read-only mode`}
          size={"sm"}
          className="p-2"
        >
          {isEditable ? (
            <LockIcon className="size-4" />
          ) : (
            <UnlockIcon className="size-4" />
          )}
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>
        {isEditable ? "View Only Mode" : "Edit Mode"}
      </Tooltip.Content>
    </Tooltip>
  )
}
