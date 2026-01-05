'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { CLEAR_EDITOR_COMMAND } from 'lexical';
import { Trash2Icon } from 'lucide-react';

import { Button } from '@shadcn/components/ui/button';
import { Dialog } from '@shadcn/components/ui/dialog';
import { Tooltip } from '@shadcn/components/ui/tooltip';

export function ClearEditorActionPlugin() {
  const [editor] = useLexicalComposerContext();

  return (
    <Dialog>
      <Tooltip disableHoverableContent>
        <Tooltip.Trigger asChild>
          <Dialog.Trigger asChild>
            <Button size={'sm'} variant={'ghost'} className="p-2">
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </Dialog.Trigger>
        </Tooltip.Trigger>
        <Tooltip.Content>Clear Editor</Tooltip.Content>
      </Tooltip>

      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Clear Editor</Dialog.Title>
          <Dialog.Description>Are you sure you want to clear the editor?</Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="outline">Cancel</Button>
          </Dialog.Close>

          <Dialog.Close asChild>
            <Button
              variant="destructive"
              onClick={() => {
                editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
              }}
            >
              Clear
            </Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
