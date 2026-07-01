export type MessagesNavigationItem = 'inicio' | 'mensajes' | 'perfil'

const messagesNavigationImages: Record<MessagesNavigationItem, string> = {
  inicio: '/menu/panel-menu.png',
  mensajes: '/menu/panel-mensajes.png',
  perfil: '/menu/panel-perfil.png',
}

export function getMessagesNavigationImage(item: MessagesNavigationItem) {
  return messagesNavigationImages[item]
}

export function getMessagesTitleImage() {
  return '/menu/mensajes-title.png'
}

export function getMessagesEmptyImage() {
  return '/menu/panel-mensajes.png'
}
