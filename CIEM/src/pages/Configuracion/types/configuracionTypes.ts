export type ConfiguracionRole = {
  id: string
  label: string
  icon: string
  activeIcon: string
  iconAlt: string
  isActive?: boolean
}

export type ConfiguracionTag = {
  label: string
  icon?: string
}

export type ConfiguracionContactLine = {
  label: string
  value: string
  icon: string
}

export type ConfiguracionPageState = {
  title: string
  roles: ConfiguracionRole[]
  fullName: string
  email: string
  passwordPlaceholder: string
  initials: string
  selectedTags: ConfiguracionTag[]
  suggestedTags: ConfiguracionTag[]
  history: string
  contactLines: ConfiguracionContactLine[]
  contactNotes: string
}

export type ConfiguracionProfileState = {
  selectedRole: string
  customRole: string
  fullName: string
  email: string
  password: string
  selectedTags: ConfiguracionTag[]
  history: string
  contactNotes: string
}
