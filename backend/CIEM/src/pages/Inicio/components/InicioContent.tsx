import { type FormEvent, useEffect, useMemo, useState } from 'react'
import type {
  InicioMediaType,
  InicioPageState,
  InicioPost,
  InicioProfile,
  InicioProfileRole,
  InicioQuickAction,
} from '../types/inicioTypes'
import type { CreateConnectionPayload } from '../../Mensajes/services/mensajesApi'
import { ConnectMessageModal } from '../../Mensajes/components/ConnectMessageModal'
import { getPanelNavigationImage } from '../menu/publicationMenu'
import {
  createFeedPostRequest,
  createFeedCommentRequest,
  deleteFeedCommentRequest,
  deleteFeedPostRequest,
  getFeedPostsRequest,
  likeFeedPostRequest,
  unlikeFeedPostRequest,
  updateFeedPostRequest,
} from '../services/inicioApi'
import { getInicioProfilesRequest } from '../services/inicioProfilesApi'
import type { AuthSession } from '../../../shared/auth/authStorage'
import type { PerfilApiResponse } from '../../Perfil/services/perfilApi'
import { followUserRequest, unfollowUserRequest } from '../../Perfil/services/publicProfileApi'
import './Inicio.css'

type InicioContentProps = {
  page: InicioPageState
  authSession?: AuthSession | null
  profileData?: PerfilApiResponse | null
  onConnect?: (payload: CreateConnectionPayload) => void | Promise<void>
  onOpenMessages?: () => void
  onOpenProfile?: () => void
  onOpenPublicProfile?: (post: InicioPost) => void
  hasUnreadMessages?: boolean
}

type PostFormState = {
  body: string
  mediaType?: InicioMediaType
  isSos: boolean
  sosTitle: string
  hashtagDraft: string
  hashtags: string[]
}

type ActiveComposer = {
  action: InicioQuickAction
  editingPostId?: number | string
}

type PendingConnect = {
  post: InicioPost
  initialMessage: string
}

const profileRoleFilters: Array<{
  id: InicioProfileRole
  label: string
  icon: string
  activeIcon: string
}> = [
  {
    id: 'emprendedor',
    label: 'Emprendedor',
    icon: '/roles/emprendedor.png',
    activeIcon: '/inicio/perfil-emprendedor-activo.png',
  },
  {
    id: 'influencer',
    label: 'Influencer',
    icon: '/roles/influencer.png',
    activeIcon: '/inicio/perfil-influencer-activo.png',
  },
  {
    id: 'marketing',
    label: 'Experto/a en Marketing',
    icon: '/roles/marketing.png',
    activeIcon: '/inicio/perfil-marketing-activo.png',
  },
  {
    id: 'otro',
    label: 'Otro',
    icon: '/roles/especificar-rol.png',
    activeIcon: '/roles/especificar-rol-activo.png',
  },
]

export function InicioContent({
  page,
  authSession,
  profileData,
  onConnect,
  onOpenMessages,
  onOpenProfile,
  onOpenPublicProfile,
  hasUnreadMessages = false,
}: InicioContentProps) {
  const [contentMode, setContentMode] = useState<'mensajes' | 'perfiles'>('mensajes')
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('todo')
  const [activeProfileRole, setActiveProfileRole] = useState<InicioProfileRole>('emprendedor')
  const [query, setQuery] = useState('')
  const [posts, setPosts] = useState<InicioPost[]>(page.posts)
  const [openComments, setOpenComments] = useState<Array<number | string>>([1])
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const [activeComposer, setActiveComposer] = useState<ActiveComposer>()
  const [pendingConnect, setPendingConnect] = useState<PendingConnect>()
  const [feedError, setFeedError] = useState('')
  const [profiles, setProfiles] = useState<InicioProfile[]>(page.profiles)
  const [profilesError, setProfilesError] = useState('')
  const [form, setForm] = useState<PostFormState>({
    body: '',
    isSos: false,
    sosTitle: '',
    hashtagDraft: '',
    hashtags: [],
  })
  const currentAuthor = profileData?.fullName || authSession?.user.fullName || 'Tu perfil'

  const filteredPosts = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()

    return posts.filter((post) => {
      const matchesFilter = activeFilter === 'todo' || post.category === activeFilter
      const searchableText = `${post.author} ${post.role} ${post.badge} ${post.body} ${
        post.sosTitle ?? ''
      } ${
        post.hashtags?.join(' ') ?? ''
      }`.toLowerCase()
      return matchesFilter && (!cleanQuery || searchableText.includes(cleanQuery))
    })
  }, [activeFilter, posts, query])

  useEffect(() => {
    let isCancelled = false

    async function loadPosts() {
      try {
        const nextPosts = await getFeedPostsRequest(authSession)

        if (!isCancelled) {
          setPosts(nextPosts.map((post) => ({
            ...post,
            comments: post.comments ?? [],
            isOwn: authSession ? post.userId === authSession.user.id : false,
          })))
          setFeedError('')
        }
      } catch {
        if (!isCancelled) {
          setFeedError('No se pudieron cargar las publicaciones.')
        }
      }
    }

    void loadPosts()

    return () => {
      isCancelled = true
    }
  }, [authSession?.user.id])

  useEffect(() => {
    let isCancelled = false

    async function loadProfiles() {
      try {
        const nextProfiles = await getInicioProfilesRequest(authSession)

        if (!isCancelled) {
          setProfiles(nextProfiles)
          setProfilesError('')
        }
      } catch {
        if (!isCancelled) {
          setProfilesError('No se pudieron cargar los perfiles registrados.')
        }
      }
    }

    void loadProfiles()

    return () => {
      isCancelled = true
    }
  }, [authSession?.accessToken, authSession?.user.id])

  const filteredProfiles = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()

    return profiles.filter((profile) => {
      if (authSession?.user.id && profile.userId === authSession.user.id) {
        return false
      }

      const searchableText =
        `${profile.name} ${profile.username} ${profile.role} ${profile.location} ${profile.description}`.toLowerCase()

      return (
        profile.roleId === activeProfileRole &&
        (!cleanQuery || searchableText.includes(cleanQuery))
      )
    })
  }, [activeProfileRole, authSession?.user.id, profiles, query])

  const isEditing = Boolean(activeComposer?.editingPostId)

  function toggleComments(postId: number | string) {
    setOpenComments((current) =>
      current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId],
    )
  }

  async function toggleLike(post: InicioPost) {
    if (!authSession) {
      return
    }

    const nextReaction = post.isLiked
      ? await unlikeFeedPostRequest(authSession, post.id)
      : await likeFeedPostRequest(authSession, post.id)

    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              likes: nextReaction.likes,
              isLiked: nextReaction.isLiked,
            }
          : item,
      ),
    )
  }

  function openComposer(action: InicioQuickAction) {
    setForm({
      body: '',
      mediaType: undefined,
      isSos: false,
      sosTitle: '',
      hashtagDraft: '',
      hashtags: [],
    })
    setActiveComposer({ action })
  }

  function openEditor(post: InicioPost) {
    const action = page.quickActions.find((item) => item.category === post.category) ?? page.quickActions[0]

    setForm({
      body: post.body,
      mediaType: post.mediaType,
      isSos: Boolean(post.isSos),
      sosTitle: post.sosTitle ?? '',
      hashtagDraft: '',
      hashtags: post.hashtags ?? [],
    })
    setActiveComposer({ action, editingPostId: post.id })
  }

  function closeComposer() {
    setActiveComposer(undefined)
  }

  function openConnectModal(post: InicioPost) {
    setPendingConnect({
      post,
      initialMessage: `Hola, vi tu publicacion y quiero conectar contigo sobre: ${post.badge}.`,
    })
  }

  async function sendConnectMessage(message: string) {
    if (!pendingConnect) {
      return
    }

    const { post } = pendingConnect

    await onConnect?.({
      recipientUserId: post.userId,
      initialMessage: message,
      isOnline: true,
    })
    setPendingConnect(undefined)
  }

  function addHashtag(value = form.hashtagDraft) {
    const cleanTag = normalizeHashtag(value)

    if (!cleanTag || form.hashtags.includes(cleanTag)) {
      setForm((current) => ({ ...current, hashtagDraft: '' }))
      return
    }

    setForm((current) => ({
      ...current,
      hashtagDraft: '',
      hashtags: [...current.hashtags, cleanTag],
    }))
  }

  function removeHashtag(tag: string) {
    setForm((current) => ({
      ...current,
      hashtags: current.hashtags.filter((item) => item !== tag),
    }))
  }

  async function publishPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeComposer || !form.body.trim() || !authSession) {
      return
    }

    const body = form.body.trim()
    const sosTitle = form.sosTitle.trim()

    if (activeComposer.editingPostId) {
      const updatedPost = await updateFeedPostRequest(authSession, activeComposer.editingPostId, {
        body,
        category: activeComposer.action.category,
        badge: activeComposer.action.badge,
        hashtags: form.hashtags,
        isSos: form.isSos,
        sosTitle: form.isSos ? sosTitle : undefined,
      })

      setPosts((current) =>
        current.map((post) =>
          post.id === activeComposer.editingPostId
            ? {
                ...post,
                ...updatedPost,
                comments: post.comments,
                mediaType: form.mediaType,
                isOwn: true,
              }
            : post,
        ),
      )
      closeComposer()
      return
    }

    const nextPost = await createFeedPostRequest(authSession, {
      body,
      category: activeComposer.action.category,
      badge: activeComposer.action.badge,
      hashtags: form.hashtags,
      isSos: form.isSos,
      sosTitle: form.isSos ? sosTitle : undefined,
    })

    setPosts((current) => [
      {
        ...nextPost,
        comments: [],
        mediaType: form.mediaType,
        isOwn: true,
        author: profileData?.fullName || nextPost.author,
        role: profileData?.role || nextPost.role,
      },
      ...current,
    ])
    closeComposer()
  }

  async function deletePost() {
    if (!activeComposer?.editingPostId || !authSession) {
      return
    }

    await deleteFeedPostRequest(authSession, activeComposer.editingPostId)
    setPosts((current) => current.filter((post) => post.id !== activeComposer.editingPostId))
    setOpenComments((current) => current.filter((id) => id !== activeComposer.editingPostId))
    closeComposer()
  }

  async function submitComment(postId: number | string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const draftKey = String(postId)
    const text = commentDrafts[draftKey]?.trim()

    if (!text || !authSession) {
      return
    }

    const nextComment = await createFeedCommentRequest(authSession, postId, text)

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                nextComment,
              ],
            }
          : post,
      ),
    )
    setCommentDrafts((current) => ({ ...current, [postId]: '' }))
    setOpenComments((current) => (current.includes(postId) ? current : [...current, postId]))
  }

  async function deleteComment(postId: number | string, commentId: number | string) {
    if (!authSession) {
      return
    }

    await deleteFeedCommentRequest(authSession, postId, commentId)

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.filter((comment) => comment.id !== commentId),
            }
          : post,
      ),
    )
  }

  async function toggleProfileFollow(profile: InicioProfile) {
    if (!authSession || !profile.userId) {
      return
    }

    const nextStats = profile.isFollowing
      ? await unfollowUserRequest(profile.userId, authSession)
      : await followUserRequest(profile.userId, authSession)

    setProfiles((current) =>
      current.map((item) =>
        item.userId === profile.userId
          ? {
              ...item,
              isFollowing: nextStats.isFollowing,
            }
          : item,
      ),
    )
  }

  function openListedProfile(profile: InicioProfile) {
    onOpenPublicProfile?.(profileToPost(profile))
  }

  return (
    <main className="inicio-page">
      <header className="inicio-topbar">
        <strong className="inicio-brand">
          <img src="/logos/ciem-horizontal-logo.png" alt={page.brand} />
        </strong>
        <nav className="inicio-nav" aria-label="Navegacion principal">
          <button className="inicio-nav-button inicio-nav-button-active" type="button">
            <img className="inicio-nav-icon" src={getPanelNavigationImage('inicio')} alt="" aria-hidden="true" />
            Inicio
          </button>
          <button className="inicio-nav-button" type="button" onClick={onOpenMessages}>
            <span className="inicio-nav-icon-wrap">
              <img className="inicio-nav-icon" src={getPanelNavigationImage('mensajes')} alt="" aria-hidden="true" />
              {hasUnreadMessages ? <span className="inicio-unread-dot" aria-label="Mensajes sin leer" /> : null}
            </span>
            Mensajes
          </button>
          <button className="inicio-nav-button" type="button" onClick={onOpenProfile}>
            <img className="inicio-nav-icon" src={getPanelNavigationImage('perfil')} alt="" aria-hidden="true" />
            Perfil
          </button>
        </nav>
      </header>

      <section className="inicio-content" aria-label="Menu principal">
        <label className="inicio-search">
          <span>o</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              contentMode === 'perfiles'
                ? 'Buscar perfiles, roles o ubicaciones...'
                : 'Buscar oportunidades, servicios, personas...'
            }
          />
        </label>

        <div className="inicio-filter-toolbar">
          <div className="inicio-filters" aria-label="Filtros de busqueda">
            {contentMode === 'mensajes'
              ? page.filters.map((filter) => (
                  <button
                    className={`inicio-filter ${activeFilter === filter.id ? 'inicio-filter-active' : ''}`}
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    {filter.imageSrc ? (
                      <img className="inicio-filter-image" src={filter.imageSrc} alt="" aria-hidden="true" />
                    ) : filter.icon ? (
                      <span>{filter.icon}</span>
                    ) : null}
                    {filter.label}
                  </button>
                ))
              : profileRoleFilters.map((filter) => (
                  <button
                    className={`inicio-filter inicio-role-filter ${
                      activeProfileRole === filter.id ? 'inicio-filter-active' : ''
                    }`}
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveProfileRole(filter.id)}
                  >
                    <img
                      src={
                        activeProfileRole === filter.id
                          ? filter.activeIcon
                          : filter.icon
                      }
                      alt=""
                      aria-hidden="true"
                    />
                    {filter.label}
                  </button>
                ))}
          </div>

          <div className="inicio-view-menu-wrap">
            <button
              className="inicio-view-menu-button"
              type="button"
              aria-expanded={isViewMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsViewMenuOpen((current) => !current)}
            >
              {contentMode === 'mensajes' ? 'Mensajes' : 'Perfiles'}
              <span>{isViewMenuOpen ? '▲' : '▼'}</span>
            </button>

            {isViewMenuOpen ? (
              <div className="inicio-view-menu" role="menu">
                <button
                  className={contentMode === 'mensajes' ? 'inicio-view-menu-active' : ''}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setContentMode('mensajes')
                    setActiveFilter('todo')
                    setIsViewMenuOpen(false)
                  }}
                >
                  <strong>Mensajes</strong>
                  <small>Publicaciones de la comunidad</small>
                </button>
                <button
                  className={contentMode === 'perfiles' ? 'inicio-view-menu-active' : ''}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setContentMode('perfiles')
                    setIsViewMenuOpen(false)
                  }}
                >
                  <strong>Perfiles</strong>
                  <small>Descubre personas y negocios</small>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {contentMode === 'mensajes' ? (
          <div className="inicio-feed">
            {feedError ? <p className="inicio-profile-empty">{feedError}</p> : null}
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                commentDraft={commentDrafts[String(post.id)] ?? ''}
                currentAuthor={currentAuthor}
                isCommentsOpen={openComments.includes(post.id)}
                isLiked={Boolean(post.isLiked)}
                onCommentDraftChange={(value) =>
                  setCommentDrafts((current) => ({ ...current, [post.id]: value }))
                }
                onSubmitComment={(event) => submitComment(post.id, event)}
                onToggleComments={() => toggleComments(post.id)}
                onToggleLike={() => void toggleLike(post)}
                onDeleteComment={(commentId) => void deleteComment(post.id, commentId)}
                onEdit={() => openEditor(post)}
                onConnect={() => openConnectModal(post)}
                onOpenProfile={() =>
                  post.isOwn ? onOpenProfile?.() : onOpenPublicProfile?.(post)
                }
              />
            ))}
          </div>
        ) : (
          <section className="inicio-profile-results" aria-label="Perfiles encontrados">
            <div className="inicio-profile-results-header">
              <strong>Perfiles</strong>
              <span>{filteredProfiles.length} resultados</span>
            </div>
            {profilesError ? <p className="inicio-profile-empty">{profilesError}</p> : null}
            {filteredProfiles.length ? (
              <div className="inicio-profile-list">
                {filteredProfiles.map((profile) => (
                  <ProfileListItem
                    key={profile.id}
                    profile={profile}
                    isFollowing={Boolean(profile.isFollowing)}
                    onOpen={() => openListedProfile(profile)}
                    onToggleFollow={() => void toggleProfileFollow(profile)}
                  />
                ))}
              </div>
            ) : (
              <p className="inicio-profile-empty">No encontramos perfiles con este filtro.</p>
            )}
          </section>
        )}
      </section>

      {contentMode === 'mensajes' ? (
      <aside className={`inicio-actions ${isActionMenuOpen ? 'inicio-actions-open' : ''}`}>
        <div className="inicio-actions-panel" aria-label="Acciones rapidas">
          {page.quickActions.map((action) => (
            <button
              className="inicio-action-item"
              key={action.id}
              type="button"
              onClick={() => openComposer(action)}
            >
              <span className={`inicio-action-icon inicio-action-${action.tone}`}>
                {action.imageSrc ? <img src={action.imageSrc} alt="" aria-hidden="true" /> : action.icon}
              </span>
              <span>
                <strong>{action.title}</strong>
                <small>{action.description}</small>
              </span>
            </button>
          ))}
        </div>
        <button
          className="inicio-fab"
          type="button"
          aria-label={isActionMenuOpen ? 'Cerrar opciones de publicacion' : 'Abrir opciones de publicacion'}
          aria-expanded={isActionMenuOpen}
          onClick={() => setIsActionMenuOpen((current) => !current)}
        >
          <img
            className="inicio-fab-icon"
            src={
              isActionMenuOpen
                ? '/inicio/boton-publicacion-cerrar.png'
                : '/inicio/boton-publicacion-mas.png'
            }
            alt=""
            aria-hidden="true"
          />
        </button>
      </aside>
      ) : null}

      {activeComposer ? (
        <PostComposer
          action={activeComposer.action}
          form={form}
          isEditing={isEditing}
          onAddHashtag={addHashtag}
          onCancel={closeComposer}
          onDelete={deletePost}
          onFormChange={setForm}
          onPublish={publishPost}
          onRemoveHashtag={removeHashtag}
        />
      ) : null}

      {pendingConnect ? (
        <ConnectMessageModal
          recipientName={pendingConnect.post.author}
          initialMessage={pendingConnect.initialMessage}
          onCancel={() => setPendingConnect(undefined)}
          onSend={sendConnectMessage}
        />
      ) : null}
    </main>
  )
}

type ProfileListItemProps = {
  profile: InicioProfile
  isFollowing: boolean
  onOpen: () => void
  onToggleFollow: () => void
}

function ProfileListItem({
  profile,
  isFollowing,
  onOpen,
  onToggleFollow,
}: ProfileListItemProps) {
  return (
    <article className="inicio-profile-item">
      <button
        className="inicio-profile-avatar"
        type="button"
        aria-label={`Ver perfil de ${profile.name}`}
        onClick={onOpen}
      >
        {profile.avatar}
      </button>
      <button className="inicio-profile-info" type="button" onClick={onOpen}>
        <strong>{profile.username}</strong>
        <span>
          {profile.name} · {profile.location}
        </span>
        <p>{profile.description}</p>
      </button>
      <button
        className={`inicio-profile-follow ${
          isFollowing ? 'inicio-profile-follow-active' : ''
        }`}
        type="button"
        onClick={onToggleFollow}
      >
        {isFollowing ? 'Siguiendo' : 'Seguir'}
      </button>
    </article>
  )
}

type PostCardProps = {
  post: InicioPost
  commentDraft: string
  currentAuthor: string
  isCommentsOpen: boolean
  isLiked: boolean
  onCommentDraftChange: (value: string) => void
  onSubmitComment: (event: FormEvent<HTMLFormElement>) => void
  onToggleComments: () => void
  onToggleLike: () => void
  onDeleteComment: (commentId: number | string) => void
  onEdit: () => void
  onConnect: () => void
  onOpenProfile: () => void
}

function PostCard({
  post,
  commentDraft,
  currentAuthor,
  isCommentsOpen,
  isLiked,
  onCommentDraftChange,
  onSubmitComment,
  onToggleComments,
  onToggleLike,
  onDeleteComment,
  onEdit,
  onConnect,
  onOpenProfile,
}: PostCardProps) {
  const visibleLikes = post.likes

  return (
    <article className={`inicio-post inicio-post-${post.category}`}>
      <header className="inicio-post-header">
        <button
          className="inicio-avatar inicio-profile-trigger"
          type="button"
          aria-label={`Ver perfil de ${post.author}`}
          onClick={onOpenProfile}
        >
          {post.author.charAt(0)}
        </button>
        <div>
          <h2>
            <button className="inicio-author-button" type="button" onClick={onOpenProfile}>
              {post.author}
            </button>
          </h2>
          <p>
            {post.role} - {post.time}
          </p>
        </div>
        <div className="inicio-post-badges">
          {post.isSos ? <span className="inicio-sos-badge">SOS</span> : null}
          <span className={`inicio-badge inicio-badge-${post.badgeTone}`}>{post.badge}</span>
        </div>
      </header>

      <p className="inicio-post-body">{post.body}</p>

      {post.isSos && post.sosTitle ? (
        <div className="inicio-sos-title">
          <span>SOS</span>
          <strong>{post.sosTitle}</strong>
        </div>
      ) : null}

      {post.hashtags?.length ? (
        <div className="inicio-post-tags" aria-label="Hashtags">
          {post.hashtags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      ) : null}

      {post.mediaType ? (
        <div className="inicio-media" aria-label={`Multimedia de tipo ${post.mediaType}`}>
          <span>{post.mediaType === 'video' ? '[video]' : '[imagen]'}</span>
        </div>
      ) : null}

      <footer className="inicio-post-footer">
        <button
          className={`inicio-metric ${isLiked ? 'inicio-metric-liked' : ''}`}
          type="button"
          onClick={onToggleLike}
        >
          <img
            className="inicio-metric-icon"
            src={isLiked ? '/icons/heart-red.png' : '/icons/heart-outline.png'}
            alt=""
            aria-hidden="true"
          />
          <span>{visibleLikes}</span>
        </button>
        <button className="inicio-metric" type="button" onClick={onToggleComments}>
          <img className="inicio-metric-icon" src="/icons/comments.png" alt="" aria-hidden="true" />
          <span>{post.comments.length}</span>
        </button>
        {post.isOwn ? (
          <button className="inicio-connect" type="button" onClick={onEdit}>
            <span>*</span> Editar
          </button>
        ) : (
          <button className="inicio-connect" type="button" onClick={onConnect}>
            <span>&gt;</span> Conectar
          </button>
        )}
      </footer>

      {isCommentsOpen ? (
        <section className="inicio-comments" aria-label={`Comentarios de ${post.author}`}>
          {post.comments.map((comment) => (
            <article className="inicio-comment" key={comment.id}>
              <span className="inicio-comment-avatar">{comment.author.charAt(0)}</span>
              <div>
                <strong>{comment.author}</strong>
                <p>{comment.text}</p>
                <small>{comment.time}</small>
              </div>
              {comment.author === currentAuthor ? (
                <button type="button" onClick={() => onDeleteComment(comment.id)}>
                  x
                </button>
              ) : null}
            </article>
          ))}

          <form className="inicio-comment-form" onSubmit={onSubmitComment}>
            <input
              type="text"
              value={commentDraft}
              onChange={(event) => onCommentDraftChange(event.target.value)}
              placeholder="Escribe un comentario publico..."
            />
            <button type="submit">&gt;</button>
          </form>
        </section>
      ) : null}
    </article>
  )
}

type PostComposerProps = {
  action: InicioQuickAction
  form: PostFormState
  isEditing: boolean
  onAddHashtag: (value?: string) => void
  onCancel: () => void
  onDelete: () => void
  onFormChange: (form: PostFormState) => void
  onPublish: (event: FormEvent<HTMLFormElement>) => void
  onRemoveHashtag: (tag: string) => void
}

function PostComposer({
  action,
  form,
  isEditing,
  onAddHashtag,
  onCancel,
  onDelete,
  onFormChange,
  onPublish,
  onRemoveHashtag,
}: PostComposerProps) {
  const showHashtags = action.id !== 'contenido'

  return (
    <div className="inicio-modal-backdrop" role="presentation">
      <form className={`inicio-composer inicio-composer-${action.tone}`} onSubmit={onPublish}>
        <header className="inicio-composer-header">
          <span className="inicio-composer-icon">
            {action.imageSrc ? <img src={action.imageSrc} alt="" aria-hidden="true" /> : action.icon}
          </span>
          <div>
            <h2>{action.title}</h2>
            <p>{action.description}</p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onCancel}>
            x
          </button>
        </header>

        <section className="inicio-composer-body">
          <span className={`inicio-composer-pill inicio-badge-${action.tone}`}>{action.badge}</span>

          <label className="inicio-field">
            <span>Contenido de la publicacion</span>
            <textarea
              value={form.body}
              onChange={(event) => onFormChange({ ...form, body: event.target.value })}
              placeholder={action.placeholder}
              rows={6}
            />
          </label>

          <section className={`inicio-sos-panel ${form.isSos ? 'inicio-sos-panel-active' : ''}`}>
            <div className="inicio-sos-switch-row">
              <div>
                <strong>Modo SOS</strong>
                <small>{form.isSos ? 'Activado' : 'Desactivado'}</small>
              </div>
              <button
                className={`inicio-sos-switch ${form.isSos ? 'inicio-sos-switch-active' : ''}`}
                type="button"
                role="switch"
                aria-checked={form.isSos}
                onClick={() =>
                  onFormChange({
                    ...form,
                    isSos: !form.isSos,
                    sosTitle: form.isSos ? '' : form.sosTitle,
                  })
                }
              >
                <span>{form.isSos ? 'Activado' : 'Desactivado'}</span>
              </button>
            </div>

            {form.isSos ? (
              <label className="inicio-field inicio-sos-reason">
                <span>MOTIVO</span>
                <input
                  value={form.sosTitle}
                  onChange={(event) => onFormChange({ ...form, sosTitle: event.target.value })}
                  placeholder="Agregar titulo SOS"
                />
              </label>
            ) : null}
          </section>

          {showHashtags ? (
            <section className="inicio-hashtags" aria-label="Hashtags descriptivos">
              <label className="inicio-field">
                <span># Hashtags descriptivos</span>
                <div className="inicio-hashtag-row">
                  <input
                    value={form.hashtagDraft}
                    onChange={(event) => onFormChange({ ...form, hashtagDraft: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        onAddHashtag()
                      }
                    }}
                    placeholder="Escribe un hashtag..."
                  />
                  <button type="button" onClick={() => onAddHashtag()}>
                    Agregar
                  </button>
                </div>
              </label>

              <div className="inicio-tag-box">
                {form.hashtags.length ? (
                  <div className="inicio-selected-tags">
                    {form.hashtags.map((tag) => (
                      <button key={tag} type="button" onClick={() => onRemoveHashtag(tag)}>
                        #{tag} x
                      </button>
                    ))}
                  </div>
                ) : null}

                <small>Sugerencias:</small>
                <div className="inicio-tag-suggestions">
                  {action.suggestions.map((tag) => (
                    <button key={tag} type="button" onClick={() => onAddHashtag(tag)}>
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </section>

        <footer className="inicio-composer-footer">
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
          {isEditing ? (
            <button className="inicio-delete" type="button" onClick={onDelete}>
              Borrar
            </button>
          ) : null}
          <button className="inicio-publish" type="submit">
            &gt; {isEditing ? 'Guardar' : 'Publicar'}
          </button>
        </footer>
      </form>
    </div>
  )
}

function normalizeHashtag(value: string) {
  return value.replace(/^#/, '').trim().replace(/\s+/g, '')
}

function profileToPost(profile: InicioProfile): InicioPost {
  return {
    id: 10000 + profile.id,
    userId: profile.userId,
    author: profile.name,
    role: profile.role,
    time: 'Perfil de la comunidad',
    category: 'comunidad',
    badge: profile.role,
    badgeTone: 'green',
    body: profile.description,
    likes: 0,
    comments: [],
  }
}
