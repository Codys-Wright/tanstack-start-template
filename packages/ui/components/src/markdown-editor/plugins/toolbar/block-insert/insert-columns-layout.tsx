"use client"

import { Columns3Icon } from "lucide-react"

import { useToolbarContext } from "@components/markdown-editor/context/toolbar-context"
import { InsertLayoutDialog } from "@components/markdown-editor/plugins/layout-plugin"
import { Select } from "@shadcn/components/ui/select"

export function InsertColumnsLayout() {
  const { activeEditor, showModal } = useToolbarContext()

  return (
    <Select.Item
      value="columns"
      onPointerUp={() =>
        showModal("Insert Columns Layout", (onClose) => (
          <InsertLayoutDialog activeEditor={activeEditor} onClose={onClose} />
        ))
      }
      className=""
    >
      <div className="flex items-center gap-1">
        <Columns3Icon className="size-4" />
        <span>Columns Layout</span>
      </div>
    </SelectItem>
  )
}
