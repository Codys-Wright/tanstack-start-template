"use client"

import { PlusIcon } from "lucide-react"

import { useEditorModal } from "@components/markdown-editor/editor-hooks/use-modal"
import {
  Select,
} from "@shadcn/components/ui/select"

export function BlockInsertPlugin({ children }: { children: React.ReactNode }) {
  const [modal] = useEditorModal()

  return (
    <>
      {modal}
      <Select value={""}>
          <PlusIcon className="size-4" />
          <span>Insert</span>
          <Select.Group>{children}</Select.Group>
      </Select>
    </>
  )
}
