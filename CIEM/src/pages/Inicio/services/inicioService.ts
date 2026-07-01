import type { InicioPageState } from '../types/inicioTypes'
import { getPublicationActionImage, getPublicationFilterImage } from '../menu/publicationMenu'

export function getInicioPage(): InicioPageState {
  return {
    brand: 'CIEM',
    filters: [
      { id: 'todo', label: 'Todo', icon: '' },
      { id: 'ayudas', label: 'Servicios', icon: '+', imageSrc: getPublicationFilterImage('ayudas') },
      {
        id: 'necesidades',
        label: 'Oportunidades',
        icon: '[]',
        imageSrc: getPublicationFilterImage('necesidades'),
      },
      { id: 'comunidad', label: 'Comunidad', icon: '#', imageSrc: getPublicationFilterImage('comunidad') },
    ],
    posts: [],
    profiles: [],
    quickActions: [
      {
        id: 'contenido',
        title: 'Publicar Contenido',
        description: 'Foto, video o actualizacion',
        icon: '[]',
        imageSrc: getPublicationActionImage('contenido'),
        tone: 'purple',
        category: 'comunidad',
        badge: 'Contenido General',
        placeholder: 'Que quieres compartir hoy?',
        suggestions: [],
      },
      {
        id: 'ayuda',
        title: 'Ofrecer Servicio',
        description: 'Servicios que puedes brindar',
        icon: '+',
        imageSrc: getPublicationActionImage('ayuda'),
        tone: 'green',
        category: 'ayudas',
        badge: 'Se ofrece servicio',
        placeholder: 'Describe que servicios puedes ofrecer...',
        suggestions: [
          'InfluencerDeBrunch',
          'EspecialistaEnInstagram',
          'FacebookAds',
          'MarketingGastronomico',
          'DisenoGrafico',
          'CommunityManager',
        ],
      },
      {
        id: 'necesidad',
        title: 'Publicar Oportunidad',
        description: 'Buscar colaboracion o servicio',
        icon: 'o',
        imageSrc: getPublicationActionImage('necesidad'),
        tone: 'blue',
        category: 'necesidades',
        badge: 'Se necesita servicio',
        placeholder: 'Describe que oportunidad estas buscando...',
        suggestions: [
          'BuscoInfluencer',
          'DisenoDeLogo',
          'CampanaTikTok',
          'SesionFotografica',
          'MarketingDigital',
          'RedesSociales',
        ],
      },
    ],
  }
}
