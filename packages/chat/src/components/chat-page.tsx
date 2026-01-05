/**
 * Chat Page Component
 *
 * A full-featured chat page that integrates all chat components with effect-atom state management.
 * Uses the hooks from @chat/client directly - no runtime provider needed.
 */

import * as React from 'react';
import { Result } from '@effect-atom/atom-react';
import { cn } from '@shadcn';
import { Skeleton } from '@shadcn';
import { HashIcon, UsersIcon, BellIcon, PinIcon, SearchIcon, InboxIcon } from 'lucide-react';
import * as Option from 'effect/Option';

import { Chat, type Reaction, type StatusType } from './chat.js';
import {
  useRooms,
  useSelectedRoomId,
  useSelectedRoom,
  useRoomMessages,
  useSelectedRoomTyping,
  useChatUi,
  useSelectRoom,
  useSendMessage,
  useLoadMoreMessages,
  useAddReaction,
  useRemoveReaction,
  useToggleMemberList,
  useChatInput,
  useMessageList,
  useSetReply,
  usePresence,
} from '../client/hooks.js';
import type { MessageWithSender, RoomId, UserId } from '../domain/schema.js';

// =============================================================================
// Types
// =============================================================================

interface ChatPageProps {
  currentUserId: UserId;
  className?: string;
}

// =============================================================================
// Room List Sidebar
// =============================================================================

function RoomList({ className }: { className?: string }) {
  const roomsResult = useRooms();
  const selectedRoomId = useSelectedRoomId();
  const selectRoom = useSelectRoom();

  const isLoading = roomsResult._tag === 'Initial' && roomsResult.waiting;
  const isError = roomsResult._tag === 'Failure';
  const rooms = roomsResult._tag === 'Success' ? roomsResult.value : [];

  // Group rooms by type
  const channels = rooms.filter((r) => r.room.type === 'channel');
  const directMessages = rooms.filter((r) => r.room.type === 'direct');
  const groups = rooms.filter((r) => r.room.type === 'group');

  return (
    <Chat.ChannelList className={className}>
      <Chat.ChannelList.Header>
        <span>Chat</span>
      </Chat.ChannelList.Header>

      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="p-4 space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        {isError && <div className="p-4 text-sm text-destructive">Failed to load rooms</div>}

        {!isLoading && !isError && (
          <>
            {channels.length > 0 && (
              <Chat.ChannelList.Section>
                <Chat.ChannelList.SectionTitle>Channels</Chat.ChannelList.SectionTitle>
                {channels.map((room) => (
                  <Chat.ChannelList.Item
                    key={room.room.id}
                    icon={<HashIcon className="size-4" />}
                    active={selectedRoomId === room.room.id}
                    unread={room.unreadCount > 0}
                    onClick={() => selectRoom(room.room.id)}
                  >
                    {room.room.name}
                  </Chat.ChannelList.Item>
                ))}
              </Chat.ChannelList.Section>
            )}

            {groups.length > 0 && (
              <Chat.ChannelList.Section>
                <Chat.ChannelList.SectionTitle>Groups</Chat.ChannelList.SectionTitle>
                {groups.map((room) => (
                  <Chat.ChannelList.Item
                    key={room.room.id}
                    icon={<UsersIcon className="size-4" />}
                    active={selectedRoomId === room.room.id}
                    unread={room.unreadCount > 0}
                    onClick={() => selectRoom(room.room.id)}
                  >
                    {room.room.name}
                  </Chat.ChannelList.Item>
                ))}
              </Chat.ChannelList.Section>
            )}

            {directMessages.length > 0 && (
              <Chat.ChannelList.Section>
                <Chat.ChannelList.SectionTitle>Direct Messages</Chat.ChannelList.SectionTitle>
                {directMessages.map((room) => (
                  <Chat.ChannelList.Item
                    key={room.room.id}
                    active={selectedRoomId === room.room.id}
                    unread={room.unreadCount > 0}
                    onClick={() => selectRoom(room.room.id)}
                  >
                    {room.room.name}
                  </Chat.ChannelList.Item>
                ))}
              </Chat.ChannelList.Section>
            )}
          </>
        )}
      </div>
    </Chat.ChannelList>
  );
}

// =============================================================================
// Message List
// =============================================================================

interface MessageListProps {
  roomId: RoomId;
  currentUserId: UserId;
  className?: string;
}

function MessageList({ roomId, currentUserId, className }: MessageListProps) {
  const { messages, hasMore, isLoading, loadMore } = useMessageList(roomId);
  const setReply = useSetReply();
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();

  // Intersection observer for infinite scroll
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  // Group messages by sender and time
  const groupedMessages = React.useMemo(() => {
    const groups: { isFirst: boolean; message: MessageWithSender }[] = [];
    let lastSenderId: string | null = null;
    let lastTimestamp: number | null = null;

    // Messages are in reverse order (newest first)
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const timeDiff = lastTimestamp ? msg.message.timestamp - lastTimestamp : Infinity;
      const isFirst = msg.sender.id !== lastSenderId || timeDiff > 5 * 60 * 1000; // 5 min gap

      groups.unshift({ isFirst, message: msg });
      lastSenderId = msg.sender.id;
      lastTimestamp = msg.message.timestamp;
    }

    return groups;
  }, [messages]);

  const handleReply = (msg: MessageWithSender) => {
    setReply(roomId, {
      messageId: msg.message.id,
      author: msg.sender.name,
      content:
        msg.message.content.length > 100
          ? msg.message.content.slice(0, 100) + '...'
          : msg.message.content,
    });
  };

  const handleReact = (messageId: string, emoji: string, isAdding: boolean) => {
    if (isAdding) {
      addReaction(roomId, messageId as any, emoji);
    } else {
      removeReaction(roomId, messageId as any, emoji);
    }
  };

  return (
    <Chat.Messages className={className}>
      {groupedMessages.map(({ isFirst, message: msg }) => {
        const replyTo =
          Option.isSome(msg.replyTo) && Option.isSome(msg.replyToSender)
            ? {
                author: msg.replyToSender.value.name,
                content: msg.replyTo.value.content,
              }
            : undefined;

        const reactions: Reaction[] = msg.reactions.map((r) => ({
          emoji: r.emoji,
          count: r.count,
          reacted: r.reacted,
        }));

        const canEdit = msg.sender.id === currentUserId;
        const canDelete = msg.sender.id === currentUserId;

        return (
          <Chat.FullMessage
            key={msg.message.id}
            id={msg.message.id}
            author={{
              name: msg.sender.name,
              avatarUrl: Option.getOrUndefined(msg.sender.avatarUrl),
              status: msg.sender.status as StatusType,
              roleColor: Option.getOrUndefined(msg.sender.roleColor),
            }}
            content={msg.message.content}
            timestamp={msg.message.timestamp}
            isEdited={Option.isSome(msg.message.editedAt)}
            isFirst={isFirst}
            reactions={reactions}
            replyTo={replyTo}
            onReply={() => handleReply(msg)}
            onReact={(emoji) => {
              const existing = reactions.find((r) => r.emoji === emoji);
              handleReact(msg.message.id, emoji, !existing?.reacted);
            }}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        );
      })}

      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          {isLoading ? (
            <div className="flex gap-2">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Scroll to load more</span>
          )}
        </div>
      )}
    </Chat.Messages>
  );
}

// =============================================================================
// Chat Header
// =============================================================================

function ChatHeaderSection({ className }: { className?: string }) {
  const selectedRoom = useSelectedRoom();
  const ui = useChatUi();
  const toggleMemberList = useToggleMemberList();

  if (!selectedRoom) {
    return (
      <Chat.Header className={className}>
        <Chat.Header.Title>Select a channel</Chat.Header.Title>
      </Chat.Header>
    );
  }

  const description = Option.getOrUndefined(selectedRoom.room.description);

  return (
    <Chat.Header className={className}>
      <Chat.Header.Icon>
        <HashIcon className="size-5" />
      </Chat.Header.Icon>
      <Chat.Header.Title>{selectedRoom.room.name}</Chat.Header.Title>
      {description && (
        <>
          <Chat.Header.Divider />
          <Chat.Header.Description>{description}</Chat.Header.Description>
        </>
      )}
      <Chat.Header.Actions>
        <Chat.Header.Button tooltip="Pinned Messages">
          <PinIcon className="size-4" />
        </Chat.Header.Button>
        <Chat.Header.Button tooltip="Notification Settings">
          <BellIcon className="size-4" />
        </Chat.Header.Button>
        <Chat.Header.Button tooltip="Search">
          <SearchIcon className="size-4" />
        </Chat.Header.Button>
        <Chat.Header.Button tooltip="Inbox">
          <InboxIcon className="size-4" />
        </Chat.Header.Button>
        <Chat.Header.Button
          tooltip={ui.isMemberListVisible ? 'Hide Members' : 'Show Members'}
          onClick={toggleMemberList}
          className={ui.isMemberListVisible ? 'bg-accent' : ''}
        >
          <UsersIcon className="size-4" />
        </Chat.Header.Button>
      </Chat.Header.Actions>
    </Chat.Header>
  );
}

// =============================================================================
// Chat Input Section
// =============================================================================

function ChatInputSection({ roomId, className }: { roomId: RoomId; className?: string }) {
  const selectedRoom = useSelectedRoom();
  const { content, replyTo, onChange, onSend, onClearReply } = useChatInput(roomId);
  const typingState = useSelectedRoomTyping();

  if (!selectedRoom) {
    return null;
  }

  const typingUsers = typingState.users.map((u) => u.username);

  return (
    <div className={className}>
      {replyTo && (
        <div className="px-4 py-2 bg-muted/30 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Replying to</span>
            <span className="font-medium">{replyTo.author}</span>
          </div>
          <button
            onClick={onClearReply}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}
      <Chat.TypingIndicator users={typingUsers} />
      <Chat.Input
        value={content}
        onChange={onChange}
        onSend={onSend}
        channelName={selectedRoom.room.name}
      />
    </div>
  );
}

// =============================================================================
// Member List Sidebar
// =============================================================================

function MemberListSidebar({ className }: { className?: string }) {
  const selectedRoom = useSelectedRoom();
  const presence = usePresence();

  if (!selectedRoom) {
    return null;
  }

  // This would normally come from the room details
  const members = selectedRoom.room.memberIds.map((id) => ({
    id,
    name: `User ${id.slice(0, 4)}`,
    status: presence.get(id)?.status ?? 'offline',
  }));

  const onlineMembers = members.filter((m) => m.status === 'online');
  const offlineMembers = members.filter((m) => m.status !== 'online');

  return (
    <Chat.MemberList className={className}>
      {onlineMembers.length > 0 && (
        <Chat.MemberList.Section>
          <Chat.MemberList.SectionTitle count={onlineMembers.length}>
            Online
          </Chat.MemberList.SectionTitle>
          {onlineMembers.map((member) => (
            <Chat.MemberList.Item
              key={member.id}
              name={member.name}
              status={member.status as StatusType}
            />
          ))}
        </Chat.MemberList.Section>
      )}

      {offlineMembers.length > 0 && (
        <Chat.MemberList.Section>
          <Chat.MemberList.SectionTitle count={offlineMembers.length}>
            Offline
          </Chat.MemberList.SectionTitle>
          {offlineMembers.map((member) => (
            <Chat.MemberList.Item
              key={member.id}
              name={member.name}
              status={member.status as StatusType}
            />
          ))}
        </Chat.MemberList.Section>
      )}
    </Chat.MemberList>
  );
}

// =============================================================================
// Main Chat Page Component
// =============================================================================

export function ChatPage({ currentUserId, className }: ChatPageProps) {
  const selectedRoomId = useSelectedRoomId();
  const ui = useChatUi();

  return (
    <div className={cn('flex h-full', className)}>
      {/* Room List Sidebar */}
      <RoomList className="w-60 shrink-0 hidden md:flex" />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeaderSection />

        {selectedRoomId ? (
          <>
            <MessageList roomId={selectedRoomId} currentUserId={currentUserId} className="flex-1" />
            <ChatInputSection roomId={selectedRoomId} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <HashIcon className="size-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No channel selected</h3>
              <p className="text-sm">Select a channel from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Member List Sidebar */}
      {selectedRoomId && ui.isMemberListVisible && (
        <MemberListSidebar className="hidden lg:block" />
      )}
    </div>
  );
}

// =============================================================================
// Export
// =============================================================================

export default ChatPage;
