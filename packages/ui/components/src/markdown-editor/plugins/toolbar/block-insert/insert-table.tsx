"use client"

import { TableIcon } from "lucide-react"

import { useToolbarContext } from "@components/markdown-editor/context/toolbar-context"
import { InsertTableDialog } from "@components/markdown-editor/plugins/table-plugin"
import { SelectItem } from "@shadcn/components/ui/select"

export function InsertTable() {
  const { activeEditor, showModal } = useToolbarContext()

  return (
    <SelectItem
      value="table"
      onPointerUp={() =>
        showModal("Insert Table", (onClose) => (
          <InsertTableDialog activeEditor={activeEditor} onClose={onClose} />
        ))
      }
      className=""
    >
      <div className="flex items-center gap-1">
        <TableIcon className="size-4" />
        <span>Table</span>
      </div>
    </SelectItem>
  )
}
