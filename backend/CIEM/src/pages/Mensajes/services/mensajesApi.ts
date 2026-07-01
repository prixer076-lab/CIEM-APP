import { apiRequest } from '../../../shared/api/apiClient'
import type { AuthSession } from '../../../shared/auth/authStorage'
import type { MensajeConversation } from '../types/mensajesTypes'

export type CreateConnectionPayload = {
  author?: string
  avatar?: string
  initialMessage: string
  recipientUserId?: string | null
  isOnline?: boolean
}

function getSessionOptions(session: AuthSession) {
  return {
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
  }
}

export function getConversationsRequest(session: AuthSession) {
  return apiRequest<MensajeConversation[]>('/messages/conversations', getSessionOptions(session))
}

export function createConnectionRequest(session: AuthSession, payload: CreateConnectionPayload) {
  return apiRequest<MensajeConversation>('/messages/connections', {
    ...getSessionOptions(session),
    method: 'POST',
    body: payload,
  })
}

export function sendMessageRequest(session: AuthSession, conversationId: string, text: string) {
  return apiRequest<MensajeConversation['messages'][number]>(`/messages/conversations/${conversationId}/messages`, {
    ...getSessionOptions(session),
    method: 'POST',
    body: { text },
  })
}

export function markConversationReadRequest(session: AuthSession, conversationId: string) {
  return apiRequest<MensajeConversation>(`/messages/conversations/${conversationId}/read`, {
    ...getSessionOptions(session),
    method: 'PATCH',
  })
}
