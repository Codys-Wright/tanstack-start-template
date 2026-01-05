'use client';

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { LexicalCommand, LexicalEditor, RangeSelection } from 'lexical';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  REDO_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import { MicIcon } from 'lucide-react';

import { useReport } from '@components/markdown-editor/editor-hooks/use-report';
import { CAN_USE_DOM } from '@components/markdown-editor/shared/can-use-dom';
import { Button } from '@shadcn/components/ui/button';
import { Tooltip } from '@shadcn/components/ui/tooltip';

export const SPEECH_TO_TEXT_COMMAND: LexicalCommand<boolean> =
  createCommand('SPEECH_TO_TEXT_COMMAND');

const VOICE_COMMANDS: Readonly<
  Record<string, (arg0: { editor: LexicalEditor; selection: RangeSelection }) => void>
> = {
  '\n': ({ selection }) => {
    selection.insertParagraph();
  },
  redo: ({ editor }) => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  },
  undo: ({ editor }) => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  },
};

export function SpeechToTextPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isSpeechToText, setIsSpeechToText] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const report = useReport();

  // Check for speech recognition support on client only
  useEffect(() => {
    if (CAN_USE_DOM) {
      setIsSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    }
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionClass =
      // @ts-expect-error missing type
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (isEnabled && recognitionRef.current === null) {
      recognitionRef.current = new SpeechRecognitionClass();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.addEventListener('result', (event: any) => {
        const resultItem = event.results.item(event.resultIndex);
        const { transcript } = resultItem.item(0);
        report(transcript);

        if (!resultItem.isFinal) {
          return;
        }

        editor.update(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            const command = VOICE_COMMANDS[transcript.toLowerCase().trim()];

            if (command) {
              command({
                editor,
                selection,
              });
            } else if (transcript.match(/\s*\n\s*/)) {
              selection.insertParagraph();
            } else {
              selection.insertText(transcript);
            }
          }
        });
      });
    }

    if (recognitionRef.current) {
      if (isEnabled) {
        recognitionRef.current.start();
      } else {
        recognitionRef.current.stop();
      }
    }

    return () => {
      if (recognitionRef.current !== null) {
        recognitionRef.current.stop();
      }
    };
  }, [editor, isEnabled, isSupported, report]);

  useEffect(() => {
    return editor.registerCommand(
      SPEECH_TO_TEXT_COMMAND,
      (_isEnabled: boolean) => {
        setIsEnabled(_isEnabled);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  // Don't render if not supported (checked on client)
  if (!isSupported) {
    return null;
  }

  return (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <Button
          onClick={() => {
            editor.dispatchCommand(SPEECH_TO_TEXT_COMMAND, !isSpeechToText);
            setIsSpeechToText(!isSpeechToText);
          }}
          variant={isSpeechToText ? 'secondary' : 'ghost'}
          title="Speech To Text"
          aria-label={`${isSpeechToText ? 'Enable' : 'Disable'} speech to text`}
          className="p-2"
          size={'sm'}
        >
          <MicIcon className="size-4" />
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>Speech To Text</Tooltip.Content>
    </Tooltip>
  );
}
