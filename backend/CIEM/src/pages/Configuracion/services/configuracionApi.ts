import { apiRequest } from '../../../shared/api/apiClient'
import type { AuthSession } from '../../../shared/auth/authStorage'
import type { ConfiguracionProfileState } from '../types/configuracionTypes'
import type { PerfilApiResponse } from '../../Perfil/services/perfilApi'

function resolveRole(settings: ConfiguracionProfileState) {
  return settings.selectedRole === 'otro'
    ? settings.customRole.trim() || 'otro'
    : settings.selectedRole
}

function resolveHeadline(settings: ConfiguracionProfileState) {
  return settings.selectedRole === 'otro'
    ? settings.customRole.trim() || 'otro'
    : resolveRole(settings)
}

export function getConfiguracionProfileRequest(session: AuthSession) {
  return apiRequest<PerfilApiResponse>('/profile/me', {
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
  })
}

export function getConfiguracionPreferencesRequest(session: AuthSession) {
  return apiRequest<{
    role: string
    headline: string
    skills: string[]
  }>('/profile/me/preferences', {
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
  })
}

export function getProfessionsStudiesRequest(session: AuthSession) {
  return apiRequest<{
    items: string[]
  }>('/profile/me/professions-studies', {
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
  })
}

export function saveConfiguracionPreferencesRequest(
  session: AuthSession,
  settings: ConfiguracionProfileState,
) {
  return apiRequest<{
    role: string
    headline: string
    skills: string[]
  }>('/profile/me/preferences', {
    method: 'PATCH',
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
    body: {
      role: resolveRole(settings),
      headline: resolveHeadline(settings),
      skills: settings.selectedTags.map((tag) => tag.label),
    },
  })
}

export function saveProfessionsStudiesRequest(
  session: AuthSession,
  settings: ConfiguracionProfileState,
) {
  return apiRequest<{
    items: string[]
  }>('/profile/me/professions-studies', {
    method: 'PATCH',
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
    body: {
      items: settings.selectedTags.map((tag) => tag.label),
    },
  })
}

export function saveConfiguracionProfileRequest(
  session: AuthSession,
  settings: ConfiguracionProfileState,
) {
  return apiRequest<PerfilApiResponse>('/profile/me', {
    method: 'PATCH',
    token: session.accessToken,
    headers: {
      'x-user-id': session.user.id,
    },
    body: {
      fullName: settings.fullName.trim(),
      password: settings.password.trim(),
      workMode: 'Freelance',
      history: settings.history.trim(),
      contactNotes: settings.contactNotes.trim(),
    },
  })
}
