/**
 * @chat Client
 *
 * RPC client for the chat system using AtomRpc pattern.
 */

import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { ChatRpc } from '../domain/rpc.js';

/**
 * ChatClient - RPC client for the Chat feature.
 *
 * Provides:
 * - ChatClient.query("chat_listRooms", ...) - for read queries
 * - ChatClient.mutation("chat_sendMessage") - for mutations
 * - ChatClient.runtime - for custom atoms
 * - ChatClient.layer - for Effect services
 * - ChatClient (as Context.Tag) - yields the raw RPC client
 */
export class ChatClient extends AtomRpc.Tag<ChatClient>()('@chat/ChatClient', {
  group: ChatRpc,
  protocol: RpcProtocol,
}) {}
