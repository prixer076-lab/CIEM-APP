import type { InicioCategory, InicioPostAction } from '../types/inicioTypes'

export type PanelNavigationItem = 'inicio' | 'mensajes' | 'perfil'

const publicationMenuImages: Record<InicioPostAction, string> = {
  contenido: '/menu/mensajes-comunidad.png',
  ayuda: '/menu/mensajes-ayudas.png',
  necesidad: '/menu/mensajes-necesidades.png',
}

const panelNavigationImages: Record<PanelNavigationItem, string> = {
  inicio: '/menu/panel-menu.png',
  mensajes: '/menu/panel-mensajes.png',
  perfil: '/menu/panel-perfil.png',
}

const filterMenuImages: Record<InicioCategory, string> = {
  comunidad: publicationMenuImages.contenido,
  ayudas: publicationMenuImages.ayuda,
  necesidades: publicationMenuImages.necesidad,
}

export function getPublicationActionImage(actionId: InicioPostAction) {
  return publicationMenuImages[actionId]
}

export function getPublicationFilterImage(category: InicioCategory) {
  return filterMenuImages[category]
}

export function getPanelNavigationImage(item: PanelNavigationItem) {
  return panelNavigationImages[item]
}
