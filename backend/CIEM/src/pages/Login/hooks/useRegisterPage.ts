import { type FormEvent, useState } from 'react'
import type { AuthSession } from '../../../shared/auth/authStorage'
import { registerRequest } from '../services/authApi'
import { getRegisterPage } from '../services/loginService'
import type { RegisterFormState } from '../types/loginTypes'

type UseRegisterPageOptions = {
  onRegisterSuccess?: (form: RegisterFormState, session: AuthSession) => void
}

export function useRegisterPage(options: UseRegisterPageOptions = {}) {
  const page = getRegisterPage()
  const initialRole = page.roles.find((role) => role.isActive)?.id ?? page.roles[0]?.id ?? ''
  const [form, setForm] = useState<RegisterFormState>({
    roleId: initialRole,
    customRole: '',
    fullName: '',
    email: '',
    password: '',
    tags: [],
    history: '',
    contactNotes:
      'Instagram: @tuusuario\nEmail: contacto@email.com\nLinkedIn: linkedin.com/in/tuusuario\nWhatsApp: +51 987 654 321',
  })
  const [customRoleDraft, setCustomRoleDraft] = useState('')
  const [isCustomRoleOpen, setIsCustomRoleOpen] = useState(false)
  const [customTag, setCustomTag] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField<Key extends keyof RegisterFormState>(field: Key, value: RegisterFormState[Key]) {
    setErrorMessage('')
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  function addTag(label: string) {
    const cleanLabel = label.trim()

    if (
      !cleanLabel ||
      form.tags.some((tag) => tag.label.toLowerCase() === cleanLabel.toLowerCase()) ||
      form.tags.length >= 6
    ) {
      setCustomTag('')
      return
    }

    updateField('tags', [...form.tags, { label: cleanLabel }])
    setCustomTag('')
  }

  function removeTag(label: string) {
    updateField(
      'tags',
      form.tags.filter((tag) => tag.label !== label),
    )
  }

  function selectRole(roleId: string) {
    if (roleId === 'otro') {
      updateField('roleId', roleId)
      setCustomRoleDraft(form.customRole)
      setIsCustomRoleOpen(true)
      return
    }

    updateField('roleId', roleId)
  }

  function confirmCustomRole() {
    const cleanRole = customRoleDraft.trim()

    if (!cleanRole) {
      return
    }

    setForm((currentForm) => ({
      ...currentForm,
      roleId: 'otro',
      customRole: cleanRole,
    }))
    setIsCustomRoleOpen(false)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      setErrorMessage('Completa nombres, correo electronico y contrasena para crear tu cuenta.')
      return
    }

    if (!form.email.includes('@')) {
      setErrorMessage('El correo electronico debe incluir @.')
      return
    }

    if (form.password.length < 8) {
      setErrorMessage('La contrasena debe tener al menos 8 caracteres.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage('')
      const session = await registerRequest(form)
      options.onRegisterSuccess?.(form, session)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo crear la cuenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    ...page,
    form,
    customTag,
    customRoleDraft,
    errorMessage,
    isSubmitting,
    isCustomRoleOpen,
    setCustomTag,
    setCustomRoleDraft,
    setIsCustomRoleOpen,
    updateField,
    addTag,
    removeTag,
    selectRole,
    confirmCustomRole,
    onSubmit,
  }
}
