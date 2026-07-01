import type { FormEvent } from 'react'
import type { RegisterFormState, RegisterPageState } from '../types/loginTypes'
import './Register.css'

type RegisterContentProps = {
  page: RegisterPageState & {
    form: RegisterFormState
    customTag: string
    customRoleDraft: string
    errorMessage: string
    isCustomRoleOpen: boolean
    setCustomTag: (value: string) => void
    setCustomRoleDraft: (value: string) => void
    setIsCustomRoleOpen: (value: boolean) => void
    updateField: <Key extends keyof RegisterFormState>(field: Key, value: RegisterFormState[Key]) => void
    addTag: (label: string) => void
    removeTag: (label: string) => void
    selectRole: (roleId: string) => void
    confirmCustomRole: () => void
    onSubmit: (event: FormEvent<HTMLFormElement>) => void
  }
  onBackToLogin?: () => void
}

export function RegisterContent({ page, onBackToLogin }: RegisterContentProps) {
  return (
    <main className="register-page">
      <header className="register-topbar">
        <strong className="register-brand">
          <img src="/logos/ciem-horizontal-logo.png" alt={page.brand} />
        </strong>
        <button type="button" onClick={onBackToLogin}>
          Ya tengo cuenta
        </button>
      </header>

      <section className="register-heading" aria-labelledby="register-title">
        <h1 id="register-title">{page.title}</h1>
        <p>{page.subtitle}</p>
      </section>

      <form className="register-shell" aria-label={page.title} onSubmit={page.onSubmit}>
        <article className="register-card">
          <h2>1. Rol de usuario</h2>
          <div className="register-role-grid">
            {page.roles.map((role) => (
              <button
                className={`register-role ${page.form.roleId === role.id ? 'register-role-active' : ''}`}
                key={role.id}
                type="button"
                onClick={() => page.selectRole(role.id)}
              >
                <img
                  className="register-role-icon"
                  src={page.form.roleId === role.id ? role.activeIcon : role.icon}
                  alt=""
                  aria-hidden="true"
                />
                <span className="register-role-label">
                  {role.id === 'otro' && page.form.customRole ? page.form.customRole : role.label}
                </span>
              </button>
            ))}
          </div>
        </article>

        <article className="register-card">
          <h2>2. Datos basicos</h2>

          <label className="register-field">
            <span>Nombres completos</span>
            <input
              type="text"
              value={page.form.fullName}
              placeholder="Ej: Nombre Apellido"
              onChange={(event) => page.updateField('fullName', event.target.value)}
            />
          </label>

          <label className="register-field">
            <span>Correo electronico</span>
            <input
              type="email"
              value={page.form.email}
              placeholder="tu@email.com"
              onChange={(event) => page.updateField('email', event.target.value)}
            />
          </label>

          <label className="register-field">
            <span>Contrasena</span>
            <input
              type="password"
              value={page.form.password}
              placeholder="Minimo 8 caracteres"
              onChange={(event) => page.updateField('password', event.target.value)}
            />
          </label>
        </article>

        <article className="register-card">
          <h2>3. Profesion y estudios</h2>
          <p className="register-helper">Selecciona o crea etiquetas que te describan (max. 6)</p>

          <div className="register-tags">
            {page.form.tags.map((tag) => (
              <span className="register-tag register-tag-selected" key={tag.label}>
                {tag.label} {tag.icon ? <small>{tag.icon}</small> : null}
                <button type="button" aria-label={`Quitar ${tag.label}`} onClick={() => page.removeTag(tag.label)}>
                  x
                </button>
              </span>
            ))}
          </div>

          <div className="register-suggestions">
            <span>Sugerencias:</span>
            <div className="register-tags">
              {page.suggestedTags.map((tag) => (
                <button className="register-tag" key={tag.label} type="button" onClick={() => page.addTag(tag.label)}>
                  {tag.label} {tag.icon ? <small>{tag.icon}</small> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="register-add-tag">
            <input
              type="text"
              value={page.customTag}
              placeholder="Escribe tu propia etiqueta..."
              onChange={(event) => page.setCustomTag(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  page.addTag(page.customTag)
                }
              }}
            />
            <button type="button" aria-label="Agregar etiqueta" onClick={() => page.addTag(page.customTag)}>
              +
            </button>
          </div>
        </article>

        <article className="register-card">
          <h2>4. Historial y destacados</h2>
          <textarea
            value={page.form.history}
            placeholder="Historial de trabajos: Que haces y en que te destacas? Cuentanos tu magia..."
            onChange={(event) => page.updateField('history', event.target.value)}
          />
        </article>

        <article className="register-card register-notes">
          <h2>5. Contacto - Bloc de notas</h2>
          <p>Escribe como prefieren contactarte (redes, telefono, links...)</p>
          <textarea
            className="register-notepad"
            aria-label="Bloc de notas de contacto"
            value={page.form.contactNotes}
            onChange={(event) => page.updateField('contactNotes', event.target.value)}
          />
        </article>

        {page.errorMessage ? <p className="register-error">{page.errorMessage}</p> : null}

        <button className="register-submit" type="submit" disabled={page.isSubmitting}>
          {page.isSubmitting ? 'Creando perfil...' : 'Crear mi perfil'}
        </button>
      </form>

      {page.isCustomRoleOpen ? (
        <div className="register-dialog-layer" role="presentation">
          <section className="register-dialog" role="dialog" aria-modal="true" aria-labelledby="register-role-title">
            <h2 id="register-role-title">Especifica tu rol</h2>
            <p>Ej: Fotografo, Editor de video, Disenador grafico, Community manager...</p>
            <input
              autoFocus
              type="text"
              value={page.customRoleDraft}
              placeholder="Tu especialidad..."
              onChange={(event) => page.setCustomRoleDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  page.confirmCustomRole()
                }

                if (event.key === 'Escape') {
                  page.setIsCustomRoleOpen(false)
                }
              }}
            />
            <div className="register-dialog-actions">
              <button type="button" onClick={() => page.setIsCustomRoleOpen(false)}>
                Cancelar
              </button>
              <button type="button" onClick={page.confirmCustomRole}>
                Confirmar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
