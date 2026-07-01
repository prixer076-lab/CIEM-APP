import { apiRequest } from '../../../shared/api/apiClient'
import type { AuthSession } from '../../../shared/auth/authStorage'
import type { InicioProfile, InicioProfileRole } from '../types/inicioTypes'

type UserProfileResponse = {
  id: string
  fullName: string
  email: string
  role: string
  location: string
  avatar: string
  headline: string
  history: string
  isFollowing?: boolean
}

function normalizeRoleId(role: string): InicioProfileRole {
  const normalizedRole = role.trim().toLowerCase()

  if (normalizedRole === 'marketing') {
    return 'marketing'
  }

  if (normalizedRole === 'influencer') {
    return 'influencer'
  }

  if (normalizedRole === 'emprendedor' || normalizedRole === 'empresario') {
    return 'emprendedor'
  }

  return 'otro'
}

function buildUsername(email: string, fullName: string) {
  const cleanEmail = email.trim().toLowerCase()

  if (cleanEmail.includes('@')) {
    return `@${cleanEmail.split('@')[0]}`
  }

  return `@${fullName.trim().toLowerCase().replace(/\s+/g, '.')}`
}

export async function getInicioProfilesRequest(session?: AuthSession | null) {
  const users = await apiRequest<UserProfileResponse[]>('/users', {
    token: session?.accessToken,
    headers: session
      ? {
          'x-user-id': session.user.id,
        }
      : undefined,
  })

  return users.map<InicioProfile>((user, index) => ({
    id: Number.parseInt(user.id.replace(/\D/g, '').slice(-6), 10) || index + 1,
    userId: user.id,
    name: user.fullName,
    username: buildUsername(user.email, user.fullName),
    role: user.role,
    roleId: normalizeRoleId(user.role),
    location: user.location,
    description: user.history?.trim() || user.headline?.trim() || 'Miembro de la comunidad CIEM.',
    avatar: user.avatar?.trim() || user.fullName.trim().charAt(0).toUpperCase() || 'U',
    isFollowing: Boolean(user.isFollowing),
  }))
}
