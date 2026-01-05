'use client';

import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  EditorState,
  SerializedEditorState,
} from 'lexical';

import { editorTheme } from '@components/markdown-editor/themes/editor-theme';
import { Tooltip } from '@shadcn/components/ui/tooltip';

import { nodes } from './nodes';
import { Plugins } from './plugins';

const editorConfig: InitialConfigType = {
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
  // Create initial editor state from markdown if provided
  const getInitialState = () => {
    if (editorState) return editorState;
    if (editorSerializedState) return JSON.stringify(editorSerializedState);
    if (initialMarkdown) {
      // Create a simple initial state with markdown as text content
      // The user can use the markdown toggle to convert it
      return () => {
        const root = $getRoot();
        // Clear the default empty paragraph
        root.clear();
        const lines = initialMarkdown.split('\n');
        lines.forEach((line) => {
          const paragraph = $createParagraphNode();
          if (line) {
            paragraph.append($createTextNode(line));
          }
          root.append(paragraph);
        });
      };
    }
    return undefined;
  };

  return (
    <div className="bg-background overflow-hidden rounded-lg border shadow">
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          editorState: getInitialState(),
        }}
      >
        <Tooltip.Provider>
          <Plugins />

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
