export type PerfilPageState = {
  title: string
  brand: string
  avatar: string
  name: string
  email: string
  headline: string
  location: string
  workMode: string
  category: 'influencer' | 'marketing' | 'empresario'
  categoryLabel: string
  verifiedLabel: string
  stats: PerfilStat[]
  isFollowing?: boolean
  about: string[]
  skills: string[]
  recentProjects: PerfilProject[]
}

export type PerfilStat = {
  value: string
  label: string
}

export type PerfilProject = {
  title: string
  company: string
  status: string
  statusTone: 'green' | 'blue'
}
