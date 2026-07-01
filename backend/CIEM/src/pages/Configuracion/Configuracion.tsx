import { ConfiguracionContent } from './components/ConfiguracionContent'
import { useConfiguracionPage } from './hooks/useConfiguracionPage'
import type { ConfiguracionProfileState } from './types/configuracionTypes'
import type { PerfilApiResponse } from '../Perfil/services/perfilApi'

type ConfiguracionProps = {
  onBack?: () => void
  onLogout?: () => void
  initialEmail?: string
  initialPassword?: string
  profileSettings?: ConfiguracionProfileState
  profileData?: PerfilApiResponse | null
  onSaveProfile?: (settings: ConfiguracionProfileState) => Promise<void> | void
}

export default function Configuracion({
  onBack,
  onLogout,
  initialEmail = '',
  initialPassword = '',
  profileSettings,
  profileData,
  onSaveProfile,
}: ConfiguracionProps) {
  const page = useConfiguracionPage()
  const configuracionKey = [
    profileData?.email || profileSettings?.email || 'configuracion',
    profileSettings?.selectedRole || profileData?.role || '',
    (profileSettings?.selectedTags ?? []).map((tag) => tag.label).join('|'),
    (profileData?.skills ?? []).join('|'),
    profileSettings?.history || profileData?.history || '',
    profileSettings?.contactNotes || profileData?.contactNotes || '',
  ].join('::')

  return (
    <ConfiguracionContent
      key={configuracionKey}
      page={page}
      onBack={onBack}
      onLogout={onLogout}
      initialEmail={initialEmail}
      initialPassword={initialPassword}
      profileSettings={profileSettings}
      profileData={profileData}
      onSaveProfile={onSaveProfile}
    />
  )
}
