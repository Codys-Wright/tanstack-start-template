"use client"

import { ImageIcon } from "lucide-react"

import { useToolbarContext } from "@components/markdown-editor/context/toolbar-context"
import { InsertImageDialog } from "@components/markdown-editor/plugins/images-plugin"
import { Select } from "@shadcn/components/ui/select"

export function InsertImage() {
  const { activeEditor, showModal } = useToolbarContext()

  return (
    <Select.Item
      value="image"
      onPointerUp={(e) => {
        showModal("Insert Image", (onClose) => (
          <InsertImageDialog activeEditor={activeEditor} onClose={onClose} />
        ))
      }}
      className=""
    >
      <div className="flex items-center gap-1">
        <ImageIcon className="size-4" />
        <span>Image</span>
      </div>
    </SelectItem>
  )
}
