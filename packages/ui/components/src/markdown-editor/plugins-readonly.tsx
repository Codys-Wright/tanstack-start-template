/**
 * Read-only plugins for the markdown editor.
 * Removes toolbar, actions bar, and editing capabilities.
 * Only includes plugins needed for rendering content.
 */

import {
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from '@lexical/markdown';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';

import { ContentEditable } from '@components/markdown-editor/editor-ui/content-editable';
import { CodeHighlightPlugin } from '@components/markdown-editor/plugins/code-highlight-plugin';
import { TwitterPlugin } from '@components/markdown-editor/plugins/embeds/twitter-plugin';
import { YouTubePlugin } from '@components/markdown-editor/plugins/embeds/youtube-plugin';
import { EmojisPlugin } from '@components/markdown-editor/plugins/emojis-plugin';
import { ImagesPlugin } from '@components/markdown-editor/plugins/images-plugin';
import { LayoutPlugin } from '@components/markdown-editor/plugins/layout-plugin';

import { EMOJI } from '@components/markdown-editor/transformers/markdown-emoji-transformer';
import { HR } from '@components/markdown-editor/transformers/markdown-hr-transformer';
import { IMAGE } from '@components/markdown-editor/transformers/markdown-image-transformer';
import { TABLE } from '@components/markdown-editor/transformers/markdown-table-transformer';
import { TWEET } from '@components/markdown-editor/transformers/markdown-tweet-transformer';

export function PluginsReadonly() {
  return (
    <div className="relative">
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            placeholder=""
            className="ContentEditable__root relative block min-h-[200px] px-8 py-4 focus:outline-none"
          />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />

      {/* Rendering plugins - no editing capabilities */}
      <CheckListPlugin />
      <HorizontalRulePlugin />
      <TablePlugin />
      <ListPlugin />
      <EmojisPlugin />
      <ImagesPlugin />
      <LayoutPlugin />
      <TwitterPlugin />
      <YouTubePlugin />
      <CodeHighlightPlugin />

      <MarkdownShortcutPlugin
        transformers={[
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
        ]}
      />
    </div>
  );
}
