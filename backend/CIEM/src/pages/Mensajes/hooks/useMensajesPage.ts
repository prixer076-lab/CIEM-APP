import { getMensajesPage } from '../services/mensajesService'
import type { MensajeConversation } from '../types/mensajesTypes'

export function useMensajesPage(conversations?: MensajeConversation[]) {
  const page = getMensajesPage()

  return {
    ...page,
    conversations: conversations ?? page.conversations,
  }
}
