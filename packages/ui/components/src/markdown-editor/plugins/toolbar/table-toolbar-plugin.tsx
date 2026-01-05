"use client"

import { TableIcon } from "lucide-react"

import { useToolbarContext } from "@components/markdown-editor/context/toolbar-context"
import { InsertTableDialog } from "@components/markdown-editor/plugins/table-plugin"
import { Button } from "@shadcn/components/ui/button"

export function TableToolbarPlugin() {
  const { activeEditor, showModal } = useToolbarContext()

  return (
    <Button
      onClick={() =>
        showModal("Insert Table", (onClose) => (
          <InsertTableDialog activeEditor={activeEditor} onClose={onClose} />
        ))
      }
      size={"icon-sm"}
      variant={"outline"}
      className=""
    >
      <TableIcon className="size-4" />
    </Button>
  )
}
