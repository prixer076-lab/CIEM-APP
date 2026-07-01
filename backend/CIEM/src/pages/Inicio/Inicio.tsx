import { InicioContent } from './components/InicioContent'
import { useInicioPage } from './hooks/useInicioPage'
import type { CreateConnectionPayload } from '../Mensajes/services/mensajesApi'
import type { InicioPost } from './types/inicioTypes'
import type { AuthSession } from '../../shared/auth/authStorage'
import type { PerfilApiResponse } from '../Perfil/services/perfilApi'

type InicioProps = {
  authSession?: AuthSession | null
  profileData?: PerfilApiResponse | null
  onConnect?: (payload: CreateConnectionPayload) => void | Promise<void>
  onOpenMessages?: () => void
  onOpenProfile?: () => void
  onOpenPublicProfile?: (post: InicioPost) => void
  hasUnreadMessages?: boolean
}

export default function Inicio({
  authSession,
  profileData,
  onConnect,
  onOpenMessages,
  onOpenProfile,
  onOpenPublicProfile,
  hasUnreadMessages = false,
}: InicioProps) {
  const page = useInicioPage()

  return (
    <InicioContent
      page={page}
      authSession={authSession}
      profileData={profileData}
      onConnect={onConnect}
      onOpenMessages={onOpenMessages}
      onOpenProfile={onOpenProfile}
      onOpenPublicProfile={onOpenPublicProfile}
      hasUnreadMessages={hasUnreadMessages}
    />
  )
}
