import type { LoginPageState, RegisterPageState } from '../types/loginTypes'

export function getLoginPage(): Pick<
  LoginPageState,
  'brand' | 'subtitle' | 'forgotPasswordUrl' | 'registerUrl'
> {
  return {
    brand: 'CIEM',
    subtitle: 'Bienvenido de nuevo',
    forgotPasswordUrl: '#recuperar-contrasena',
    registerUrl: '#registro',
  }
}

export function getRegisterPage(): RegisterPageState {
  return {
    brand: 'CIEM',
    title: 'Crea tu perfil profesional',
    subtitle: 'Unete a la red de marketing en Trujillo',
    isSubmitting: false,
    roles: [
      {
        id: 'emprendedor',
        label: 'Emprendedor',
        icon: '/registro/emprendedor.png',
        activeIcon: '/registro/emprendedor-activo.png',
      },
      {
        id: 'influencer',
        label: 'Influencer',
        icon: '/registro/influencer.png',
        activeIcon: '/registro/influencer-activo.png',
        isActive: true,
      },
      {
        id: 'marketing',
        label: 'Experto/a en Marketing',
        icon: '/registro/marketing.png',
        activeIcon: '/registro/marketing-activo.png',
      },
      {
        id: 'otro',
        label: 'Especificar rol',
        icon: '/registro/especificar-rol.png',
        activeIcon: '/registro/especificar-rol-activo.png',
      },
    ],
    suggestedTags: [
      {
        label: 'Influencer de brunch',
        icon: 'Food',
      },
      {
        label: 'Estudiante UNT',
        icon: 'Edu',
      },
      {
        label: 'Ex-disenador en Startup Lab',
        icon: 'Lab',
      },
      {
        label: 'Especialista en Growth Marketing',
        icon: 'Ads',
      },
      {
        label: 'Content Creator',
        icon: 'Cam',
      },
      {
        label: 'Community Manager',
        icon: 'Com',
      },
    ],
  }
}
