import { PerfilContent } from './components/PerfilContent'
import { usePerfilPage } from './hooks/usePerfilPage'
import type { ConfiguracionProfileState, ConfiguracionRole } from '../Configuracion/types/configuracionTypes'
import type { PerfilProject, PerfilStat } from './types/perfilTypes'
import type { PerfilApiResponse } from './services/perfilApi'

type PerfilProps = {
  onBack?: () => void
  onOpenMessages?: () => void
  onSendMessage?: () => void
  onOpenSettings?: () => void
  profileSettings?: ConfiguracionProfileState
  roles?: ConfiguracionRole[]
  savedProjects?: PerfilProject[]
  profileData?: PerfilApiResponse | null
  hasUnreadMessages?: boolean
}

export default function Perfil({
  onBack,
  onOpenMessages,
  onSendMessage,
  onOpenSettings,
  profileSettings,
  roles = [],
  profileData,
  hasUnreadMessages = false,
}: PerfilProps) {
  const page = usePerfilPage()
  const roleLabel = getRoleLabel(profileSettings, roles)
  const resolvedRoleLabel = getDisplayRoleLabel(profileData?.role, roleLabel, roles)
  const apiAbout = [
    profileData?.history,
    profileData?.contactNotes ? `Contacto y notas: ${profileData.contactNotes}` : '',
  ].filter((item): item is string => Boolean(item?.trim()))
  const localAbout = [
    profileSettings?.history,
    profileSettings?.contactNotes ? `Contacto y notas: ${profileSettings.contactNotes}` : '',
  ].filter((item): item is string => Boolean(item?.trim()))

  const profilePage = {
    ...page,
    avatar:
      profileData?.avatar || getInitial(profileData?.fullName || profileSettings?.fullName) || page.avatar,
    name: profileData?.fullName || profileSettings?.fullName || page.name,
    email: profileData?.email || profileSettings?.email || page.email,
    headline: resolvedRoleLabel || page.headline,
    location: profileData?.location || page.location,
    workMode: profileData?.workMode || page.workMode,
    category: getProfileCategory(profileData?.role || profileSettings?.selectedRole) ?? page.category,
    categoryLabel: '',
    about: apiAbout.length ? apiAbout : localAbout.length ? localAbout : page.about,
    skills: profileData
      ? profileData.skills
      : profileSettings?.selectedTags.length
        ? profileSettings.selectedTags.map((tag) => tag.label)
        : page.skills,
    stats: getProfileStats(profileData, page.stats),
    recentProjects: profileData?.recentProjects ?? page.recentProjects,
  }

  return (
    <PerfilContent
      page={profilePage}
      onBack={onBack}
      onOpenMessages={onOpenMessages}
      onSendMessage={onSendMessage}
      onOpenSettings={onOpenSettings}
      hasUnreadMessages={hasUnreadMessages}
    />
  )
}

function getRoleLabel(
  profileSettings: ConfiguracionProfileState | undefined,
  roles: ConfiguracionRole[],
) {
  if (!profileSettings) {
    return ''
  }

  if (profileSettings.selectedRole === 'otro' && profileSettings.customRole) {
    return profileSettings.customRole
  }

  return roles.find((role) => role.id === profileSettings.selectedRole)?.label ?? ''
}

function getDisplayRoleLabel(
  apiRole: string | undefined,
  fallbackRoleLabel: string,
  roles: ConfiguracionRole[],
) {
  const normalizedApiRole = apiRole?.trim().toLowerCase()

  if (normalizedApiRole) {
    const matchedRole = roles.find((role) => role.id === normalizedApiRole)

    if (matchedRole) {
      return matchedRole.label
    }

    return apiRole?.trim() ?? fallbackRoleLabel
  }

  return fallbackRoleLabel
}

function getInitial(name = '') {
  return name.trim().charAt(0).toUpperCase()
}

function getProfileCategory(roleId = '') {
  if (roleId === 'influencer' || roleId === 'marketing') {
    return roleId
  }

  if (roleId === 'emprendedor' || roleId === 'empresario') {
    return 'empresario'
  }

  return undefined
}

function getProfileStats(
  profileData: PerfilApiResponse | null | undefined,
  fallbackStats: PerfilStat[],
) {
  if (profileData?.stats) {
    return [
      {
        value: String(profileData.stats.campaigns),
        label: 'Campañas',
      },
      {
        value: String(profileData.stats.following),
        label: 'Seguidos',
      },
      {
        value: String(profileData.stats.followers),
        label: 'Seguidores',
      },
    ]
  }

  return fallbackStats
}
