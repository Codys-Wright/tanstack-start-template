'use client';

import { useLayoutEffect, useRef } from 'react';
import {
  $convertFromMarkdownString,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  CHECK_LIST,
} from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, CLEAR_HISTORY_COMMAND } from 'lexical';

import { EMOJI } from '@components/markdown-editor/transformers/markdown-emoji-transformer';
import { HR } from '@components/markdown-editor/transformers/markdown-hr-transformer';
import { IMAGE } from '@components/markdown-editor/transformers/markdown-image-transformer';
import { TABLE } from '@components/markdown-editor/transformers/markdown-table-transformer';
import { TWEET } from '@components/markdown-editor/transformers/markdown-tweet-transformer';

const TRANSFORMERS = [
  TABLE,
  HR,
  IMAGE,
  EMOJI,
  TWEET,
  CHECK_LIST,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];

export function InitialMarkdownPlugin({ markdown }: { markdown?: string }): null {
  const [editor] = useLexicalComposerContext();
  const hasInitialized = useRef(false);

  // Use useLayoutEffect to run synchronously before paint
  useLayoutEffect(() => {
    // Only run once on mount
    if (hasInitialized.current || !markdown) {
      console.log('[InitialMarkdownPlugin] Skipping - already initialized or no markdown');
      return;
    }
    hasInitialized.current = true;

    console.log('[InitialMarkdownPlugin] Converting markdown, length:', markdown.length);

    editor.update(
      () => {
        // Clear existing content first
        const root = $getRoot();
        root.clear();

        console.log('[InitialMarkdownPlugin] Root cleared, converting...');

        // Convert markdown to rich content
        $convertFromMarkdownString(markdown, TRANSFORMERS, undefined, true);

        console.log('[InitialMarkdownPlugin] Conversion complete');
      },
      {
        discrete: true,
        tag: 'history-merge', // Prevent this from being undoable
      },
    );

    // Clear history so user can't undo back to raw markdown
    editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
  }, [editor, markdown]);

  return null;
}
