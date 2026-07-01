import type { MensajesPageState } from '../types/mensajesTypes'

export function getMensajesPage(): MensajesPageState {
  return {
    title: 'Mensajes',
    conversations: [],
  }
}
