'use client';

import { useState, useEffect, useMemo } from 'react';
import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { EditorState, SerializedEditorState } from 'lexical';

import { editorTheme } from '@components/markdown-editor/themes/editor-theme';
import { Tooltip } from '@shadcn/components/ui/tooltip';

import { nodes } from './nodes';
import { Plugins } from './plugins';
import { InitialMarkdownPlugin } from './plugins/initial-markdown-plugin';

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
}: {
  editorState?: EditorState;
  editorSerializedState?: SerializedEditorState;
  initialMarkdown?: string;
  onChange?: (editorState: EditorState) => void;
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void;
}) {
  // Only render on client to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute the initial config - memoize to avoid re-creating the editor
  const initialConfig = useMemo((): InitialConfigType => {
    if (editorState) {
      return { ...baseEditorConfig, editorState };
    }
    if (editorSerializedState) {
      return {
        ...baseEditorConfig,
        editorState: JSON.stringify(editorSerializedState),
      };
    }
    // For initialMarkdown, start with empty editor and let InitialMarkdownPlugin handle conversion
    return baseEditorConfig;
  }, [editorState, editorSerializedState]);

  // Show loading state on server/initial render
  if (!isMounted) {
    return (
      <div className="bg-background overflow-hidden rounded-lg border shadow min-h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  console.log(
    '[Editor] Rendering with initialMarkdown:',
    !!initialMarkdown,
    initialMarkdown?.length,
  );

  return (
    <div
      className="bg-background overflow-hidden rounded-lg border shadow"
      suppressHydrationWarning
    >
      <LexicalComposer initialConfig={initialConfig}>
        <Tooltip.Provider>
          <Plugins />

          {/* Convert initial markdown to rich content on mount */}
          {initialMarkdown ? <InitialMarkdownPlugin markdown={initialMarkdown} /> : null}

          <OnChangePlugin
            ignoreSelectionChange={true}
            onChange={(editorState) => {
              onChange?.(editorState);
              onSerializedChange?.(editorState.toJSON());
            }}
          />
        </Tooltip.Provider>
      </LexicalComposer>
    </div>
  );
}
