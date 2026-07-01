import { useEffect, useRef, useState } from 'react'
import Inicio from './pages/Inicio'
import Configuracion from './pages/Configuracion'
import Login from './pages/Login'
import Mensajes from './pages/Mensajes'
import Perfil from './pages/Perfil'
import { getConfiguracionPage } from './pages/Configuracion/services/configuracionService'
import {
  getCurrentSessionRequest,
  logoutRequest,
} from './pages/Login/services/authApi'
import {
  getConfiguracionProfileRequest,
  getConfiguracionPreferencesRequest,
  getProfessionsStudiesRequest,
  saveConfiguracionPreferencesRequest,
  saveConfiguracionProfileRequest,
  saveProfessionsStudiesRequest,
} from './pages/Configuracion/services/configuracionApi'
import { getMensajesPage } from './pages/Mensajes/services/mensajesService'
import {
  createConnectionRequest,
  type CreateConnectionPayload,
  getConversationsRequest,
  markConversationReadRequest,
  sendMessageRequest,
} from './pages/Mensajes/services/mensajesApi'
import { createMessagesSocket, type MessagesSocket } from './pages/Mensajes/services/mensajesSocket'
import type { ConfiguracionProfileState } from './pages/Configuracion/types/configuracionTypes'
import type {
  MensajeCampaignForm,
  MensajeCampaignType,
  MensajeConversation,
} from './pages/Mensajes/types/mensajesTypes'
import type { LoginFormState, RegisterFormState } from './pages/Login/types/loginTypes'
import type { InicioPost } from './pages/Inicio/types/inicioTypes'
import type { PerfilProject } from './pages/Perfil/types/perfilTypes'
import { PublicProfile } from './pages/Perfil/components/PublicProfile'
import { getProfileRequest, type PerfilApiResponse } from './pages/Perfil/services/perfilApi'
import {
  clearAuthSession,
  readAuthSession,
  saveAuthSession,
  type AuthSession,
} from './shared/auth/authStorage'

type AppView = 'inicio' | 'mensajes' | 'perfil' | 'perfil-publico' | 'configuracion'

const initialMessages = getMensajesPage().conversations
const initialConfiguracionPage = getConfiguracionPage()
const profileStorageKey = 'ciem-profile-settings'
const profileProjectsStorageKey = 'ciem-profile-projects'
const profileProjectsResetKey = 'ciem-profile-projects-reset-v1'
const defaultProfileSettings: ConfiguracionProfileState = {
  selectedRole:
    initialConfiguracionPage.roles.find((role) => role.isActive)?.id ??
    initialConfiguracionPage.roles[0]?.id ??
    '',
  customRole: '',
  fullName: initialConfiguracionPage.fullName,
  email: initialConfiguracionPage.email,
  password: initialConfiguracionPage.passwordPlaceholder,
  selectedTags: initialConfiguracionPage.selectedTags,
  history: initialConfiguracionPage.history,
  contactNotes: initialConfiguracionPage.contactNotes,
}

function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => readAuthSession())
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(readAuthSession()))
  const [authView, setAuthView] = useState<'login' | 'register'>('login')
  const [activeView, setActiveView] = useState<AppView>('inicio')
  const [conversations, setConversations] = useState<MensajeConversation[]>(initialMessages)
  const [selectedConversationId, setSelectedConversationId] = useState<string>()
  const [selectedPublicProfilePost, setSelectedPublicProfilePost] = useState<InicioPost>()
  const [loginCredentials, setLoginCredentials] = useState<Pick<LoginFormState, 'email' | 'password'>>({
    email: '',
    password: '',
  })
  const [profileSettings, setProfileSettings] = useState<ConfiguracionProfileState>(defaultProfileSettings)
  const [profileProjects, setProfileProjects] = useState<PerfilProject[]>([])
  const [profileData, setProfileData] = useState<PerfilApiResponse | null>(null)
  const messagesSocketRef = useRef<MessagesSocket | null>(null)
  const activeViewRef = useRef(activeView)
  const selectedConversationIdRef = useRef(selectedConversationId)

  const hasUnreadMessages = conversations.some((conversation) => conversation.unreadCount > 0)

  function upsertConversation(nextConversation: MensajeConversation) {
    setConversations((current) => {
      const exists = current.some((conversation) => conversation.id === nextConversation.id)

      if (!exists) {
        return [nextConversation, ...current]
      }

      return current.map((conversation) =>
        conversation.id === nextConversation.id ? nextConversation : conversation,
      )
    })
  }

  async function refreshProfile(session: AuthSession) {
    const [nextProfile, nextProfessionsStudies] = await Promise.all([
      getProfileRequest(session),
      getProfessionsStudiesRequest(session),
    ])

    setProfileData({
      ...nextProfile,
      skills: nextProfessionsStudies.items,
    })
    setProfileSettings((current) => ({
      ...current,
      fullName: nextProfile.fullName || current.fullName,
      email: nextProfile.email || current.email,
      selectedRole: nextProfile.role || current.selectedRole,
      history: nextProfile.history || current.history,
      contactNotes: nextProfile.contactNotes || current.contactNotes,
      selectedTags: nextProfessionsStudies.items.map((label) => ({ label })),
    }))
  }

  async function handleConnect(payload: CreateConnectionPayload) {
    if (!authSession) {
      return
    }

    const firstMessage = payload.initialMessage.trim()

    if (!firstMessage) {
      return
    }

    const connectionPayload = {
      ...payload,
      initialMessage: firstMessage,
    }
    const socket = messagesSocketRef.current
    let nextConversation: MensajeConversation

    if (socket?.connected) {
      nextConversation = await emitConversationEvent(socket, 'connection:create', connectionPayload)
    } else {
      nextConversation = await createConnectionRequest(authSession, connectionPayload)
    }

    upsertConversation(nextConversation)

    setSelectedConversationId(nextConversation.id)
    setActiveView('mensajes')
  }

  function handleOpenMessages() {
    setSelectedConversationId(undefined)
    setActiveView('mensajes')
  }

  function handleOpenProfileMessage() {
    const profileName = profileSettings.fullName || authSession?.user.fullName || 'Perfil'

    handleConnect({
      author: profileName,
      avatar: profileName.charAt(0).toUpperCase() || 'M',
      initialMessage: `Hola ${profileName}, vi tu perfil y quiero conversar contigo.`,
      isOnline: true,
    })
  }

  function handleSelectConversation(conversationId: string) {
    if (!conversationId) {
      setSelectedConversationId(undefined)
      return
    }

    setSelectedConversationId(conversationId)
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
      ),
    )

    if (authSession) {
      void markConversationReadRequest(authSession, conversationId)
        .then((nextConversation) => {
          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === nextConversation.id ? nextConversation : conversation,
            ),
          )
        })
        .catch(() => undefined)
    }
  }

  async function handleSendMessage(conversationId: string, text: string) {
    if (!authSession) {
      return
    }

    const cleanText = text.trim()

    if (!cleanText) {
      return
    }

    const socket = messagesSocketRef.current

    if (socket?.connected) {
      const nextConversation = await emitConversationEvent(socket, 'message:send', {
        conversationId,
        text: cleanText,
      })

      upsertConversation(nextConversation)
      return
    }

    const nextMessage = await sendMessageRequest(authSession, conversationId, cleanText)

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              lastMessage: cleanText,
              time: 'Ahora',
              messages: [
                ...conversation.messages,
                nextMessage,
              ],
            }
          : conversation,
      ),
    )
  }

  async function handleCreateCampaign(
    conversationId: string,
    campaignType: MensajeCampaignType,
    campaign: MensajeCampaignForm,
  ) {
    const cleanCampaign = {
      ...campaign,
      projectName: campaign.projectName.trim(),
      description: campaign.description.trim(),
      requirements: campaign.requirements.trim(),
      deadline: campaign.deadline?.trim(),
    }

    if (!cleanCampaign.projectName) {
      return
    }

    const socket = messagesSocketRef.current

    if (!socket?.connected) {
      return
    }

    const nextConversation = await emitConversationEvent(socket, 'campaign:send', {
      conversationId,
      type: campaignType,
      projectName: cleanCampaign.projectName,
      description: cleanCampaign.description,
      requirements: cleanCampaign.requirements,
      deadline: cleanCampaign.deadline,
    })

    upsertConversation(nextConversation)
  }

  async function handleDeleteCampaign(conversationId: string, campaignMessageId: string) {
    const socket = messagesSocketRef.current

    if (!socket?.connected) {
      return
    }

    const nextConversation = await emitConversationEvent(socket, 'campaign:delete', {
      conversationId,
      campaignMessageId,
    })

    upsertConversation(nextConversation)
  }

  async function handleAcceptCampaign(conversationId: string, campaignMessageId: string) {
    const socket = messagesSocketRef.current

    if (!socket?.connected) {
      return
    }

    const nextConversation = await emitConversationEvent(socket, 'campaign:accept', {
      conversationId,
      campaignMessageId,
    })

    upsertConversation(nextConversation)
  }

  async function handleDeclineCampaign(conversationId: string, campaignMessageId: string) {
    const socket = messagesSocketRef.current

    if (!socket?.connected) {
      return
    }

    const nextConversation = await emitConversationEvent(socket, 'campaign:decline', {
      conversationId,
      campaignMessageId,
    })

    upsertConversation(nextConversation)
  }

  async function handleSaveProfile(settings: ConfiguracionProfileState) {
    if (!authSession) {
      throw new Error('No hay una sesion activa para guardar este perfil.')
    }

    const currentSession = authSession as AuthSession
    await saveProfessionsStudiesRequest(currentSession, settings)
    await saveConfiguracionPreferencesRequest(currentSession, settings)
    await saveConfiguracionProfileRequest(currentSession, settings)
    const [updatedProfile, updatedProfessionsStudies] = await Promise.all([
      getProfileRequest(currentSession),
      getProfessionsStudiesRequest(currentSession),
    ])
    const nextSession: AuthSession = {
      ...currentSession,
      user: {
        ...currentSession.user,
        fullName: updatedProfile.fullName,
        email: updatedProfile.email,
        role: updatedProfile.role,
      },
    }

    saveAuthSession(nextSession)
    setAuthSession(nextSession)
    setLoginCredentials({
      email: settings.email,
      password: settings.password,
    })
    setProfileSettings((current) => {
      const nextSettings = {
        ...current,
        ...settings,
        selectedTags: updatedProfessionsStudies.items.map((label) => ({ label })),
      }
      saveProfileSettings(nextSession.user.id, nextSettings)
      return nextSettings
    })
    setProfileData({
      ...updatedProfile,
      skills: updatedProfessionsStudies.items,
    })
  }

  async function handleLogout() {
    const currentSession = authSession

    try {
      if (currentSession) {
        await logoutRequest(currentSession)
      }
    } catch {
      // Even if the API is unavailable, close the local session to avoid leaving the UI stuck.
    } finally {
      clearAuthSession()
      setAuthSession(null)
      setProfileData(null)
      setIsLoggedIn(false)
      setAuthView('login')
      setActiveView('inicio')
      setSelectedConversationId(undefined)
    }
  }

  useEffect(() => {
    activeViewRef.current = activeView
  }, [activeView])

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId
  }, [selectedConversationId])

  useEffect(() => {
    if (!authSession) {
      setProfileSettings(defaultProfileSettings)
      setProfileProjects([])
      return
    }

    setProfileSettings(readProfileSettings(authSession.user.id))
    setProfileProjects(readProfileProjects(authSession.user.id))
  }, [authSession])

  useEffect(() => {
    if (!authSession || !isLoggedIn) {
      messagesSocketRef.current?.disconnect()
      messagesSocketRef.current = null
      return
    }

    const socket = createMessagesSocket(authSession)
    messagesSocketRef.current = socket
    socket.on('connect', () => {
      console.info('Socket mensajes conectado', socket.id)
    })
    socket.on('connect_error', (error) => {
      console.error('Socket mensajes error', error.message)
    })
    socket.on('conversation:updated', (conversation) => {
      const isReadingConversation =
        activeViewRef.current === 'mensajes' &&
        selectedConversationIdRef.current === conversation.id

      if (isReadingConversation) {
        upsertConversation({ ...conversation, unreadCount: 0 })
        void markConversationReadRequest(authSession, conversation.id).catch(() => undefined)
        return
      }

      upsertConversation(conversation)
    })
    socket.on('profile:updated', () => {
      void refreshProfile(authSession)
    })

    return () => {
      socket.off('conversation:updated')
      socket.off('profile:updated')
      socket.off('connect')
      socket.off('connect_error')
      socket.disconnect()
      if (messagesSocketRef.current === socket) {
        messagesSocketRef.current = null
      }
    }
  }, [authSession, isLoggedIn])

  useEffect(() => {
    if (!authSession) {
      return
    }

    let isCancelled = false
    const currentSession = authSession

    async function syncSession() {
      try {
        const nextSession = await getCurrentSessionRequest(currentSession)

        if (!isCancelled) {
          saveAuthSession(nextSession)
          setAuthSession(nextSession)
        }
      } catch {
        if (!isCancelled) {
          clearAuthSession()
          setAuthSession(null)
          setIsLoggedIn(false)
          setAuthView('login')
        }
      }
    }

    void syncSession()

    return () => {
      isCancelled = true
    }
  }, [authSession?.accessToken])

  useEffect(() => {
    if (!isLoggedIn || !authSession) {
      return
    }

    let isCancelled = false
    const currentSession = authSession

    async function loadConversations() {
      try {
        const nextConversations = await getConversationsRequest(currentSession)

        if (!isCancelled) {
          setConversations(nextConversations)
        }
      } catch {
        if (!isCancelled) {
          setConversations(initialMessages)
        }
      }
    }

    void loadConversations()

    return () => {
      isCancelled = true
    }
  }, [authSession, isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn || !authSession) {
      return
    }

    let isCancelled = false

    async function loadProfile() {
      const currentSession = authSession

      if (!currentSession) {
        return
      }

      try {
        const [nextProfile, nextProfessionsStudies] = await Promise.all([
          getProfileRequest(currentSession),
          getProfessionsStudiesRequest(currentSession),
        ])

        if (!isCancelled) {
          setProfileData({
            ...nextProfile,
            skills: nextProfessionsStudies.items,
          })
          setProfileSettings((current) => ({
            ...current,
            fullName: nextProfile.fullName || current.fullName,
            email: nextProfile.email || current.email,
            history: nextProfile.history || current.history,
            contactNotes: nextProfile.contactNotes || current.contactNotes,
            selectedTags: nextProfessionsStudies.items.map((label) => ({ label })),
          }))
        }
      } catch {
        if (!isCancelled) {
          setProfileData(null)
        }
      }
    }

    void loadProfile()

    return () => {
      isCancelled = true
    }
  }, [authSession, isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn || !authSession) {
      return
    }

    let isCancelled = false
    const currentSession = authSession

    async function loadConfiguracion() {
      try {
        const [nextProfile, nextPreferences, nextProfessionsStudies] = await Promise.all([
          getConfiguracionProfileRequest(currentSession),
          getConfiguracionPreferencesRequest(currentSession),
          getProfessionsStudiesRequest(currentSession),
        ])

        if (!isCancelled) {
          setProfileSettings((current) => ({
            ...current,
            selectedRole: nextPreferences.role || nextProfile.role || current.selectedRole,
            fullName: nextProfile.fullName || current.fullName,
            email: nextProfile.email || current.email,
            selectedTags: nextProfessionsStudies.items.map((label) => ({ label })),
            history: nextProfile.history || current.history,
            contactNotes: nextProfile.contactNotes || current.contactNotes,
          }))
        }
      } catch {
        if (!isCancelled) {
          // keep local draft if backend is unavailable
        }
      }
    }

    void loadConfiguracion()

    return () => {
      isCancelled = true
    }
  }, [authSession, isLoggedIn])

  if (!isLoggedIn) {
    return (
      <Login
        mode={authView}
        onOpenRegister={() => setAuthView('register')}
        onBackToLogin={() => setAuthView('login')}
        onLoginSuccess={(form: LoginFormState, session: AuthSession) => {
          saveAuthSession(session)
          setAuthSession(session)
          setLoginCredentials({
            email: form.email,
            password: form.password,
          })
          setProfileSettings({
            ...readProfileSettings(session.user.id),
            fullName: session.user.fullName,
            email: session.user.email,
            selectedRole: session.user.role || defaultProfileSettings.selectedRole,
            password: form.password,
          })
          setIsLoggedIn(true)
          setActiveView('inicio')
          void getProfileRequest(session)
            .then(async (nextProfile) => {
              const nextProfessionsStudies = await getProfessionsStudiesRequest(session)
              setProfileData(nextProfile)
              setProfileSettings((current) => ({
                ...current,
                fullName: nextProfile.fullName || current.fullName,
                email: nextProfile.email || current.email,
                selectedRole: nextProfile.role || current.selectedRole,
                selectedTags: nextProfessionsStudies.items.map((label) => ({ label })),
                history: nextProfile.history || current.history,
                contactNotes: nextProfile.contactNotes || current.contactNotes,
              }))
              setProfileData({
                ...nextProfile,
                skills: nextProfessionsStudies.items,
              })
            })
            .catch(() => undefined)
        }}
        onRegisterSuccess={(form: RegisterFormState, session: AuthSession) => {
          saveAuthSession(session)
          setAuthSession(session)
          setLoginCredentials({
            email: form.email,
            password: form.password,
          })
          const nextSettings = {
            ...readProfileSettings(session.user.id),
            fullName: session.user.fullName,
            email: session.user.email,
            selectedRole: session.user.role || defaultProfileSettings.selectedRole,
            password: form.password,
          }
          setProfileSettings(nextSettings)
          saveProfileSettings(session.user.id, nextSettings)
          setIsLoggedIn(true)
          setActiveView('inicio')
          void getProfileRequest(session)
            .then(async (nextProfile) => {
              const nextProfessionsStudies = await getProfessionsStudiesRequest(session)
              setProfileSettings((current) => ({
                ...current,
                fullName: nextProfile.fullName || current.fullName,
                email: nextProfile.email || current.email,
                selectedRole: nextProfile.role || current.selectedRole,
                selectedTags: nextProfessionsStudies.items.map((label) => ({ label })),
                history: nextProfile.history || current.history,
                contactNotes: nextProfile.contactNotes || current.contactNotes,
              }))
              setProfileData({
                ...nextProfile,
                skills: nextProfessionsStudies.items,
              })
            })
            .catch(() => undefined)
        }}
      />
    )
  }

  if (activeView === 'mensajes') {
    return (
      <Mensajes
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        hasUnreadMessages={hasUnreadMessages}
        onBack={() => setActiveView('inicio')}
        onOpenProfile={() => setActiveView('perfil')}
        onSelectConversation={handleSelectConversation}
        onSendMessage={handleSendMessage}
        onCreateCampaign={handleCreateCampaign}
        onDeleteCampaign={handleDeleteCampaign}
        onAcceptCampaign={handleAcceptCampaign}
        onDeclineCampaign={handleDeclineCampaign}
      />
    )
  }

  if (activeView === 'perfil') {
    return (
      <Perfil
        onBack={() => setActiveView('inicio')}
        onOpenMessages={handleOpenMessages}
        onSendMessage={handleOpenProfileMessage}
        onOpenSettings={() => setActiveView('configuracion')}
        profileSettings={profileSettings}
        roles={initialConfiguracionPage.roles}
        savedProjects={profileProjects}
        profileData={profileData}
        hasUnreadMessages={hasUnreadMessages}
      />
    )
  }

  if (activeView === 'perfil-publico' && selectedPublicProfilePost) {
    return (
      <PublicProfile
        post={selectedPublicProfilePost}
        authSession={authSession}
        onBack={() => setActiveView('inicio')}
        onConnect={handleConnect}
      />
    )
  }

  if (activeView === 'configuracion') {
    return (
      <Configuracion
        initialEmail={loginCredentials.email}
        initialPassword={loginCredentials.password}
        profileSettings={profileSettings}
        profileData={profileData}
        onSaveProfile={handleSaveProfile}
        onLogout={handleLogout}
        onBack={() => setActiveView('perfil')}
      />
    )
  }

  return (
    <Inicio
      authSession={authSession}
      profileData={profileData}
      onConnect={handleConnect}
      onOpenMessages={handleOpenMessages}
      onOpenProfile={() => setActiveView('perfil')}
      hasUnreadMessages={hasUnreadMessages}
      onOpenPublicProfile={(post) => {
        setSelectedPublicProfilePost(post)
        setActiveView('perfil-publico')
      }}
    />
  )
}

function getProfileStorageKey(userId?: string) {
  return userId ? `${profileStorageKey}-${userId}` : profileStorageKey
}

function getProfileProjectsStorageKey(userId?: string) {
  return userId ? `${profileProjectsStorageKey}-${userId}` : profileProjectsStorageKey
}

function getProfileProjectsResetStorageKey(userId?: string) {
  return userId ? `${profileProjectsResetKey}-${userId}` : profileProjectsResetKey
}

function readProfileSettings(userId?: string): ConfiguracionProfileState {
  if (typeof window === 'undefined') {
    return defaultProfileSettings
  }

  try {
    const storedSettings = window.localStorage.getItem(getProfileStorageKey(userId))

    if (!storedSettings) {
      return defaultProfileSettings
    }

    return {
      ...defaultProfileSettings,
      ...JSON.parse(storedSettings),
    }
  } catch {
    return defaultProfileSettings
  }
}

function saveProfileSettings(userId: string | undefined, settings: ConfiguracionProfileState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(getProfileStorageKey(userId), JSON.stringify(settings))
}

function readProfileProjects(userId?: string): PerfilProject[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const resetKey = getProfileProjectsResetStorageKey(userId)
    const storageKey = getProfileProjectsStorageKey(userId)

    if (!window.localStorage.getItem(resetKey)) {
      window.localStorage.removeItem(storageKey)
      window.localStorage.setItem(resetKey, 'true')
      return []
    }

    const storedProjects = window.localStorage.getItem(storageKey)

    if (!storedProjects) {
      return []
    }

    const parsedProjects = JSON.parse(storedProjects)

    return Array.isArray(parsedProjects) ? parsedProjects : []
  } catch {
    return []
  }
}

function emitConversationEvent(
  socket: MessagesSocket,
  event: 'connection:create' | 'message:send' | 'campaign:send' | 'campaign:accept' | 'campaign:decline' | 'campaign:delete',
  payload: Record<string, unknown>,
) {
  return new Promise<MensajeConversation>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error('El servidor no respondio a tiempo.'))
    }, 5000)

    socket.emit(event, payload as never, (response: {
      success: boolean
      message?: string
      conversation?: MensajeConversation
    }) => {
      window.clearTimeout(timeoutId)

      if (!response.success || !response.conversation) {
        reject(new Error(response.message ?? 'No se pudo procesar la campana.'))
        return
      }

      resolve(response.conversation)
    })
  })
}

export default App
