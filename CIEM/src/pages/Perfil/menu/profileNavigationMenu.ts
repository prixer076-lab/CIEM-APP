export type ProfileNavigationItem = 'inicio' | 'mensajes' | 'perfil'

const profileNavigationImages: Record<ProfileNavigationItem, string> = {
  inicio: '/menu/panel-menu.png',
  mensajes: '/menu/panel-mensajes.png',
  perfil: '/menu/panel-perfil.png',
}

export function getProfileNavigationImage(item: ProfileNavigationItem) {
  return profileNavigationImages[item]
}
