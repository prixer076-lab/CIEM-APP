import { apiRequest } from '../../../shared/api/apiClient'
import type { AuthSession } from '../../../shared/auth/authStorage'
import type { LoginFormState, RegisterFormState } from '../types/loginTypes'

type LoginResponse =
  | (AuthSession & { authenticated: true })
  | { authenticated: false; message: string }

type RegisterResponse =
  | (AuthSession & { created: true })
  | { created: false; message: string }

type SessionResponse =
  | (AuthSession & { authenticated: true })
  | { authenticated: false; message: string }

type LogoutResponse = {
  loggedOut: boolean
}

function resolveRole(form: RegisterFormState) {
  if (form.roleId === 'otro') {
    return form.customRole.trim() || 'otro'
  }

  return form.roleId
}

export async function loginRequest(form: LoginFormState): Promise<AuthSession> {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: {
      email: form.email.trim(),
      password: form.password,
    },
  })

  if (!response.authenticated) {
    throw new Error(response.message)
  }

  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    user: response.user,
  }
}

export async function registerRequest(form: RegisterFormState): Promise<AuthSession> {
  const response = await apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      role: resolveRole(form),
      skills: form.tags.map((tag) => tag.label.trim()).filter(Boolean),
      history: form.history.trim(),
      contactNotes: form.contactNotes.trim(),
    },
  })

  if (!response.created) {
    throw new Error(response.message)
  }

  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    user: response.user,
  }
}

export async function getCurrentSessionRequest(session: AuthSession): Promise<AuthSession> {
  const response = await apiRequest<SessionResponse>('/auth/me', {
    token: session.accessToken,
  })

  if (!response.authenticated) {
    throw new Error(response.message)
  }

  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    user: response.user,
  }
}

export async function logoutRequest(session: AuthSession) {
  return apiRequest<LogoutResponse>('/auth/logout', {
    method: 'POST',
    token: session.accessToken,
  })
}
