'use client';

import { useState, useEffect, useMemo } from 'react';
import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { EditorState, SerializedEditorState } from 'lexical';
import {
  $convertToMarkdownString,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  CHECK_LIST,
} from '@lexical/markdown';

import { editorTheme } from '@components/markdown-editor/themes/editor-theme';
import { Tooltip } from '@shadcn/components/ui/tooltip';
import { cn } from '@shadcn/lib/utils';

import { EMOJI } from './transformers/markdown-emoji-transformer';
import { HR } from './transformers/markdown-hr-transformer';
import { IMAGE } from './transformers/markdown-image-transformer';
import { TABLE } from './transformers/markdown-table-transformer';
import { TWEET } from './transformers/markdown-tweet-transformer';
import { nodes } from './nodes';
import { Plugins } from './plugins';
import { PluginsReadonly } from './plugins-readonly';
import { InitialMarkdownPlugin } from './plugins/initial-markdown-plugin';

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

const baseEditorConfig: InitialConfigType = {
  namespace: 'Editor',
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error);
  },
};

export function Editor({
  editorState,
  editorSerializedState,
  initialMarkdown,
  onChange,
  onSerializedChange,
  onMarkdownChange,
  readOnly = false,
}: {
  editorState?: EditorState;
  editorSerializedState?: SerializedEditorState;
  initialMarkdown?: string;
  onChange?: (editorState: EditorState) => void;
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void;
  onMarkdownChange?: (markdown: string) => void;
  readOnly?: boolean;
}) {
  // Only render on client to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute the initial config - memoize to avoid re-creating the editor
  const initialConfig = useMemo((): InitialConfigType => {
    const config = { ...baseEditorConfig, editable: !readOnly };
    if (editorState) {
      return { ...config, editorState };
    }
    if (editorSerializedState) {
      return {
        ...config,
        editorState: JSON.stringify(editorSerializedState),
      };
    }
    // For initialMarkdown, start with empty editor and let InitialMarkdownPlugin handle conversion
    return config;
  }, [editorState, editorSerializedState, readOnly]);

  // Show loading state on server/initial render
  if (!isMounted) {
    return (
      <div
        className={cn(
          'bg-background overflow-hidden min-h-[300px] flex items-center justify-center',
          !readOnly && 'rounded-lg border shadow h-full',
        )}
      >
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-background overflow-hidden',
        !readOnly && 'rounded-lg border shadow h-full',
      )}
      suppressHydrationWarning
    >
      <LexicalComposer initialConfig={initialConfig}>
        <Tooltip.Provider>
          {readOnly ? <PluginsReadonly /> : <Plugins />}

          {/* Convert initial markdown to rich content on mount */}
          {initialMarkdown ? <InitialMarkdownPlugin markdown={initialMarkdown} /> : null}

          {!readOnly && (
            <OnChangePlugin
              ignoreSelectionChange={true}
              onChange={(editorState) => {
                onChange?.(editorState);
                onSerializedChange?.(editorState.toJSON());

                // Convert to markdown if callback provided
                if (onMarkdownChange) {
                  editorState.read(() => {
                    const markdown = $convertToMarkdownString(TRANSFORMERS, undefined, true);
                    onMarkdownChange(markdown);
                  });
                }
              }}
            />
          )}
        </Tooltip.Provider>
      </LexicalComposer>
    </div>
  );
}
