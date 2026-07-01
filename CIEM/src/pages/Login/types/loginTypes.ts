import type { ChangeEvent, FormEvent } from 'react'

export type LoginFormState = {
  email: string
  password: string
  rememberMe: boolean
}

export type RegisterRole = {
  id: string
  label: string
  icon: string
  activeIcon: string
  isActive?: boolean
}

export type RegisterTag = {
  label: string
  icon?: string
}

export type RegisterFormState = {
  roleId: string
  customRole: string
  fullName: string
  email: string
  password: string
  tags: RegisterTag[]
  history: string
  contactNotes: string
}

export type LoginPageState = {
  brand: string
  subtitle: string
  form: LoginFormState
  errorMessage: string
  isSubmitting: boolean
  forgotPasswordUrl: string
  registerUrl: string
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRememberMeChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export type RegisterPageState = {
  brand: string
  title: string
  subtitle: string
  roles: RegisterRole[]
  suggestedTags: RegisterTag[]
  isSubmitting: boolean
}
