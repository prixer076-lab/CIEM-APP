import { type ChangeEvent, type FormEvent, useState } from 'react'
import type { AuthSession } from '../../../shared/auth/authStorage'
import { loginRequest } from '../services/authApi'
import { getLoginPage } from '../services/loginService'
import type { LoginFormState } from '../types/loginTypes'

type UseLoginPageOptions = {
  onLoginSuccess?: (form: LoginFormState, session: AuthSession) => void
}

export function useLoginPage(options: UseLoginPageOptions = {}) {
  const [form, setForm] = useState<LoginFormState>({
    email: '',
    password: '',
    rememberMe: true,
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const page = getLoginPage()

  function onEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setErrorMessage('')
    setForm((currentForm) => ({
      ...currentForm,
      email: event.target.value,
    }))
  }

  function onPasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setErrorMessage('')
    setForm((currentForm) => ({
      ...currentForm,
      password: event.target.value,
    }))
  }

  function onRememberMeChange(event: ChangeEvent<HTMLInputElement>) {
    setForm((currentForm) => ({
      ...currentForm,
      rememberMe: event.target.checked,
    }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.email.trim() || !form.password.trim()) {
      setErrorMessage('Ingresa tu correo electronico y contrasena para continuar.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage('')
      const session = await loginRequest(form)
      options.onLoginSuccess?.(form, session)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesion.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    ...page,
    form,
    errorMessage,
    isSubmitting,
    onEmailChange,
    onPasswordChange,
    onRememberMeChange,
    onSubmit,
  }
}
