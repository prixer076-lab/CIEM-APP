import type { PerfilPageState } from '../types/perfilTypes'

export function getPerfilPage(): PerfilPageState {
  return {
    title: 'Perfil',
    brand: 'CIEM',
    avatar: 'M',
    name: 'Tu perfil',
    email: '',
    headline: '',
    location: '',
    workMode: '',
    category: 'influencer',
    categoryLabel: '',
    verifiedLabel: '',
    stats: [
      {
        value: '0',
        label: 'Campañas',
      },
      {
        value: '0',
        label: 'Seguidos',
      },
      {
        value: '0',
        label: 'Seguidores',
      },
    ],
    about: [],
    skills: [],
    recentProjects: [],
  }
}
