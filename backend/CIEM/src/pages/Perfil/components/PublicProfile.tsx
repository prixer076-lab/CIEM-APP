import { useEffect, useState } from 'react'
import type { InicioPost } from '../../Inicio/types/inicioTypes'
import type { CreateConnectionPayload } from '../../Mensajes/services/mensajesApi'
import { ConnectMessageModal } from '../../Mensajes/components/ConnectMessageModal'
import type { PerfilPageState } from '../types/perfilTypes'
import { PerfilContent } from './PerfilContent'
import { followUserRequest, getPublicProfileRequest, unfollowUserRequest } from '../services/publicProfileApi'
import { getPerfilPage } from '../services/perfilService'
import type { AuthSession } from '../../../shared/auth/authStorage'

type PublicProfileProps = {
  post: InicioPost
  authSession?: AuthSession | null
  onBack: () => void
  onConnect: (payload: CreateConnectionPayload) => void | Promise<void>
}

export function PublicProfile({
  post,
  authSession,
  onBack,
  onConnect,
}: PublicProfileProps) {
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [page, setPage] = useState<PerfilPageState>(() => getFallbackPublicProfile(post))

  useEffect(() => {
    let isCancelled = false

    async function loadProfile() {
      if (!post.userId) {
        if (!isCancelled) {
          setPage(getFallbackPublicProfile(post))
        }
        return
      }

      try {
        const profile = await getPublicProfileRequest(post.userId, authSession)

        if (!isCancelled) {
          setPage(mapProfileToPage(profile))
        }
      } catch {
        if (!isCancelled) {
          setPage(getFallbackPublicProfile(post))
        }
      }
    }

    void loadProfile()

    return () => {
      isCancelled = true
    }
  }, [post])

  async function toggleFollow() {
    if (!post.userId || !authSession) {
      return
    }

    const nextStats = page.isFollowing
      ? await unfollowUserRequest(post.userId, authSession)
      : await followUserRequest(post.userId, authSession)

    setPage((current) => ({
      ...current,
      isFollowing: nextStats.isFollowing,
      stats: buildStats(nextStats),
    }))
  }

  async function sendMessage(message: string) {
    await onConnect({
      recipientUserId: post.userId,
      initialMessage: message,
      isOnline: true,
    })
    setIsMessageModalOpen(false)
  }

  return (
    <>
      <PerfilContent
        page={page}
        isPublicProfile
        onBack={onBack}
        onSendMessage={() => setIsMessageModalOpen(true)}
        onToggleFollow={toggleFollow}
      />

      {isMessageModalOpen ? (
        <ConnectMessageModal
          recipientName={post.author}
          initialMessage={`Hola, vi tu perfil y tu publicacion sobre: ${post.badge}. Quiero conversar contigo.`}
          onCancel={() => setIsMessageModalOpen(false)}
          onSend={sendMessage}
        />
      ) : null}
    </>
  )
}

function mapProfileToPage(profile: {
  fullName: string
  email: string
  role: string
  avatar: string
  headline: string
  location: string
  workMode: string
  history: string
  contactNotes: string
  skills: string[]
  recentProjects: Array<{
    title: string
    company: string
    status: string
    statusTone: 'green' | 'blue'
  }>
  stats?: {
    campaigns: number
    following: number
    followers: number
    isFollowing?: boolean
  }
}): PerfilPageState {
  const basePage = getPerfilPage()
  const category = getCategory(profile.role)
  const about = [
    profile.history,
    profile.contactNotes ? `Contacto y notas: ${profile.contactNotes}` : '',
  ].filter((item): item is string => Boolean(item?.trim()))

  return {
    ...basePage,
    title: `Perfil de ${profile.fullName}`,
    avatar: profile.avatar || profile.fullName.charAt(0).toUpperCase(),
    name: profile.fullName,
    email: profile.email,
    headline: profile.headline,
    location: profile.location,
    workMode: profile.workMode,
    category,
    categoryLabel: profile.role,
    isFollowing: Boolean(profile.stats?.isFollowing),
    stats: buildStats(profile.stats),
    about,
    skills: profile.skills,
    recentProjects: profile.recentProjects,
  }
}

function buildStats(stats?: {
  campaigns: number
  following: number
  followers: number
}) {
  return [
    {
      value: String(stats?.campaigns ?? 0),
      label: 'Campañas',
    },
    {
      value: String(stats?.following ?? 0),
      label: 'Seguidos',
    },
    {
      value: String(stats?.followers ?? 0),
      label: 'Seguidores',
    },
  ]
}

function getFallbackPublicProfile(post: InicioPost): PerfilPageState {
  const basePage = getPerfilPage()
  const category = getCategory(post.role)

  return {
    ...basePage,
    title: `Perfil de ${post.author}`,
    avatar: post.author.charAt(0).toUpperCase(),
    name: post.author,
    email: '',
    headline: post.role,
    location: 'Trujillo, Peru',
    workMode: category === 'empresario' ? 'Negocio local' : 'Freelance',
    category,
    categoryLabel: post.role,
    about: [post.body],
    skills: [],
    recentProjects: [],
  }
}

function getCategory(role: string): PerfilPageState['category'] {
  const normalizedRole = role.toLowerCase()

  if (normalizedRole.includes('marketing')) {
    return 'marketing'
  }

  if (normalizedRole.includes('influencer')) {
    return 'influencer'
  }

  return 'empresario'
}
