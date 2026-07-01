import { LoginContent } from './components/LoginContent'
import { RegisterContent } from './components/RegisterContent'
import { useLoginPage } from './hooks/useLoginPage'
import { useRegisterPage } from './hooks/useRegisterPage'
import type { LoginFormState, RegisterFormState } from './types/loginTypes'
import type { AuthSession } from '../../shared/auth/authStorage'

type LoginProps = {
  onLoginSuccess?: (form: LoginFormState, session: AuthSession) => void
  onRegisterSuccess?: (form: RegisterFormState, session: AuthSession) => void
  mode?: 'login' | 'register'
  onOpenRegister?: () => void
  onBackToLogin?: () => void
}

export default function Login({
  mode = 'login',
  onLoginSuccess,
  onRegisterSuccess,
  onOpenRegister,
  onBackToLogin,
}: LoginProps) {
  const loginPage = useLoginPage({ onLoginSuccess })
  const registerPage = useRegisterPage({ onRegisterSuccess })

  if (mode === 'register') {
    return <RegisterContent page={registerPage} onBackToLogin={onBackToLogin} />
  }

  return <LoginContent page={loginPage} onOpenRegister={onOpenRegister} />
}
