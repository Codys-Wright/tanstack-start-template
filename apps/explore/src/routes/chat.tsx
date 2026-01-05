/**
 * Chat Demo Page with SSE
 *
 * Demonstrates the @chat package with real-time messaging via SSE.
 * Receives random messages from /api/chat endpoint.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Button, Badge } from '@shadcn';
import { Chat } from '@chat/components';
import { ArrowLeft, Users, Hash, Plus, Wifi, WifiOff, Radio, MessageSquare } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface ChatUser {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
}

interface ChatMessage {
  _tag: 'ChatMessage';
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: number;
}

interface UserTyping {
  _tag: 'UserTyping';
  roomId: string;
  userId: string;
  isTyping: boolean;
}

interface UserJoined {
  _tag: 'UserJoined';
  roomId: string;
  userId: string;
  timestamp: number;
}

interface UserLeft {
  _tag: 'UserLeft';
  roomId: string;
  userId: string;
  timestamp: number;
}

interface Connected {
  _tag: 'Connected';
  connectionId: string;
  timestamp: number;
}

interface UsersInfo {
  _tag: 'UsersInfo';
  users: ChatUser[];
}

type ChatEvent = ChatMessage | UserTyping | UserJoined | UserLeft | Connected | UsersInfo;

interface MockRoom {
  id: string;
  name: string;
  type: 'group' | 'direct' | 'channel';
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_ROOMS: MockRoom[] = [
  { id: 'room1', name: 'General', type: 'channel' },
  { id: 'room2', name: 'Random', type: 'channel' },
  { id: 'room3', name: 'Development', type: 'channel' },
];

const CURRENT_USER: ChatUser = {
  id: 'currentUser',
  name: 'You',
  username: 'you',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
};

// =============================================================================
// Route
// =============================================================================

export const Route = createFileRoute('/chat')({
  component: ChatDemoPage,
});

// =============================================================================
// Components
// =============================================================================

function ChatDemoPage() {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room1');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [users, setUsers] = useState<Record<string, ChatUser>>({
    currentUser: CURRENT_USER,
  });
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [typingUsers, setTypingUsers] = useState<Record<string, Set<string>>>({});
  const [eventCount, setEventCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const selectedRoom = useMemo(
    () => MOCK_ROOMS.find((r) => r.id === selectedRoomId),
    [selectedRoomId],
  );

  const roomMessages = useMemo(() => messages[selectedRoomId] ?? [], [messages, selectedRoomId]);

  // Connect to SSE
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setStatus('connecting');

    const es = new EventSource('/api/chat');
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log('[Chat SSE] Connected');
      setStatus('connected');
    };

    es.onerror = (err) => {
      console.error('[Chat SSE] Error:', err);
      setStatus('error');
    };

    es.onmessage = (event) => {
      if (!event.data || event.data.trim() === '') {
        return;
      }

      try {
        const parsed = JSON.parse(event.data) as ChatEvent;
        setEventCount((c) => c + 1);

        switch (parsed._tag) {
          case 'ChatMessage':
            setMessages((prev) => ({
              ...prev,
              [parsed.roomId]: [...(prev[parsed.roomId] ?? []), parsed],
            }));
            break;

          case 'UsersInfo':
            setUsers((prev) => {
              const newUsers = { ...prev };
              for (const user of parsed.users) {
                newUsers[user.id] = user;
              }
              return newUsers;
            });
            break;

          case 'UserTyping':
            setTypingUsers((prev) => {
              const roomTyping = new Set(prev[parsed.roomId] ?? []);
              if (parsed.isTyping) {
                roomTyping.add(parsed.userId);
              } else {
                roomTyping.delete(parsed.userId);
              }
              return { ...prev, [parsed.roomId]: roomTyping };
            });
            // Auto-clear typing after 3 seconds
            setTimeout(() => {
              setTypingUsers((prev) => {
                const roomTyping = new Set(prev[parsed.roomId] ?? []);
                roomTyping.delete(parsed.userId);
                return { ...prev, [parsed.roomId]: roomTyping };
              });
            }, 3000);
            break;

          case 'Connected':
            console.log('[Chat SSE] Connection ID:', parsed.connectionId);
            break;

          case 'UserJoined':
          case 'UserLeft':
            // Could show a system message here
            break;
        }
      } catch (err) {
        console.warn('[Chat SSE] Failed to parse:', event.data, err);
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;

    // Add local message (in a real app, this would go through the server)
    const newMessage: ChatMessage = {
      _tag: 'ChatMessage',
      id: crypto.randomUUID(),
      roomId: selectedRoomId,
      senderId: 'currentUser',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => ({
      ...prev,
      [selectedRoomId]: [...(prev[selectedRoomId] ?? []), newMessage],
    }));
    setInputValue('');
  }, [inputValue, selectedRoomId]);

  // Group messages by sender for consecutive messages
  const groupedMessages = useMemo(() => {
    const groups: Array<{ senderId: string; messages: ChatMessage[] }> = [];

    for (const msg of roomMessages) {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.senderId === msg.senderId) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ senderId: msg.senderId, messages: [msg] });
      }
    }

    return groups;
  }, [roomMessages]);

  // Get typing indicator text
  const typingText = useMemo(() => {
    const typing = typingUsers[selectedRoomId];
    if (!typing || typing.size === 0) return null;

    const names = Array.from(typing)
      .map((id) => users[id]?.name ?? 'Someone')
      .slice(0, 3);

    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else {
      return `${names[0]} and ${names.length - 1} others are typing...`;
    }
  }, [typingUsers, selectedRoomId, users]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b p-4 flex items-center gap-4">
        <a href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </a>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Chat Demo with SSE</h1>
          <p className="text-sm text-muted-foreground">Real-time messages via Server-Sent Events</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <MessageSquare className="w-3 h-3" />
            {eventCount} events
          </Badge>
          <ConnectionStatusBadge status={status} />
          {status === 'connected' ? (
            <Button variant="outline" size="sm" onClick={disconnect}>
              <WifiOff className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          ) : (
            <Button size="sm" onClick={connect} disabled={status === 'connecting'}>
              <Wifi className="w-4 h-4 mr-2" />
              {status === 'connecting' ? 'Connecting...' : 'Connect'}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar - Room List */}
        <aside className="w-64 border-r flex flex-col">
          <div className="p-3 border-b">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Channels
            </h2>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            {MOCK_ROOMS.map((room) => {
              const roomMsgCount = messages[room.id]?.length ?? 0;
              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                    selectedRoomId === room.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{room.name}</span>
                  {roomMsgCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {roomMsgCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t">
            <Button variant="outline" className="w-full" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Channel
            </Button>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col">
          {selectedRoom ? (
            <Chat className="flex-1">
              <Chat.Header>
                <Chat.Header.Start>
                  <Hash className="w-5 h-5" />
                </Chat.Header.Start>
                <Chat.Header.Main>
                  <span className="font-semibold">{selectedRoom.name}</span>
                  {typingText && (
                    <span className="text-xs text-muted-foreground ml-2 animate-pulse">
                      {typingText}
                    </span>
                  )}
                </Chat.Header.Main>
                <Chat.Header.End>
                  <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    {Object.keys(users).length} users
                  </Badge>
                </Chat.Header.End>
              </Chat.Header>

              <Chat.Messages>
                {roomMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {status === 'connected'
                      ? 'Waiting for messages...'
                      : 'Connect to receive messages'}
                  </div>
                ) : (
                  [...groupedMessages].reverse().map((group, groupIndex) => {
                    const sender = users[group.senderId] ?? {
                      id: group.senderId,
                      name: 'Unknown User',
                      username: 'unknown',
                      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.senderId}`,
                    };
                    const reversedMessages = [...group.messages].reverse();

                    return (
                      <div key={`group-${groupIndex}`}>
                        {reversedMessages.map((msg, msgIndex) => {
                          const isFirst = msgIndex === reversedMessages.length - 1;

                          if (isFirst) {
                            return (
                              <Chat.PrimaryMessage
                                key={msg.id}
                                senderName={sender.name}
                                content={msg.content}
                                timestamp={msg.timestamp}
                                avatarSrc={sender.avatarUrl}
                                avatarAlt={sender.name}
                                avatarFallback={sender.name?.charAt(0) ?? '?'}
                              />
                            );
                          }

                          return (
                            <Chat.AdditionalMessage
                              key={msg.id}
                              content={msg.content}
                              timestamp={msg.timestamp}
                            />
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </Chat.Messages>

              <Chat.Input
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSend}
                placeholder={`Message #${selectedRoom.name}`}
              />
            </Chat>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a channel to start chatting
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  switch (status) {
    case 'connected':
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <Wifi className="w-3 h-3" />
          Connected
        </Badge>
      );
    case 'connecting':
      return (
        <Badge variant="secondary" className="gap-1">
          <Radio className="w-3 h-3 animate-pulse" />
          Connecting
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="destructive" className="gap-1">
          <WifiOff className="w-3 h-3" />
          Error
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <WifiOff className="w-3 h-3" />
          Disconnected
        </Badge>
      );
  }
}
