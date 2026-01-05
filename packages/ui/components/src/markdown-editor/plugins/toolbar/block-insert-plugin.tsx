'use client';

import { PlusIcon } from 'lucide-react';

import { useEditorModal } from '@components/markdown-editor/editor-hooks/use-modal';
import { Select } from '@shadcn/components/ui/select';

export function BlockInsertPlugin({ children }: { children: React.ReactNode }) {
  const [modal] = useEditorModal();

  return (
    <>
      {modal}
      <Select value={''}>
        <Select.Trigger size="sm">
          <Select.Value>
            <PlusIcon className="size-4" />
            <span>Insert</span>
          </Select.Value>
        </Select.Trigger>
        <Select.Content>
          <Select.Group>{children}</Select.Group>
        </Select.Content>
      </Select>
    </>
  );
}
