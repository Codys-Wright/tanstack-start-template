/**
 * Test Page for Markdown Editor
 *
 * Simple test page to verify the markdown editor is working correctly.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Card, Button } from '@shadcn';
import { Editor } from '@components/markdown-editor/editor';
import type { SerializedEditorState } from 'lexical';

export const Route = createFileRoute('/test')({
  component: TestPage,
});

// Initial value matching the reference pattern
const initialValue = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Hello World - This is test content!',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This is a second paragraph to test the editor.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
} as unknown as SerializedEditorState;

function TestPage() {
  const [editorState, setEditorState] = useState<SerializedEditorState>(initialValue);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Markdown Editor Test</h1>

        <Card className="p-6 mb-6">
          <Button
            onClick={() => {
              console.log('Current editor state:', editorState);
            }}
          >
            Log Editor State
          </Button>
        </Card>

        <div className="mb-6">
          <Editor
            editorSerializedState={editorState}
            onSerializedChange={(value) => {
              setEditorState(value);
              console.log('Editor state changed:', value);
            }}
          />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Editor State (JSON):</h2>
          <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
            {JSON.stringify(editorState, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
