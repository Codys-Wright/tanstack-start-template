import { ElementTransformer } from "@lexical/markdown";

import {
  $createTweetNode,
  $isTweetNode,
  TweetNode,
} from "@components/markdown-editor/nodes/embeds/tweet-node.js";

export const TWEET: ElementTransformer = {
  dependencies: [TweetNode],
  export: (node) => {
    if (!$isTweetNode(node)) {
      return null;
    }

    return `<tweet id="${node.getId()}" />`;
  },
  regExp: /<tweet id="([^"]+?)"\s?\/>\s?$/,
  replace: (textNode, _1, match) => {
    const [, id] = match;
    const tweetNode = $createTweetNode(id);
    textNode.replace(tweetNode);
  },
  type: "element",
};
