/**
 * @chat Client Hooks
 *
 * React hooks for using chat atoms in components.
 * These are simple wrappers around useAtomValue and useAtomSet.
 */

import { useAtomSet, useAtomValue, Result } from '@effect-atom/atom-react';
import * as React from 'react';
import type { MessageId, RoomId } from '../domain/schema.js';
import {
  // State atoms
  selectedRoomIdAtom,
  selectedRoomAtom,
  selectedRoomTypingAtom,
  selectedRoomDraftAtom,
  roomsAtom,
  messagesAtom,
  typingAtom,
  presenceAtom,
  draftAtom,
  chatUiAtom,
  // Mutation atoms
  selectRoomAtom,
  sendMessageAtom,
  loadMoreMessagesAtom,
  addReactionAtom,
  removeReactionAtom,
  sendTypingAtom,
  updateDraftAtom,
  setReplyAtom,
  toggleMemberListAtom,
} from './atoms.js';

// =============================================================================
// State Hooks
// =============================================================================

/**
 * Get all rooms
 */
export const useRooms = () => {
  return useAtomValue(roomsAtom);
};

/**
 * Get selected room ID
 */
export const useSelectedRoomId = () => {
  return useAtomValue(selectedRoomIdAtom);
};

/**
 * Get selected room details
 */
export const useSelectedRoom = () => {
  return useAtomValue(selectedRoomAtom);
};

/**
 * Get messages for a specific room
 */
export const useRoomMessages = (roomId: RoomId) => {
  return useAtomValue(messagesAtom(roomId));
};

/**
 * Get typing users for selected room
 */
export const useSelectedRoomTyping = () => {
  return useAtomValue(selectedRoomTypingAtom);
};

/**
 * Get typing users for a specific room
 */
export const useRoomTyping = (roomId: RoomId) => {
  return useAtomValue(typingAtom(roomId));
};

/**
 * Get draft for selected room
 */
export const useSelectedRoomDraft = () => {
  return useAtomValue(selectedRoomDraftAtom);
};

/**
 * Get draft for a specific room
 */
export const useRoomDraft = (roomId: RoomId) => {
  return useAtomValue(draftAtom(roomId));
};

/**
 * Get user presence
 */
export const usePresence = () => {
  return useAtomValue(presenceAtom);
};

/**
 * Get chat UI state
 */
export const useChatUi = () => {
  return useAtomValue(chatUiAtom);
};

// =============================================================================
// Action Hooks
// =============================================================================

/**
 * Select room action
 */
export const useSelectRoom = () => {
  const set = useAtomSet(selectRoomAtom);
  return React.useCallback((roomId: RoomId | null) => set(roomId), [set]);
};

/**
 * Send message action
 */
export const useSendMessage = () => {
  const set = useAtomSet(sendMessageAtom);
  return React.useCallback(
    (roomId: RoomId, content: string, replyToId?: MessageId) => set({ roomId, content, replyToId }),
    [set],
  );
};

/**
 * Load more messages action
 */
export const useLoadMoreMessages = () => {
  const set = useAtomSet(loadMoreMessagesAtom);
  return React.useCallback((roomId: RoomId, cursor: string) => set({ roomId, cursor }), [set]);
};

/**
 * Update draft action
 */
export const useUpdateDraft = () => {
  const set = useAtomSet(updateDraftAtom);
  return React.useCallback((roomId: RoomId, content: string) => set({ roomId, content }), [set]);
};

/**
 * Set reply action
 */
export const useSetReply = () => {
  const set = useAtomSet(setReplyAtom);
  return React.useCallback(
    (roomId: RoomId, replyTo: { messageId: MessageId; author: string; content: string } | null) =>
      set({ roomId, replyTo }),
    [set],
  );
};

/**
 * Add reaction action
 */
export const useAddReaction = () => {
  const set = useAtomSet(addReactionAtom);
  return React.useCallback(
    (roomId: RoomId, messageId: MessageId, emoji: string) => set({ roomId, messageId, emoji }),
    [set],
  );
};

/**
 * Remove reaction action
 */
export const useRemoveReaction = () => {
  const set = useAtomSet(removeReactionAtom);
  return React.useCallback(
    (roomId: RoomId, messageId: MessageId, emoji: string) => set({ roomId, messageId, emoji }),
    [set],
  );
};

/**
 * Send typing indicator
 */
export const useSendTyping = () => {
  const set = useAtomSet(sendTypingAtom);
  return React.useCallback((roomId: RoomId, isTyping: boolean) => set({ roomId, isTyping }), [set]);
};

/**
 * Toggle member list
 */
export const useToggleMemberList = () => {
  const set = useAtomSet(toggleMemberListAtom);
  return React.useCallback(() => set(undefined), [set]);
};

// =============================================================================
// Combined Hooks
// =============================================================================

/**
 * Combined hook for chat input
 */
export const useChatInput = (roomId: RoomId | null) => {
  const draft = useSelectedRoomDraft();
  const updateDraft = useUpdateDraft();
  const sendMessageFn = useSendMessage();
  const setReply = useSetReply();
  const sendTyping = useSendTyping();

  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = React.useCallback(
    (content: string) => {
      if (!roomId) return;
      updateDraft(roomId, content);

      // Send typing indicator (debounced)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendTyping(roomId, true);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(roomId, false);
      }, 3000);
    },
    [roomId, updateDraft, sendTyping],
  );

  const handleSend = React.useCallback(() => {
    if (!roomId || !draft.content.trim()) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTyping(roomId, false);
    sendMessageFn(roomId, draft.content, draft.replyToId ?? undefined);
  }, [roomId, draft, sendMessageFn, sendTyping]);

  const handleClearReply = React.useCallback(() => {
    if (!roomId) return;
    setReply(roomId, null);
  }, [roomId, setReply]);

  return {
    content: draft.content,
    replyTo: draft.replyToPreview,
    onChange: handleChange,
    onSend: handleSend,
    onClearReply: handleClearReply,
  };
};

/**
 * Combined hook for message list with infinite scroll
 */
export const useMessageList = (roomId: RoomId | null) => {
  const messagesResult = roomId ? useRoomMessages(roomId) : null;
  const loadMoreMessages = useLoadMoreMessages();

  const { messages, hasMore, isLoading, nextCursor } = React.useMemo(() => {
    if (!messagesResult || !Result.isSuccess(messagesResult)) {
      return {
        messages: [],
        hasMore: false,
        isLoading: false,
        nextCursor: null,
      };
    }
    return messagesResult.value;
  }, [messagesResult]);

  const loadMore = React.useCallback(() => {
    if (roomId && hasMore && !isLoading && nextCursor) {
      loadMoreMessages(roomId, nextCursor);
    }
  }, [roomId, hasMore, isLoading, nextCursor, loadMoreMessages]);

  return {
    messages,
    hasMore,
    isLoading,
    loadMore,
    result: messagesResult,
  };
};
