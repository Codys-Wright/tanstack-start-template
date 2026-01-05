/**
 * Chat Component
 *
 * Main chat container and sub-components following the namespace pattern.
 */

import * as React from 'react';
import { cn } from '@shadcn';
import { Avatar } from '@shadcn';
import { Button } from '@shadcn';
import { Textarea } from '@shadcn';
import { Separator } from '@shadcn';
import { SendIcon, PlusIcon, SmileIcon } from 'lucide-react';

// =============================================================================
// Chat Container
// =============================================================================

function ChatRoot({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('h-full overflow-hidden flex flex-col @container/chat', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Chat Header
// =============================================================================

function ChatHeader({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'sticky top-0 z-10 p-3 bg-background border-b flex items-center gap-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function ChatHeaderStart({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      {children}
    </div>
  );
}

function ChatHeaderMain({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex-1 flex items-center gap-2', className)} {...props}>
      {children}
    </div>
  );
}

function ChatHeaderEnd({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      {children}
    </div>
  );
}

// =============================================================================
// Chat Messages
// =============================================================================

function ChatMessages({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex-1 flex flex-col-reverse overflow-auto py-2 px-2', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Chat Event (Message wrapper)
// =============================================================================

function ChatEvent({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex gap-2 px-2 py-1', className)} {...props}>
      {children}
    </div>
  );
}

function ChatEventAddon({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('w-10 @md/chat:w-12 mt-1 shrink-0', className)} {...props}>
      {children}
    </div>
  );
}

function ChatEventBody({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex-1 flex flex-col', className)} {...props}>
      {children}
    </div>
  );
}

function ChatEventContent({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('text-sm @md/chat:text-base', className)} {...props}>
      {children}
    </div>
  );
}

function ChatEventTitle({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('font-medium text-sm @md/chat:text-base', className)} {...props}>
      {children}
    </div>
  );
}

function ChatEventDescription({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('text-xs text-muted-foreground', className)} {...props}>
      {children}
    </div>
  );
}

// =============================================================================
// Chat Toolbar
// =============================================================================

function ChatToolbar({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('sticky bottom-0 p-2 pt-0 bg-background', className)} {...props}>
      <div
        className={cn(
          'border rounded-md py-2 px-3',
          'grid grid-cols-[max-content_auto_max-content] gap-x-2',
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ChatToolbarAddonStart({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('h-10 row-start-1 col-start-1 flex items-center gap-1.5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ChatToolbarTextarea({ className, ...props }: React.ComponentProps<typeof Textarea>) {
  return (
    <div className="row-span-2 flex-1 grid">
      <Textarea
        placeholder="Type your message..."
        className={cn(
          'h-fit min-h-10 max-h-30 px-1 @md/chat:text-base',
          'border-none shadow-none focus-visible:border-none focus-visible:ring-0 placeholder:whitespace-nowrap resize-none',
          className,
        )}
        rows={1}
        {...props}
      />
    </div>
  );
}

function ChatToolbarAddonEnd({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'h-10 row-start-1 col-start-3 flex items-center gap-1 @md/chat:gap-1.5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Pre-built Message Components
// =============================================================================

interface PrimaryMessageProps {
  avatarSrc?: string;
  avatarAlt?: string;
  avatarFallback?: string;
  senderName: string;
  content: React.ReactNode;
  timestamp: number;
  className?: string;
}

function PrimaryMessage({
  avatarSrc,
  avatarAlt,
  avatarFallback,
  senderName,
  content,
  timestamp,
  className,
}: PrimaryMessageProps) {
  return (
    <ChatEvent className={cn('hover:bg-accent rounded-md', className)}>
      <ChatEventAddon>
        <Avatar className="rounded-full size-8 @md/chat:size-10 mx-auto">
          <Avatar.Image src={avatarSrc} alt={avatarAlt} />
          <Avatar.Fallback>{avatarFallback}</Avatar.Fallback>
        </Avatar>
      </ChatEventAddon>
      <ChatEventBody>
        <div className="flex items-baseline gap-2">
          <ChatEventTitle>{senderName}</ChatEventTitle>
          <ChatEventDescription>
            {new Intl.DateTimeFormat('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(timestamp)}
          </ChatEventDescription>
        </div>
        <ChatEventContent>{content}</ChatEventContent>
      </ChatEventBody>
    </ChatEvent>
  );
}

interface AdditionalMessageProps {
  content: React.ReactNode;
  timestamp: number;
}

function AdditionalMessage({ content, timestamp }: AdditionalMessageProps) {
  return (
    <ChatEvent className="hover:bg-accent rounded-md group">
      <ChatEventAddon>
        <ChatEventDescription className="text-right text-[8px] @md/chat:text-[10px] group-hover:visible invisible">
          {new Intl.DateTimeFormat('en-US', {
            timeStyle: 'short',
          }).format(timestamp)}
        </ChatEventDescription>
      </ChatEventAddon>
      <ChatEventBody>
        <ChatEventContent>{content}</ChatEventContent>
      </ChatEventBody>
    </ChatEvent>
  );
}

interface DateSeparatorProps {
  timestamp: number;
  className?: string;
}

function DateSeparator({ timestamp, className }: DateSeparatorProps) {
  return (
    <ChatEvent className={cn('items-center gap-1', className)}>
      <Separator className="flex-1" />
      <span className="text-muted-foreground text-xs font-semibold min-w-max px-2">
        {new Intl.DateTimeFormat('en-US', {
          dateStyle: 'long',
        }).format(timestamp)}
      </span>
      <Separator className="flex-1" />
    </ChatEvent>
  );
}

// =============================================================================
// Chat Input Component
// =============================================================================

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}

function ChatInput({ value, onChange, onSend, placeholder, disabled }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <ChatToolbar>
      <ChatToolbarAddonStart>
        <Button variant="ghost" size="icon" className="size-8">
          <PlusIcon className="size-5" />
        </Button>
      </ChatToolbarAddonStart>
      <ChatToolbarTextarea
        value={value}
        onChange={(e) => onChange((e.target as HTMLTextAreaElement).value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />
      <ChatToolbarAddonEnd>
        <Button variant="ghost" size="icon" className="size-8">
          <SmileIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onSend}
          disabled={disabled || !value.trim()}
        >
          <SendIcon className="size-4" />
        </Button>
      </ChatToolbarAddonEnd>
    </ChatToolbar>
  );
}

// =============================================================================
// Export with namespace pattern
// =============================================================================

export const Chat = Object.assign(ChatRoot, {
  Header: Object.assign(ChatHeader, {
    Start: ChatHeaderStart,
    Main: ChatHeaderMain,
    End: ChatHeaderEnd,
  }),
  Messages: ChatMessages,
  Event: Object.assign(ChatEvent, {
    Addon: ChatEventAddon,
    Body: ChatEventBody,
    Content: ChatEventContent,
    Title: ChatEventTitle,
    Description: ChatEventDescription,
  }),
  Toolbar: Object.assign(ChatToolbar, {
    AddonStart: ChatToolbarAddonStart,
    Textarea: ChatToolbarTextarea,
    AddonEnd: ChatToolbarAddonEnd,
  }),
  Input: ChatInput,
  PrimaryMessage,
  AdditionalMessage,
  DateSeparator,
});
