/**
 * Chat Components - Discord/GroupMe Style
 *
 * A polished chat UI system with modern design patterns.
 * Features: message grouping, reactions, typing indicators, member presence
 */

import * as React from 'react';
import { cn } from '@shadcn';
import { Avatar } from '@shadcn';
import { Button } from '@shadcn';
import { Textarea } from '@shadcn';
import { Separator } from '@shadcn';
import { ScrollArea } from '@shadcn';
import { Tooltip } from '@shadcn';
import { DropdownMenu } from '@shadcn';
import { Popover } from '@shadcn';
import {
  SendIcon,
  PlusIcon,
  SmileIcon,
  HashIcon,
  AtSignIcon,
  ImageIcon,
  GifIcon,
  StickerIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  ReplyIcon,
  PinIcon,
  CopyIcon,
  ChevronDownIcon,
  BellIcon,
  BellOffIcon,
  UsersIcon,
  SettingsIcon,
  PhoneIcon,
  VideoIcon,
  SearchIcon,
  InboxIcon,
  CircleIcon,
} from 'lucide-react';

// =============================================================================
// Status Badge
// =============================================================================

type StatusType = 'online' | 'offline' | 'away' | 'dnd';

const statusColors: Record<StatusType, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-zinc-500',
  away: 'bg-amber-500',
  dnd: 'bg-rose-500',
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'absolute bottom-0 right-0 size-3 rounded-full border-2 border-background',
        statusColors[status],
        className,
      )}
    />
  );
}

// =============================================================================
// Chat Container
// =============================================================================

function ChatRoot({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'h-full overflow-hidden flex flex-col bg-background @container/chat',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Chat Header - Discord Style
// =============================================================================

function ChatHeader({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'h-12 min-h-12 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'border-b flex items-center gap-2 shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function ChatHeaderIcon({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('text-muted-foreground', className)} {...props}>
      {children}
    </div>
  );
}

function ChatHeaderTitle({ children, className, ...props }: React.ComponentProps<'h2'>) {
  return (
    <h2 className={cn('font-semibold text-base truncate', className)} {...props}>
      {children}
    </h2>
  );
}

function ChatHeaderDescription({ children, className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground truncate hidden @xl/chat:block', className)}
      {...props}
    >
      {children}
    </p>
  );
}

function ChatHeaderDivider({ className }: { className?: string }) {
  return <Separator orientation="vertical" className={cn('h-6 mx-2', className)} />;
}

function ChatHeaderActions({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('ml-auto flex items-center gap-1', className)} {...props}>
      {children}
    </div>
  );
}

interface ChatHeaderButtonProps extends React.ComponentProps<typeof Button> {
  tooltip?: string;
}

function ChatHeaderButton({ tooltip, children, className, ...props }: ChatHeaderButtonProps) {
  const button = (
    <Button
      variant="ghost"
      size="icon"
      className={cn('size-8 text-muted-foreground hover:text-foreground', className)}
      {...props}
    >
      {children}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
        <Tooltip.Content side="bottom">{tooltip}</Tooltip.Content>
      </Tooltip>
    );
  }

  return button;
}

// =============================================================================
// Chat Messages Container
// =============================================================================

function ChatMessages({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <ScrollArea className={cn('flex-1', className)} {...props}>
      <div className="flex flex-col-reverse py-4 px-4 min-h-full">{children}</div>
    </ScrollArea>
  );
}

// =============================================================================
// Message Components - Discord Style
// =============================================================================

interface MessageGroupProps {
  children: React.ReactNode;
  className?: string;
}

function MessageGroup({ children, className }: MessageGroupProps) {
  return (
    <div
      className={cn(
        'group/message relative py-0.5 pr-12 hover:bg-accent/50 rounded-sm -mx-2 px-2',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface MessageProps {
  children: React.ReactNode;
  isFirst?: boolean;
  className?: string;
}

function Message({ children, isFirst = false, className }: MessageProps) {
  return (
    <div className={cn('flex gap-4', isFirst ? 'mt-4 pt-1' : 'pl-14', className)}>{children}</div>
  );
}

interface MessageAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: StatusType;
  className?: string;
}

function MessageAvatar({ src, alt, fallback, status, className }: MessageAvatarProps) {
  return (
    <div className="relative flex-shrink-0">
      <Avatar className={cn('size-10 rounded-full', className)}>
        <Avatar.Image src={src} alt={alt} />
        <Avatar.Fallback className="text-sm font-medium">
          {fallback || alt?.slice(0, 2).toUpperCase()}
        </Avatar.Fallback>
      </Avatar>
      {status && <StatusBadge status={status} />}
    </div>
  );
}

interface MessageHeaderProps {
  author: string;
  timestamp: number | Date;
  isEdited?: boolean;
  roleColor?: string;
  className?: string;
}

function MessageHeader({ author, timestamp, isEdited, roleColor, className }: MessageHeaderProps) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const timeStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span
        className="font-medium text-sm hover:underline cursor-pointer"
        style={roleColor ? { color: roleColor } : undefined}
      >
        {author}
      </span>
      <Tooltip>
        <Tooltip.Trigger asChild>
          <span className="text-xs text-muted-foreground/70">{timeStr}</span>
        </Tooltip.Trigger>
        <Tooltip.Content>
          {new Intl.DateTimeFormat('en-US', {
            dateStyle: 'full',
            timeStyle: 'short',
          }).format(date)}
        </Tooltip.Content>
      </Tooltip>
      {isEdited && <span className="text-xs text-muted-foreground/50">(edited)</span>}
    </div>
  );
}

interface MessageContentProps {
  children: React.ReactNode;
  className?: string;
}

function MessageContent({ children, className }: MessageContentProps) {
  return <div className={cn('text-sm leading-relaxed break-words', className)}>{children}</div>;
}

// Compact timestamp for consecutive messages
interface MessageTimestampProps {
  timestamp: number | Date;
  className?: string;
}

function MessageTimestamp({ timestamp, className }: MessageTimestampProps) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  return (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <span
          className={cn(
            'absolute left-0 top-1 w-14 text-[10px] text-muted-foreground/50 text-right pr-2',
            'opacity-0 group-hover/message:opacity-100 transition-opacity',
            className,
          )}
        >
          {new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          }).format(date)}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Content>
        {new Intl.DateTimeFormat('en-US', {
          dateStyle: 'full',
          timeStyle: 'short',
        }).format(date)}
      </Tooltip.Content>
    </Tooltip>
  );
}

// =============================================================================
// Message Actions (Hover Toolbar)
// =============================================================================

interface MessageActionsProps {
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact?: () => void;
  onPin?: () => void;
  onCopy?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  className?: string;
}

function MessageActions({
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin,
  onCopy,
  canEdit = false,
  canDelete = false,
  className,
}: MessageActionsProps) {
  return (
    <div
      className={cn(
        'absolute -top-4 right-2 opacity-0 group-hover/message:opacity-100',
        'transition-opacity bg-background border rounded-md shadow-lg',
        'flex items-center p-0.5 gap-0.5',
        className,
      )}
    >
      <Tooltip>
        <Tooltip.Trigger asChild>
          <Button variant="ghost" size="icon" className="size-7" onClick={onReact}>
            <SmileIcon className="size-4" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Add Reaction</Tooltip.Content>
      </Tooltip>

      <Tooltip>
        <Tooltip.Trigger asChild>
          <Button variant="ghost" size="icon" className="size-7" onClick={onReply}>
            <ReplyIcon className="size-4" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Reply</Tooltip.Content>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <Button variant="ghost" size="icon" className="size-7">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" className="w-48">
          {canEdit && (
            <DropdownMenu.Item onClick={onEdit}>
              <PencilIcon className="size-4 mr-2" />
              Edit Message
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item onClick={onPin}>
            <PinIcon className="size-4 mr-2" />
            Pin Message
          </DropdownMenu.Item>
          <DropdownMenu.Item onClick={onCopy}>
            <CopyIcon className="size-4 mr-2" />
            Copy Text
          </DropdownMenu.Item>
          {canDelete && (
            <>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <TrashIcon className="size-4 mr-2" />
                Delete Message
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu>
    </div>
  );
}

// =============================================================================
// Reactions
// =============================================================================

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onReact?: (emoji: string) => void;
  className?: string;
}

function MessageReactions({ reactions, onReact, className }: MessageReactionsProps) {
  if (reactions.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1 mt-1', className)}>
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onReact?.(reaction.emoji)}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
            'border transition-colors',
            reaction.reacted
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-muted/50 border-transparent hover:bg-muted',
          )}
        >
          <span>{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}
      <button
        className={cn(
          'inline-flex items-center justify-center size-6 rounded-full',
          'border border-dashed border-muted-foreground/30',
          'text-muted-foreground/50 hover:text-muted-foreground hover:border-muted-foreground/50',
          'transition-colors',
        )}
      >
        <SmileIcon className="size-3" />
      </button>
    </div>
  );
}

// =============================================================================
// Reply Preview
// =============================================================================

interface ReplyPreviewProps {
  author: string;
  content: string;
  onClick?: () => void;
  className?: string;
}

function ReplyPreview({ author, content, onClick, className }: ReplyPreviewProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 text-xs text-muted-foreground mb-1 pl-14',
        'hover:text-foreground transition-colors',
        className,
      )}
    >
      <div className="flex items-center gap-1">
        <div className="w-8 h-4 border-l-2 border-t-2 border-muted-foreground/30 rounded-tl" />
        <ReplyIcon className="size-3 rotate-180" />
      </div>
      <span className="font-medium">{author}</span>
      <span className="truncate max-w-xs">{content}</span>
    </button>
  );
}

// =============================================================================
// Date Separator
// =============================================================================

interface DateSeparatorProps {
  date: number | Date;
  className?: string;
}

function DateSeparator({ date, className }: DateSeparatorProps) {
  const dateObj = date instanceof Date ? date : new Date(date);

  return (
    <div className={cn('flex items-center gap-4 my-4', className)}>
      <Separator className="flex-1" />
      <span className="text-xs font-semibold text-muted-foreground px-2">
        {new Intl.DateTimeFormat('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }).format(dateObj)}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}

// =============================================================================
// New Messages Indicator
// =============================================================================

interface NewMessagesIndicatorProps {
  count: number;
  onClick?: () => void;
  className?: string;
}

function NewMessagesIndicator({ count, onClick, className }: NewMessagesIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-4 my-2', className)}>
      <Separator className="flex-1 bg-destructive/50" />
      <button
        onClick={onClick}
        className="text-xs font-semibold text-destructive px-2 hover:underline"
      >
        {count} new message{count !== 1 ? 's' : ''}
      </button>
      <Separator className="flex-1 bg-destructive/50" />
    </div>
  );
}

// =============================================================================
// Typing Indicator
// =============================================================================

interface TypingIndicatorProps {
  users: string[];
  className?: string;
}

function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  let text: string;
  if (users.length === 1) {
    text = `${users[0]} is typing...`;
  } else if (users.length === 2) {
    text = `${users[0]} and ${users[1]} are typing...`;
  } else if (users.length === 3) {
    text = `${users[0]}, ${users[1]}, and ${users[2]} are typing...`;
  } else {
    text = 'Several people are typing...';
  }

  return (
    <div
      className={cn('flex items-center gap-2 px-4 py-1 text-xs text-muted-foreground', className)}
    >
      <div className="flex gap-1">
        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" />
      </div>
      <span>{text}</span>
    </div>
  );
}

// =============================================================================
// Chat Input / Toolbar
// =============================================================================

function ChatToolbar({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('px-4 pb-4 pt-0', className)} {...props}>
      <div
        className={cn(
          'bg-muted/50 rounded-lg border',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
          'transition-shadow',
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ChatToolbarRow({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex items-center gap-1 px-2', className)} {...props}>
      {children}
    </div>
  );
}

function ChatToolbarButton({ tooltip, children, className, ...props }: ChatHeaderButtonProps) {
  const button = (
    <Button
      variant="ghost"
      size="icon"
      className={cn('size-8 text-muted-foreground hover:text-foreground', className)}
      {...props}
    >
      {children}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
        <Tooltip.Content side="top">{tooltip}</Tooltip.Content>
      </Tooltip>
    );
  }

  return button;
}

function ChatToolbarTextarea({ className, ...props }: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      placeholder="Message #channel"
      className={cn(
        'min-h-11 max-h-40 px-3 py-2.5 text-sm resize-none',
        'border-0 bg-transparent shadow-none',
        'focus-visible:ring-0 focus-visible:ring-offset-0',
        'placeholder:text-muted-foreground/60',
        className,
      )}
      rows={1}
      {...props}
    />
  );
}

function ChatToolbarDivider({ className }: { className?: string }) {
  return <Separator orientation="vertical" className={cn('h-6 mx-1', className)} />;
}

// =============================================================================
// Chat Input Component (Pre-built)
// =============================================================================

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  channelName?: string;
}

function ChatInput({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  channelName,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSend();
      }
    }
  };

  return (
    <ChatToolbar>
      <ChatToolbarRow className="pt-1">
        <ChatToolbarButton tooltip="Attach file">
          <PlusIcon className="size-5" />
        </ChatToolbarButton>
      </ChatToolbarRow>
      <ChatToolbarTextarea
        value={value}
        onChange={(e) => onChange((e.target as HTMLTextAreaElement).value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || `Message ${channelName ? `#${channelName}` : ''}`}
        disabled={disabled}
      />
      <ChatToolbarRow className="pb-1">
        <ChatToolbarButton tooltip="Add emoji">
          <SmileIcon className="size-5" />
        </ChatToolbarButton>
        <ChatToolbarButton tooltip="Send GIF">
          <GifIcon className="size-5" />
        </ChatToolbarButton>
        <ChatToolbarButton tooltip="Upload image">
          <ImageIcon className="size-5" />
        </ChatToolbarButton>
        <div className="flex-1" />
        <Button
          size="sm"
          className="h-8 px-4"
          onClick={onSend}
          disabled={disabled || !value.trim()}
        >
          <SendIcon className="size-4 mr-2" />
          Send
        </Button>
      </ChatToolbarRow>
    </ChatToolbar>
  );
}

// =============================================================================
// Prebuilt Full Message Component
// =============================================================================

interface FullMessageProps {
  id: string;
  author: {
    name: string;
    avatarUrl?: string;
    status?: StatusType;
    roleColor?: string;
  };
  content: React.ReactNode;
  timestamp: number | Date;
  isEdited?: boolean;
  isFirst?: boolean;
  reactions?: Reaction[];
  replyTo?: {
    author: string;
    content: string;
  };
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  className?: string;
}

function FullMessage({
  author,
  content,
  timestamp,
  isEdited,
  isFirst = true,
  reactions = [],
  replyTo,
  onReply,
  onEdit,
  onDelete,
  onReact,
  canEdit,
  canDelete,
  className,
}: FullMessageProps) {
  return (
    <MessageGroup className={className}>
      {replyTo && <ReplyPreview author={replyTo.author} content={replyTo.content} />}
      <Message isFirst={isFirst}>
        {isFirst && (
          <MessageAvatar src={author.avatarUrl} alt={author.name} status={author.status} />
        )}
        <div className="flex-1 min-w-0">
          {isFirst && (
            <MessageHeader
              author={author.name}
              timestamp={timestamp}
              isEdited={isEdited}
              roleColor={author.roleColor}
            />
          )}
          <MessageContent>{content}</MessageContent>
          <MessageReactions reactions={reactions} onReact={onReact} />
        </div>
      </Message>
      {!isFirst && <MessageTimestamp timestamp={timestamp} />}
      <MessageActions
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </MessageGroup>
  );
}

// =============================================================================
// Channel/Room List Sidebar Components
// =============================================================================

function ChannelList({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col h-full bg-muted/30', className)} {...props}>
      {children}
    </div>
  );
}

function ChannelListHeader({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'h-12 min-h-12 px-4 flex items-center justify-between',
        'border-b shadow-sm font-semibold',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function ChannelListSection({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('py-2', className)} {...props}>
      {children}
    </div>
  );
}

interface ChannelListSectionTitleProps extends React.ComponentProps<'button'> {
  collapsed?: boolean;
}

function ChannelListSectionTitle({
  children,
  collapsed,
  className,
  ...props
}: ChannelListSectionTitleProps) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-1 px-2 py-1 text-xs font-semibold text-muted-foreground',
        'uppercase tracking-wide hover:text-foreground transition-colors',
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className={cn('size-3 transition-transform', collapsed && '-rotate-90')} />
      {children}
    </button>
  );
}

interface ChannelListItemProps extends React.ComponentProps<'button'> {
  icon?: React.ReactNode;
  active?: boolean;
  unread?: boolean;
  muted?: boolean;
}

function ChannelListItem({
  children,
  icon,
  active,
  unread,
  muted,
  className,
  ...props
}: ChannelListItemProps) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 mx-2 rounded-md',
        'text-sm transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : unread
            ? 'text-foreground hover:bg-accent/50'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        muted && 'opacity-50',
        className,
      )}
      {...props}
    >
      <span className="text-muted-foreground">{icon || <HashIcon className="size-4" />}</span>
      <span className={cn('flex-1 truncate text-left', unread && 'font-semibold')}>{children}</span>
    </button>
  );
}

// =============================================================================
// Member List Sidebar Components
// =============================================================================

function MemberList({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <ScrollArea className={cn('w-60 border-l bg-muted/20', className)} {...props}>
      <div className="py-4">{children}</div>
    </ScrollArea>
  );
}

function MemberListSection({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

function MemberListSectionTitle({
  children,
  count,
  className,
  ...props
}: React.ComponentProps<'div'> & { count?: number }) {
  return (
    <div
      className={cn(
        'px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide',
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && ` — ${count}`}
    </div>
  );
}

interface MemberListItemProps extends React.ComponentProps<'button'> {
  avatarUrl?: string;
  name: string;
  status?: StatusType;
  role?: string;
  roleColor?: string;
}

function MemberListItem({
  avatarUrl,
  name,
  status = 'offline',
  role,
  roleColor,
  className,
  ...props
}: MemberListItemProps) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-4 py-1.5 rounded-md mx-2',
        'hover:bg-accent/50 transition-colors',
        status === 'offline' && 'opacity-50',
        className,
      )}
      {...props}
    >
      <div className="relative">
        <Avatar className="size-8">
          <Avatar.Image src={avatarUrl} alt={name} />
          <Avatar.Fallback className="text-xs">{name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
        </Avatar>
        <StatusBadge status={status} className="size-2.5" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div
          className="text-sm font-medium truncate"
          style={roleColor ? { color: roleColor } : undefined}
        >
          {name}
        </div>
        {role && <div className="text-xs text-muted-foreground truncate">{role}</div>}
      </div>
    </button>
  );
}

// =============================================================================
// Export with namespace pattern
// =============================================================================

export const Chat = Object.assign(ChatRoot, {
  // Header
  Header: Object.assign(ChatHeader, {
    Icon: ChatHeaderIcon,
    Title: ChatHeaderTitle,
    Description: ChatHeaderDescription,
    Divider: ChatHeaderDivider,
    Actions: ChatHeaderActions,
    Button: ChatHeaderButton,
  }),

  // Messages area
  Messages: ChatMessages,

  // Message components
  MessageGroup,
  Message: Object.assign(Message, {
    Avatar: MessageAvatar,
    Header: MessageHeader,
    Content: MessageContent,
    Timestamp: MessageTimestamp,
    Actions: MessageActions,
    Reactions: MessageReactions,
  }),
  FullMessage,
  ReplyPreview,
  DateSeparator,
  NewMessagesIndicator,
  TypingIndicator,

  // Input
  Toolbar: Object.assign(ChatToolbar, {
    Row: ChatToolbarRow,
    Button: ChatToolbarButton,
    Textarea: ChatToolbarTextarea,
    Divider: ChatToolbarDivider,
  }),
  Input: ChatInput,

  // Sidebar - Channels
  ChannelList: Object.assign(ChannelList, {
    Header: ChannelListHeader,
    Section: ChannelListSection,
    SectionTitle: ChannelListSectionTitle,
    Item: ChannelListItem,
  }),

  // Sidebar - Members
  MemberList: Object.assign(MemberList, {
    Section: MemberListSection,
    SectionTitle: MemberListSectionTitle,
    Item: MemberListItem,
  }),

  // Utility
  StatusBadge,
});

// Also export types
export type { StatusType, Reaction };
