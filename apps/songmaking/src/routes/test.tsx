/**
 * Test Page for Markdown Editor
 *
 * Simple test page to verify the markdown editor is working correctly.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Editor } from '@components/markdown-editor/editor.js';

export const Route = createFileRoute('/test')({
  component: TestPage,
});

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
            text: 'Hello World 🚀',
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
} as any;

function TestPage() {
  const [editorState, setEditorState] = useState<any>(initialValue);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Markdown Editor Test</h1>

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
