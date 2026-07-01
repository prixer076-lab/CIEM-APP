import type { ConfiguracionPageState } from '../types/configuracionTypes'

export function getConfiguracionPage(): ConfiguracionPageState {
  return {
    title: 'Configuracion de Perfil',
    roles: [
      {
        id: 'emprendedor',
        label: 'Emprendedor',
        icon: '/roles/emprendedor.png',
        activeIcon: '/roles/emprendedor-activo.png',
        iconAlt: 'Icono de emprendedor',
      },
      {
        id: 'influencer',
        label: 'Influencer',
        icon: '/roles/influencer.png',
        activeIcon: '/roles/influencer-activo.png',
        iconAlt: 'Icono de influencer',
        isActive: true,
      },
      {
        id: 'marketing',
        label: 'Experto/a en Marketing',
        icon: '/roles/marketing.png',
        activeIcon: '/roles/marketing-activo.png',
        iconAlt: 'Icono de experto en marketing',
      },
      {
        id: 'otro',
        label: 'Especificar rol',
        icon: '/roles/especificar-rol.png',
        activeIcon: '/roles/especificar-rol-activo.png',
        iconAlt: 'Icono para especificar otro rol',
      },
    ],
    fullName: '',
    email: '',
    passwordPlaceholder: '',
    initials: 'M',
    selectedTags: [],
    suggestedTags: [],
    history: '',
    contactLines: [
      {
        label: 'Instagram',
        value: '@tuusuario',
        icon: 'IG',
      },
      {
        label: 'Email',
        value: 'contacto@email.com',
        icon: 'Mail',
      },
      {
        label: 'LinkedIn',
        value: 'linkedin.com/in/tuusuario',
        icon: 'In',
      },
      {
        label: 'WhatsApp',
        value: '+51 987 654 321',
        icon: 'Tel',
      },
    ],
    contactNotes: '',
  }
}
