/**
 * Chat Demo Page
 *
 * Demonstrates the @chat package with real-time messaging UI.
 * Uses mock data for demonstration purposes.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useMemo } from 'react';
import { Button, Badge, Avatar } from '@shadcn';
import { Chat } from '@chat/components';
import { ArrowLeft, Users, Hash, Plus } from 'lucide-react';

// =============================================================================
// Types (mock data)
// =============================================================================

interface MockUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away';
}

interface MockMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
}

interface MockRoom {
  id: string;
  name: string;
  type: 'group' | 'direct' | 'channel';
  memberIds: string[];
}

// =============================================================================
// Mock Data
// =============================================================================

const MOCK_USERS: Record<string, MockUser> = {
  user1: {
    id: 'user1',
    name: 'Alice Johnson',
    username: 'alice',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    status: 'online',
  },
  user2: {
    id: 'user2',
    name: 'Bob Smith',
    username: 'bob',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    status: 'away',
  },
  user3: {
    id: 'user3',
    name: 'Charlie Brown',
    username: 'charlie',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    status: 'online',
  },
  currentUser: {
    id: 'currentUser',
    name: 'You',
    username: 'you',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
    status: 'online',
  },
};

const MOCK_ROOMS: MockRoom[] = [
  {
    id: 'room1',
    name: 'General',
    type: 'channel',
    memberIds: ['user1', 'user2', 'user3', 'currentUser'],
  },
  {
    id: 'room2',
    name: 'Random',
    type: 'channel',
    memberIds: ['user1', 'user3', 'currentUser'],
  },
  {
    id: 'room3',
    name: 'Alice Johnson',
    type: 'direct',
    memberIds: ['user1', 'currentUser'],
  },
];

const MOCK_MESSAGES: Record<string, MockMessage[]> = {
  room1: [
    {
      id: 'm1',
      senderId: 'user1',
      content: 'Hey everyone! 👋',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'm2',
      senderId: 'user2',
      content: 'Hi Alice! How are you doing?',
      timestamp: Date.now() - 3500000,
    },
    {
      id: 'm3',
      senderId: 'user1',
      content: "I'm doing great, thanks for asking!",
      timestamp: Date.now() - 3400000,
    },
    {
      id: 'm4',
      senderId: 'user3',
      content: 'Good morning all!',
      timestamp: Date.now() - 3300000,
    },
    {
      id: 'm5',
      senderId: 'user1',
      content: 'Morning Charlie! Ready for the meeting later?',
      timestamp: Date.now() - 3200000,
    },
    {
      id: 'm6',
      senderId: 'user3',
      content: 'Yep, all prepared. Got my notes ready.',
      timestamp: Date.now() - 3100000,
    },
    {
      id: 'm7',
      senderId: 'user2',
      content: "Don't forget to share the agenda!",
      timestamp: Date.now() - 3000000,
    },
  ],
  room2: [
    {
      id: 'm8',
      senderId: 'user3',
      content: 'Anyone up for lunch?',
      timestamp: Date.now() - 7200000,
    },
    {
      id: 'm9',
      senderId: 'user1',
      content: 'Sure! Where do you want to go?',
      timestamp: Date.now() - 7100000,
    },
  ],
  room3: [
    {
      id: 'm10',
      senderId: 'user1',
      content: 'Hey, did you get my email?',
      timestamp: Date.now() - 86400000,
    },
    {
      id: 'm11',
      senderId: 'currentUser',
      content: 'Yes! Looking at it now.',
      timestamp: Date.now() - 86300000,
    },
  ],
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
  const [messages, setMessages] = useState<Record<string, MockMessage[]>>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');

  const selectedRoom = useMemo(
    () => MOCK_ROOMS.find((r) => r.id === selectedRoomId),
    [selectedRoomId],
  );

  const roomMessages = useMemo(() => messages[selectedRoomId] ?? [], [messages, selectedRoomId]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;

    const newMessage: MockMessage = {
      id: crypto.randomUUID(),
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
    const groups: Array<{ senderId: string; messages: MockMessage[] }> = [];

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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b p-4 flex items-center gap-4">
        <a href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </a>
        <div>
          <h1 className="text-xl font-bold">Chat Demo</h1>
          <p className="text-sm text-muted-foreground">Real-time chat UI using the @chat package</p>
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
            {MOCK_ROOMS.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                  selectedRoomId === room.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                }`}
              >
                {room.type === 'channel' ? (
                  <Hash className="w-4 h-4 text-muted-foreground" />
                ) : room.type === 'direct' ? (
                  <Avatar className="w-5 h-5">
                    <Avatar.Image
                      src={
                        MOCK_USERS[room.memberIds.find((id) => id !== 'currentUser') ?? '']
                          ?.avatarUrl
                      }
                    />
                    <Avatar.Fallback>{room.name.charAt(0)}</Avatar.Fallback>
                  </Avatar>
                ) : (
                  <Users className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{room.name}</span>
                {room.type !== 'direct' && (
                  <Badge variant="secondary" className="text-xs">
                    {room.memberIds.length}
                  </Badge>
                )}
              </button>
            ))}
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
                  {selectedRoom.type === 'channel' ? (
                    <Hash className="w-5 h-5" />
                  ) : (
                    <Users className="w-5 h-5" />
                  )}
                </Chat.Header.Start>
                <Chat.Header.Main>
                  <span className="font-semibold">{selectedRoom.name}</span>
                </Chat.Header.Main>
                <Chat.Header.End>
                  <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    {selectedRoom.memberIds.length} members
                  </Badge>
                </Chat.Header.End>
              </Chat.Header>

              <Chat.Messages>
                {/* Reverse the groups for flex-col-reverse */}
                {[...groupedMessages].reverse().map((group, groupIndex) => {
                  const sender = MOCK_USERS[group.senderId];
                  const reversedMessages = [...group.messages].reverse();

                  return (
                    <div key={`group-${groupIndex}`}>
                      {reversedMessages.map((msg, msgIndex) => {
                        const isFirst = msgIndex === reversedMessages.length - 1;

                        if (isFirst) {
                          return (
                            <Chat.PrimaryMessage
                              key={msg.id}
                              senderName={sender?.name ?? 'Unknown'}
                              content={msg.content}
                              timestamp={msg.timestamp}
                              avatarSrc={sender?.avatarUrl}
                              avatarAlt={sender?.name}
                              avatarFallback={sender?.name?.charAt(0) ?? '?'}
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
                })}
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
