"use client"

import { ImageIcon } from "lucide-react"

import { useToolbarContext } from "@components/markdown-editor/context/toolbar-context"
import { InsertImageDialog } from "@components/markdown-editor/plugins/images-plugin"
import { Button } from "@shadcn/components/ui/button"

export function ImageToolbarPlugin() {
  const { activeEditor, showModal } = useToolbarContext()

  return (
    <Button
      onClick={(e) => {
        showModal("Insert Image", (onClose) => (
          <InsertImageDialog activeEditor={activeEditor} onClose={onClose} />
        ))
      }}
      variant={"outline"}
      size={"icon-sm"}
      className=""
    >
      <ImageIcon className="size-4" />
    </Button>
  )
}
