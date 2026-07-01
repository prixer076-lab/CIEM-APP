import { useState } from 'react'
import type { PerfilPageState } from '../types/perfilTypes'
import { getProfileNavigationImage } from '../menu/profileNavigationMenu'
import './Perfil.css'

type PerfilContentProps = {
  page: PerfilPageState
  onBack?: () => void
  onOpenMessages?: () => void
  onSendMessage?: () => void
  onOpenSettings?: () => void
  onToggleFollow?: () => void
  isPublicProfile?: boolean
  hasUnreadMessages?: boolean
}

export function PerfilContent({
  page,
  onBack,
  onOpenMessages,
  onSendMessage,
  onOpenSettings,
  onToggleFollow,
  isPublicProfile = false,
  hasUnreadMessages = false,
}: PerfilContentProps) {
  const [localIsFollowing, setLocalIsFollowing] = useState(false)
  const isFollowing = page.isFollowing ?? localIsFollowing
  const visibleStats = page.stats.map((stat) =>
    stat,
  )

  return (
    <main className="perfil-page">
      {isPublicProfile ? (
        <header className="perfil-topbar perfil-topbar-public">
          <button
            className="perfil-public-back"
            type="button"
            aria-label="Volver al inicio"
            onClick={onBack}
          >
            {'<'}
          </button>
        </header>
      ) : (
        <header className="perfil-topbar">
          <strong className="perfil-brand">
            <img src="/logos/ciem-horizontal-logo.png" alt={page.brand} />
          </strong>
          <nav className="perfil-nav" aria-label="Navegacion principal">
            <button className="perfil-nav-button" type="button" onClick={onBack}>
              <img
                className="perfil-nav-icon"
                src={getProfileNavigationImage('inicio')}
                alt=""
                aria-hidden="true"
              />
              Inicio
            </button>
            <button className="perfil-nav-button" type="button" onClick={onOpenMessages}>
              <span className="perfil-nav-icon-wrap">
                <img
                  className="perfil-nav-icon"
                  src={getProfileNavigationImage('mensajes')}
                  alt=""
                  aria-hidden="true"
                />
                {hasUnreadMessages ? <span className="perfil-unread-dot" aria-label="Mensajes sin leer" /> : null}
              </span>
              Mensajes
            </button>
            <button className="perfil-nav-button perfil-nav-button-active" type="button">
              <img
                className="perfil-nav-icon"
                src={getProfileNavigationImage('perfil')}
                alt=""
                aria-hidden="true"
              />
              Perfil
            </button>
          </nav>
        </header>
      )}

      <section className="perfil-shell" aria-label={page.title}>
        <article className="perfil-hero">
          <div className="perfil-cover" />

          <div className="perfil-main">
            <span className="perfil-avatar">{page.avatar}</span>

            <div className="perfil-identity">
              <div>
                <h1>{page.name}</h1>
                <p className="perfil-email">{page.email}</p>
                {page.headline ? <p className="perfil-headline">{page.headline}</p> : null}
                <p className="perfil-meta">
                  <span>{page.location}</span>
                  <span>{page.workMode}</span>
                </p>
              </div>

              {isPublicProfile ? (
                <div className="perfil-actions">
                  <button className="perfil-message" type="button" onClick={onSendMessage}>
                    <span>o</span>
                    Enviar Mensaje
                  </button>
                  <button
                    className={`perfil-follow ${isFollowing ? 'perfil-follow-active' : ''}`}
                    type="button"
                    onClick={() => {
                      if (onToggleFollow) {
                        onToggleFollow()
                        return
                      }

                      setLocalIsFollowing((current) => !current)
                    }}
                  >
                    <span>+</span>
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                  </button>
                </div>
              ) : (
                <div className="perfil-actions">
                  <button
                    className="perfil-settings-button perfil-settings-button-inline"
                    type="button"
                    aria-label="Configuracion"
                    onClick={onOpenSettings}
                  >
                    <img
                      className="perfil-settings-icon"
                      src="/icons/settings.png"
                      alt=""
                      aria-hidden="true"
                    />
                    Configuracion
                  </button>
                </div>
              )}
            </div>

            {page.categoryLabel ? (
              <div className="perfil-badges" aria-label="Especializaciones">
                <span className={`perfil-pill perfil-pill-${page.category}`}>{page.categoryLabel}</span>
              </div>
            ) : null}

            <div className="perfil-stats" aria-label="Estadisticas del perfil">
              {visibleStats.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <section className="perfil-grid">
          <article className="perfil-card">
            <h2>Historial y destacados</h2>
            {page.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>

          <article className="perfil-card">
            <h2>Profesiones y estudios</h2>
            <div className="perfil-skills">
              {page.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </article>
        </section>

        <section className="perfil-card perfil-projects" aria-label="Proyectos recientes">
          <h2>Proyectos Recientes</h2>
          <div className="perfil-project-list">
            {page.recentProjects.map((project) => (
              <article className="perfil-project" key={project.title}>
                <div>
                  <h3>{project.title}</h3>
                  <p>{project.company}</p>
                </div>
                <span className={`perfil-status perfil-status-${project.statusTone}`}>
                  {project.status}
                </span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
