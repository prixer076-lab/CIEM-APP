import type { MouseEvent } from 'react'
import type { LoginPageState } from '../types/loginTypes'
import './Login.css'

type LoginContentProps = {
  page: LoginPageState
  onOpenRegister?: () => void
}

export function LoginContent({ page, onOpenRegister }: LoginContentProps) {
  function handleOpenRegister(event: MouseEvent<HTMLAnchorElement>) {
    if (!onOpenRegister) {
      return
    }

    event.preventDefault()
    onOpenRegister()
  }

  return (
    <main className="login-page">
      <section className="login-shell" aria-labelledby="login-title">
        <header className="login-header">
          <h1 id="login-title" className="login-logo-title">
            <img className="login-logo" src="/logos/ciem-logo.png" alt={page.brand} />
          </h1>
          <p>{page.subtitle}</p>
        </header>

        <form className="login-card" onSubmit={page.onSubmit}>
          <label className="login-field">
            <span>Correo electronico</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={page.form.email}
              onChange={page.onEmailChange}
              placeholder="prixero76@gmail.com"
            />
          </label>

          <label className="login-field">
            <span>Contrasena</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={page.form.password}
              onChange={page.onPasswordChange}
              placeholder="****"
            />
          </label>

          <div className="login-actions-row">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={page.form.rememberMe}
                onChange={page.onRememberMeChange}
              />
              <span>Recordarme</span>
            </label>

            <a href={page.forgotPasswordUrl}>Olvidaste tu contrasena?</a>
          </div>

          {page.errorMessage ? <p className="login-error">{page.errorMessage}</p> : null}

          <button className="login-submit" type="submit" disabled={page.isSubmitting}>
            {page.isSubmitting ? 'Ingresando...' : 'Iniciar Sesion'}
          </button>

          <p className="login-register">
            No tienes cuenta?{' '}
            <a href={page.registerUrl} onClick={handleOpenRegister}>
              Registrate aqui
            </a>
          </p>
        </form>
      </section>
    </main>
  )
}
