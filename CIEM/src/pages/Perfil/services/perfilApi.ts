import { apiRequest } from '../../../shared/api/apiClient'
import type { AuthSession } from '../../../shared/auth/authStorage'

export type PerfilApiResponse = {
  brand: string
  avatar: string
  fullName: string
  email: string
  role: string
  headline: string
  location: string
  workMode: string
  history: string
  contactNotes: string
  skills: string[]
  stats?: {
    campaigns: number
    following: number
    followers: number
    isFollowing?: boolean
  }
  recentProjects: Array<{
    title: string
    company: string
    status: string
    statusTone: 'green' | 'blue'
  }>
}

export function getProfileRequest(session: AuthSession) {
  return apiRequest<PerfilApiResponse>('/profile/me', {
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
  })
}
