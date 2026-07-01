import { apiRequest } from '../../../shared/api/apiClient'
import type { AuthSession } from '../../../shared/auth/authStorage'
import type { PerfilApiResponse } from './perfilApi'

type FollowResponse = {
  campaigns: number
  following: number
  followers: number
  isFollowing: boolean
}

export function getPublicProfileRequest(userId: string, session?: AuthSession | null) {
  return apiRequest<PerfilApiResponse>(`/users/${userId}/profile`, {
    token: session?.accessToken,
    headers: session
      ? {
          'x-user-id': session.user.id,
        }
      : undefined,
  })
}

export function followUserRequest(userId: string, session: AuthSession) {
  return apiRequest<FollowResponse>(`/users/${userId}/follow`, {
    method: 'POST',
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
  })
}

export function unfollowUserRequest(userId: string, session: AuthSession) {
  return apiRequest<FollowResponse>(`/users/${userId}/follow`, {
    method: 'DELETE',
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
  })
}
