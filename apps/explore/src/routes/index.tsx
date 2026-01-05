/**
 * SSE Demo Page
 *
 * Demonstrates the @sse package by connecting to /api/events
 * and displaying received events in real-time.
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge } from '@shadcn';
import { MessageCircle, Megaphone } from 'lucide-react';
import { Wifi, WifiOff, Radio, MessageSquare, User, Bell, RefreshCw } from 'lucide-react';
import { DemoEvent } from '../features/sse-demo/schema.js';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface EventLogEntry {
  id: string;
  event: DemoEvent;
  receivedAt: number;
}

export const Route = createFileRoute('/')({
  component: SseDemoPage,
});

function SseDemoPage() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (eventSource) {
      eventSource.close();
    }

    setStatus('connecting');
    setError(null);

    const es = new EventSource('/api/events');

    es.onopen = () => {
      console.log('[SSE Demo] Connected');
      setStatus('connected');
    };

    es.onerror = (err) => {
      console.error('[SSE Demo] Error:', err);
      setStatus('error');
      setError('Connection error - will retry automatically');
    };

    es.onmessage = (event) => {
      if (!event.data || event.data.trim() === '') {
        return; // Skip keepalive
      }

      try {
        const parsed = JSON.parse(event.data) as DemoEvent;
        const entry: EventLogEntry = {
          id: crypto.randomUUID(),
          event: parsed,
          receivedAt: Date.now(),
        };

        setEvents((prev) => [entry, ...prev].slice(0, 50)); // Keep last 50 events
      } catch (err) {
        console.warn('[SSE Demo] Failed to parse event:', event.data, err);
      }
    };

    setEventSource(es);
  }, [eventSource]);

  const disconnect = useCallback(() => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setStatus('disconnected');
  }, [eventSource]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">SSE Demo</h1>
        <p className="text-muted-foreground">
          Real-time Server-Sent Events demonstration using the @sse package.
        </p>
      </div>

      {/* Connection Status Card */}
      <Card className="mb-6">
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <ConnectionStatusIcon status={status} />
            Connection Status
          </Card.Title>
          <Card.Description>
            {status === 'connected' && 'Receiving events from /api/events'}
            {status === 'connecting' && 'Establishing connection...'}
            {status === 'disconnected' && 'Not connected'}
            {status === 'error' && error}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="flex gap-3">
            {status === 'connected' ? (
              <Button variant="destructive" onClick={disconnect}>
                <WifiOff className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            ) : (
              <Button onClick={connect} disabled={status === 'connecting'}>
                <Wifi className="w-4 h-4 mr-2" />
                {status === 'connecting' ? 'Connecting...' : 'Connect'}
              </Button>
            )}
            <Button variant="outline" onClick={clearEvents}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Events
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Events Log */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center justify-between">
            <span>Event Log</span>
            <Badge variant="secondary">{events.length} events</Badge>
          </Card.Title>
          <Card.Description>
            Most recent events appear at the top. Keeping last 50 events.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {status === 'connected'
                ? 'Waiting for events...'
                : 'Connect to start receiving events'}
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {events.map((entry) => (
                <EventCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Demo Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Chat Demo Link */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat Demo
            </Card.Title>
            <Card.Description>
              Try the real-time chat UI components from the @chat package
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <a href="/chat">
              <Button>
                <MessageCircle className="w-4 h-4 mr-2" />
                Open Chat Demo
              </Button>
            </a>
          </Card.Content>
        </Card>

        {/* Announcements Demo Link */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Announcements Demo
            </Card.Title>
            <Card.Description>
              Role-based announcements with visibility levels and permissions
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <a href="/announcements">
              <Button>
                <Megaphone className="w-4 h-4 mr-2" />
                Open Announcements
              </Button>
            </a>
          </Card.Content>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="mt-6">
        <Card.Header>
          <Card.Title>About This Demo</Card.Title>
        </Card.Header>
        <Card.Content className="prose prose-sm dark:prose-invert">
          <p>
            This demo showcases the <code>@sse</code> package which provides a clean API for
            Server-Sent Events in TanStack Start applications.
          </p>
          <h4>Event Types</h4>
          <ul>
            <li>
              <strong>TickEvent</strong> - Sent every 2 seconds with an incrementing counter
            </li>
            <li>
              <strong>ChatMessage</strong> - Random chat messages from simulated users
            </li>
            <li>
              <strong>UserStatusEvent</strong> - User online/offline/away status changes
            </li>
            <li>
              <strong>NotificationEvent</strong> - System notifications with different severity
              levels
            </li>
          </ul>
        </Card.Content>
      </Card>
    </div>
  );
}

function ConnectionStatusIcon({ status }: { status: ConnectionStatus }) {
  switch (status) {
    case 'connected':
      return <Wifi className="w-5 h-5 text-green-500" />;
    case 'connecting':
      return <Radio className="w-5 h-5 text-yellow-500 animate-pulse" />;
    case 'error':
      return <WifiOff className="w-5 h-5 text-red-500" />;
    default:
      return <WifiOff className="w-5 h-5 text-muted-foreground" />;
  }
}

function EventCard({ entry }: { entry: EventLogEntry }) {
  const { event } = entry;
  const time = new Date(entry.receivedAt).toLocaleTimeString();

  switch (event._tag) {
    case 'TickEvent':
      return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Radio className="w-4 h-4 text-blue-500" />
          <div className="flex-1">
            <div className="font-medium">Tick #{event.count}</div>
            <div className="text-sm text-muted-foreground">Heartbeat event</div>
          </div>
          <Badge variant="outline">tick</Badge>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
      );

    case 'ChatMessage':
      return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <MessageSquare className="w-4 h-4 text-green-500" />
          <div className="flex-1">
            <div className="font-medium">{event.username}</div>
            <div className="text-sm text-muted-foreground">{event.text}</div>
          </div>
          <Badge variant="outline">chat</Badge>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
      );

    case 'UserStatusEvent':
      return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <User className="w-4 h-4 text-purple-500" />
          <div className="flex-1">
            <div className="font-medium">{event.username}</div>
            <div className="text-sm text-muted-foreground">Status changed to {event.status}</div>
          </div>
          <Badge
            variant={
              event.status === 'online'
                ? 'default'
                : event.status === 'away'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {event.status}
          </Badge>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
      );

    case 'NotificationEvent':
      return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Bell className="w-4 h-4 text-orange-500" />
          <div className="flex-1">
            <div className="font-medium">{event.title}</div>
            <div className="text-sm text-muted-foreground">{event.message}</div>
          </div>
          <Badge
            variant={
              event.type === 'error'
                ? 'destructive'
                : event.type === 'success'
                  ? 'default'
                  : event.type === 'warning'
                    ? 'secondary'
                    : 'outline'
            }
          >
            {event.type}
          </Badge>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
      );

    default:
      return null;
  }
}
