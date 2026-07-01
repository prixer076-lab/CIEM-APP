export type InicioCategory = 'ayudas' | 'necesidades' | 'comunidad'
export type InicioBadgeTone = 'blue' | 'green' | 'purple' | 'red'
export type InicioMediaType = 'imagen' | 'video'
export type InicioPostAction = 'contenido' | 'ayuda' | 'necesidad'
export type InicioProfileRole = 'emprendedor' | 'influencer' | 'marketing' | 'otro'

export type InicioComment = {
  id: number | string
  author: string
  text: string
  time: string
}

export type InicioPost = {
  id: number | string
  userId?: string | null
  author: string
  role: string
  time: string
  category: InicioCategory
  badge: string
  badgeTone: InicioBadgeTone
  body: string
  hashtags?: string[]
  likes: number
  comments: InicioComment[]
  isLiked?: boolean
  mediaType?: InicioMediaType
  isSos?: boolean
  sosTitle?: string
  isOwn?: boolean
}

export type InicioFilter = {
  id: 'todo' | InicioCategory
  label: string
  icon: string
  imageSrc?: string
}

export type InicioQuickAction = {
  id: InicioPostAction
  title: string
  description: string
  icon: string
  imageSrc?: string
  tone: InicioBadgeTone
  category: InicioCategory
  badge: string
  placeholder: string
  suggestions: string[]
}

export type InicioProfile = {
  id: number
  userId?: string
  name: string
  username: string
  role: string
  roleId: InicioProfileRole
  location: string
  description: string
  avatar: string
  isFollowing?: boolean
}

export type InicioPageState = {
  brand: string
  filters: InicioFilter[]
  posts: InicioPost[]
  profiles: InicioProfile[]
  quickActions: InicioQuickAction[]
}
