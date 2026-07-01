import { useState } from 'react'
import type { FormEvent } from 'react'
import type {
  ConfiguracionPageState,
  ConfiguracionProfileState,
} from '../types/configuracionTypes'
import type { PerfilApiResponse } from '../../Perfil/services/perfilApi'
import './Configuracion.css'

type ConfiguracionContentProps = {
  page: ConfiguracionPageState
  onBack?: () => void
  onLogout?: () => void
  initialEmail?: string
  initialPassword?: string
  profileSettings?: ConfiguracionProfileState
  profileData?: PerfilApiResponse | null
  onSaveProfile?: (settings: ConfiguracionProfileState) => Promise<void> | void
}

export function ConfiguracionContent({
  page,
  onBack,
  onLogout,
  initialEmail = '',
  initialPassword = '',
  profileSettings,
  profileData,
  onSaveProfile,
}: ConfiguracionContentProps) {
  const initialRole = page.roles.find((role) => role.isActive)?.id ?? page.roles[0]?.id ?? ''
  const [selectedRole, setSelectedRole] = useState(
    profileSettings?.selectedRole ?? profileData?.role ?? initialRole,
  )
  const [customRole, setCustomRole] = useState(profileSettings?.customRole ?? '')
  const [customRoleDraft, setCustomRoleDraft] = useState('')
  const [isCustomRoleOpen, setIsCustomRoleOpen] = useState(false)
  const [fullName, setFullName] = useState(
    profileSettings?.fullName ?? profileData?.fullName ?? page.fullName,
  )
  const [email] = useState(profileSettings?.email || profileData?.email || initialEmail || page.email)
  const [password, setPassword] = useState(
    profileSettings?.password || initialPassword || page.passwordPlaceholder,
  )
  const [tags, setTags] = useState(() => {
    if (profileSettings?.selectedTags.length) {
      return profileSettings.selectedTags
    }

    if (profileData) {
      return profileData.skills.map((label) => ({ label }))
    }

    return page.selectedTags
  })
  const [customTag, setCustomTag] = useState('')
  const [history, setHistory] = useState(
    profileSettings?.history ?? profileData?.history ?? page.history,
  )
  const [contactNotes, setContactNotes] = useState(
    profileSettings?.contactNotes ?? profileData?.contactNotes ?? page.contactNotes,
  )
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function addTag(label: string) {
    const cleanLabel = label.trim()

    if (!cleanLabel || tags.some((tag) => tag.label.toLowerCase() === cleanLabel.toLowerCase())) {
      setCustomTag('')
      return
    }

    if (tags.length >= 6) {
      return
    }

    setTags((current) => [...current, { label: cleanLabel }])
    setCustomTag('')
  }

  function removeTag(label: string) {
    setTags((current) => current.filter((tag) => tag.label !== label))
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveMessage('')
    setSaveError('')

    if (!selectedRole.trim()) {
      setSaveError('Selecciona un rol antes de guardar.')
      return
    }

    if (password.trim() && password.trim().length < 8) {
      setSaveError('La nueva contrasena debe tener al menos 8 caracteres.')
      return
    }

    try {
      setIsSaving(true)
      await onSaveProfile?.({
        selectedRole,
        customRole,
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        selectedTags: tags,
        history: history.trim(),
        contactNotes: contactNotes.trim(),
      })
      setSaveMessage('Cambios guardados correctamente.')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No se pudieron guardar los cambios.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleSelectRole(roleId: string) {
    if (roleId === 'otro') {
      setSelectedRole(roleId)
      setCustomRoleDraft(customRole)
      setIsCustomRoleOpen(true)
      return
    }

    setSelectedRole(roleId)
  }

  function confirmCustomRole() {
    const cleanRole = customRoleDraft.trim()

    if (!cleanRole) {
      return
    }

    setCustomRole(cleanRole)
    setSelectedRole('otro')
    setIsCustomRoleOpen(false)
  }

  return (
    <main className="configuracion-page">
      <header className="configuracion-topbar">
        <button
          className="configuracion-back"
          type="button"
          aria-label="Volver al perfil"
          onClick={onBack}
        >
          {'<'}
        </button>
        <strong>{page.title}</strong>
      </header>

      <form className="configuracion-shell" aria-label={page.title} onSubmit={handleSave}>
        <RoleSection
          customRole={customRole}
          page={page}
          selectedRole={selectedRole}
          onSelectRole={handleSelectRole}
        />
        <BasicDataSection
          fullName={fullName}
          email={email}
          password={password}
          onFullNameChange={setFullName}
          onPasswordChange={setPassword}
        />
        <ProfessionSection
          page={page}
          tags={tags}
          customTag={customTag}
          onCustomTagChange={setCustomTag}
          onAddTag={addTag}
          onRemoveTag={removeTag}
        />
        <HistorySection history={history} onHistoryChange={setHistory} />
        <ContactNotesSection contactNotes={contactNotes} onContactNotesChange={setContactNotes} />

        {saveMessage ? <p className="configuracion-success">{saveMessage}</p> : null}
        {saveError ? <p className="configuracion-error">{saveError}</p> : null}

        <button className="configuracion-save" type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </button>

        <button className="configuracion-logout" type="button" onClick={onLogout}>
          Cerrar sesion
        </button>
      </form>

      {isCustomRoleOpen ? (
        <CustomRoleDialog
          value={customRoleDraft}
          onChange={setCustomRoleDraft}
          onCancel={() => setIsCustomRoleOpen(false)}
          onConfirm={confirmCustomRole}
        />
      ) : null}
    </main>
  )
}

type RoleSectionProps = {
  customRole: string
  page: ConfiguracionPageState
  selectedRole: string
  onSelectRole: (roleId: string) => void
}

function RoleSection({ customRole, page, selectedRole, onSelectRole }: RoleSectionProps) {
  return (
    <article className="configuracion-card">
      <h2>Cambiar Rol</h2>
      <div className="configuracion-role-grid">
        {page.roles.map((role) => (
          <button
            className={`configuracion-role ${selectedRole === role.id ? 'configuracion-role-active' : ''}`}
            key={role.id}
            type="button"
            onClick={() => onSelectRole(role.id)}
          >
            <img
              className="configuracion-role-icon"
              src={selectedRole === role.id ? role.activeIcon : role.icon}
              alt={role.iconAlt}
            />
            <span className="configuracion-role-label">
              {role.id === 'otro' && customRole ? customRole : role.label}
            </span>
          </button>
        ))}
      </div>
    </article>
  )
}

type BasicDataSectionProps = {
  fullName: string
  email: string
  password: string
  onFullNameChange: (value: string) => void
  onPasswordChange: (value: string) => void
}

function BasicDataSection({
  fullName,
  email,
  password,
  onFullNameChange,
  onPasswordChange,
}: BasicDataSectionProps) {
  return (
    <article className="configuracion-card">
      <h2>Datos Basicos</h2>

      <label className="configuracion-field">
        <span>Nombres completos</span>
        <input
          type="text"
          value={fullName}
          placeholder="Ingresar nombres completos"
          onChange={(event) => onFullNameChange(event.target.value)}
        />
      </label>

      <label className="configuracion-field">
        <span>Correo electronico</span>
        <div className="configuracion-readonly-field" aria-label="Correo electronico">
          {email || 'Sin correo registrado'}
        </div>
      </label>

      <label className="configuracion-field">
        <span>Nueva contrasena (dejar en blanco para mantener actual)</span>
        <input
          type="password"
          value={password}
          placeholder="Ingresar nueva contrasena"
          onChange={(event) => onPasswordChange(event.target.value)}
        />
      </label>
    </article>
  )
}

type ProfessionSectionProps = {
  page: ConfiguracionPageState
  tags: ConfiguracionPageState['selectedTags']
  customTag: string
  onCustomTagChange: (value: string) => void
  onAddTag: (label: string) => void
  onRemoveTag: (label: string) => void
}

function ProfessionSection({
  page,
  tags,
  customTag,
  onCustomTagChange,
  onAddTag,
  onRemoveTag,
}: ProfessionSectionProps) {
  return (
    <article className="configuracion-card">
      <h2>Profesion y Estudios</h2>
      <p className="configuracion-helper">Selecciona o crea etiquetas que te describan (max. 6)</p>

      <div className="configuracion-tags">
        {tags.map((tag) => (
          <span className="configuracion-tag configuracion-tag-selected" key={tag.label}>
            {tag.label} {tag.icon ? <small>{tag.icon}</small> : null}
            <button type="button" aria-label={`Quitar ${tag.label}`} onClick={() => onRemoveTag(tag.label)}>
              x
            </button>
          </span>
        ))}
      </div>

      {page.suggestedTags.length ? (
        <div className="configuracion-suggestions">
          <span>Sugerencias:</span>
          <div className="configuracion-tags">
            {page.suggestedTags.map((tag) => (
              <button
                className="configuracion-tag"
                key={tag.label}
                type="button"
                onClick={() => onAddTag(tag.label)}
              >
                {tag.label} {tag.icon ? <small>{tag.icon}</small> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="configuracion-add-tag">
        <input
          type="text"
          value={customTag}
          placeholder="Ingresar profesion o estudio"
          onChange={(event) => onCustomTagChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onAddTag(customTag)
            }
          }}
        />
        <button type="button" aria-label="Agregar etiqueta" onClick={() => onAddTag(customTag)}>
          +
        </button>
      </div>
    </article>
  )
}

type HistorySectionProps = {
  history: string
  onHistoryChange: (value: string) => void
}

function HistorySection({ history, onHistoryChange }: HistorySectionProps) {
  return (
    <article className="configuracion-card">
      <h2>Historial y Destacados</h2>
      <textarea
        value={history}
        placeholder="Ingresar historial y destacados"
        onChange={(event) => onHistoryChange(event.target.value)}
      />
    </article>
  )
}

type ContactNotesSectionProps = {
  contactNotes: string
  onContactNotesChange: (value: string) => void
}

function ContactNotesSection({ contactNotes, onContactNotesChange }: ContactNotesSectionProps) {
  return (
    <article className="configuracion-card configuracion-notes">
      <h2>5. CONTACTO - Bloc de Notas</h2>
      <p>Escribe como prefieren contactarte (redes, telefono, links...)</p>
      <textarea
        className="configuracion-notepad"
        aria-label="Bloc de notas de contacto"
        value={contactNotes}
        placeholder="Ingresar datos de contacto"
        onChange={(event) => onContactNotesChange(event.target.value)}
      />
    </article>
  )
}

type CustomRoleDialogProps = {
  value: string
  onChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}

function CustomRoleDialog({ value, onChange, onCancel, onConfirm }: CustomRoleDialogProps) {
  return (
    <div className="configuracion-dialog-layer" role="presentation">
      <section className="configuracion-dialog" role="dialog" aria-modal="true" aria-labelledby="custom-role-title">
        <h2 id="custom-role-title">Especifica tu rol</h2>
        <p>Ej: Fotografo, Editor de video, Disenador grafico, Community manager...</p>
        <input
          autoFocus
          type="text"
          value={value}
          placeholder="Tu especialidad..."
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onConfirm()
            }

            if (event.key === 'Escape') {
              onCancel()
            }
          }}
        />
        <div className="configuracion-dialog-actions">
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </section>
    </div>
  )
}
