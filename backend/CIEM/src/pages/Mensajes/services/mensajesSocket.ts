import { io, type Socket } from 'socket.io-client'
import type { AuthSession } from '../../../shared/auth/authStorage'
import type { MensajeConversation } from '../types/mensajesTypes'

type ServerToClientEvents = {
  'conversation:updated': (conversation: MensajeConversation) => void
  'profile:updated': () => void
}

type ClientToServerEvents = {
  'connection:create': (
    payload: {
      author?: string
      avatar?: string
      initialMessage: string
      recipientUserId?: string | null
      isOnline?: boolean
    },
    response: (payload: {
      success: boolean
      message?: string
      conversation?: MensajeConversation
    }) => void,
  ) => void
  'message:send': (
    payload: {
      conversationId: string
      text: string
    },
    response: (payload: {
      success: boolean
      message?: string
      conversation?: MensajeConversation
    }) => void,
  ) => void
  'campaign:send': (
    payload: {
      conversationId: string
      type: 'collaboration' | 'talent'
      projectName: string
      description?: string
      requirements?: string
      deadline?: string
    },
    response: (payload: {
      success: boolean
      message?: string
      conversation?: MensajeConversation
    }) => void,
  ) => void
  'campaign:accept': (
    payload: {
      conversationId: string
      campaignMessageId: string
    },
    response: (payload: {
      success: boolean
      message?: string
      conversation?: MensajeConversation
    }) => void,
  ) => void
  'campaign:decline': (
    payload: {
      conversationId: string
      campaignMessageId: string
    },
    response: (payload: {
      success: boolean
      message?: string
      conversation?: MensajeConversation
    }) => void,
  ) => void
  'campaign:delete': (
    payload: {
      conversationId: string
      campaignMessageId: string
    },
    response: (payload: {
      success: boolean
      message?: string
      conversation?: MensajeConversation
    }) => void,
  ) => void
}

function normalizeApiBaseUrl(value?: string) {
  const fallback = 'http://localhost:4000/api/v1'
  const baseUrl = value?.trim() || fallback
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '')

  return cleanBaseUrl.endsWith('/api/v1') ? cleanBaseUrl : `${cleanBaseUrl}/api/v1`
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '')

export type MessagesSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export function createMessagesSocket(session: AuthSession): MessagesSocket {
  return io(SOCKET_URL, {
    timeout: 5000,
    reconnection: true,
    auth: {
      token: session.accessToken,
      userId: session.user.id,
    },
  })
}
