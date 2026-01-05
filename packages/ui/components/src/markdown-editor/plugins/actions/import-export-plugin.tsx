"use client"

import { exportFile, importFile } from "@lexical/file"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { DownloadIcon, UploadIcon } from "lucide-react"

import { Button } from "@shadcn/components/ui/button"
import {
  Tooltip
  
  
} from "@shadcn/components/ui/tooltip"

export function ImportExportPlugin() {
  const [editor] = useLexicalComposerContext()
  return (
    <>
      <Tooltip>
        <Tooltip.Trigger asChild>
          <Button
            variant={"ghost"}
            onClick={() => importFile(editor)}
            title="Import"
            aria-label="Import editor state from JSON"
            size={"sm"}
            className="p-2"
          >
            <UploadIcon className="size-4" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Import Content</Tooltip.Content>
      </Tooltip>

      <Tooltip>
        <Tooltip.Trigger asChild>
          <Button
            variant={"ghost"}
            onClick={() =>
              exportFile(editor, {
                fileName: `Playground ${new Date().toISOString()}`,
                source: "Playground",
              })
            }
            title="Export"
            aria-label="Export editor state to JSON"
            size={"sm"}
            className="p-2"
          >
            <DownloadIcon className="size-4" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Export Content</Tooltip.Content>
      </Tooltip>
    </>
  )
}
