const AUTH_STORAGE_KEY = 'ciem-auth-session'

export type AuthSession = {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    fullName: string
    email: string
    role: string
  }
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const storedSession = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return storedSession ? (JSON.parse(storedSession) as AuthSession) : null
  } catch {
    return null
  }
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}
