import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import type {
  MensajeCampaignForm,
  MensajeCampaignType,
  MensajeChatMessage,
  MensajeConversation,
  MensajesPageState,
} from '../types/mensajesTypes'
import {
  getMessagesEmptyImage,
  getMessagesNavigationImage,
  getMessagesTitleImage,
} from '../menu/messagesNavigationMenu'
import './Mensajes.css'

type MensajesContentProps = {
  page: MensajesPageState
  selectedConversationId?: string
  onBack?: () => void
  onOpenProfile?: () => void
  onSelectConversation?: (conversationId: string) => void
  hasUnreadMessages?: boolean
  onSendMessage?: (conversationId: string, text: string) => void
  onCreateCampaign?: (
    conversationId: string,
    campaignType: MensajeCampaignType,
    campaign: MensajeCampaignForm,
  ) => void
  onDeleteCampaign?: (conversationId: string, campaignMessageId: string) => void
  onAcceptCampaign?: (conversationId: string, campaignMessageId: string) => void
  onDeclineCampaign?: (conversationId: string, campaignMessageId: string) => void
}

type CampaignComposerState = MensajeCampaignForm & {
  hasDeadline: boolean
}

const emptyCampaignForm: CampaignComposerState = {
  projectName: '',
  description: '',
  requirements: '',
  deadline: '',
  hasDeadline: false,
}

export function MensajesContent({
  page,
  selectedConversationId,
  onBack,
  onOpenProfile,
  onSelectConversation,
  hasUnreadMessages = false,
  onSendMessage,
  onCreateCampaign,
  onDeleteCampaign,
  onAcceptCampaign,
  onDeclineCampaign,
}: MensajesContentProps) {
  const [query, setQuery] = useState('')
  const [localSelectedConversationId, setLocalSelectedConversationId] = useState<string>()
  const [draft, setDraft] = useState('')
  const [isCampaignMenuOpen, setIsCampaignMenuOpen] = useState(false)
  const [activeCampaignType, setActiveCampaignType] = useState<MensajeCampaignType>()
  const [campaignForm, setCampaignForm] = useState<CampaignComposerState>(emptyCampaignForm)

  const activeConversationId = selectedConversationId ?? localSelectedConversationId
  const activeConversation = page.conversations.find(
    (conversation) => conversation.id === activeConversationId,
  )

  const filteredConversations = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()

    if (!cleanQuery) {
      return page.conversations
    }

    return page.conversations.filter((conversation) =>
      `${conversation.author} ${conversation.lastMessage}`.toLowerCase().includes(cleanQuery),
    )
  }, [page.conversations, query])

  function handleSelectConversation(conversationId: string) {
    setLocalSelectedConversationId(conversationId)
    onSelectConversation?.(conversationId)
  }

  function handleBack() {
    if (activeConversation) {
      setLocalSelectedConversationId(undefined)
      onSelectConversation?.('')
      return
    }

    onBack?.()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeConversation || !draft.trim()) {
      return
    }

    onSendMessage?.(activeConversation.id, draft)
    setDraft('')
  }

  function openCampaignComposer(campaignType: MensajeCampaignType) {
    if (!activeConversation) {
      return
    }

    setActiveCampaignType(campaignType)
    setCampaignForm(emptyCampaignForm)
    setIsCampaignMenuOpen(false)
  }

  function closeCampaignComposer() {
    setActiveCampaignType(undefined)
    setCampaignForm(emptyCampaignForm)
  }

  function updateCampaignForm<Key extends keyof CampaignComposerState>(
    field: Key,
    value: CampaignComposerState[Key],
  ) {
    setCampaignForm((current) => ({ ...current, [field]: value }))
  }

  function submitCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeConversation || !activeCampaignType || !campaignForm.projectName.trim()) {
      return
    }

    onCreateCampaign?.(activeConversation.id, activeCampaignType, {
      projectName: campaignForm.projectName,
      description: campaignForm.description,
      requirements: campaignForm.requirements,
      deadline: campaignForm.hasDeadline ? campaignForm.deadline : undefined,
    })
    closeCampaignComposer()
  }

  return (
    <main className="mensajes-page">
      <header className="mensajes-topbar">
        <strong className="mensajes-brand">
          <img src="/logos/ciem-horizontal-logo.png" alt="CIEM" />
        </strong>
        <nav className="mensajes-nav" aria-label="Navegacion principal">
          <button className="mensajes-nav-button" type="button" onClick={onBack}>
            <img
              className="mensajes-nav-icon"
              src={getMessagesNavigationImage('inicio')}
              alt=""
              aria-hidden="true"
            />
            Inicio
          </button>
          <button className="mensajes-nav-button mensajes-nav-button-active" type="button">
            <span className="mensajes-nav-icon-wrap">
              <img
                className="mensajes-nav-icon"
                src={getMessagesNavigationImage('mensajes')}
                alt=""
                aria-hidden="true"
              />
              {hasUnreadMessages ? <span className="mensajes-topbar-unread-dot" aria-label="Mensajes sin leer" /> : null}
            </span>
            Mensajes
          </button>
          <button className="mensajes-nav-button" type="button" onClick={onOpenProfile}>
            <img
              className="mensajes-nav-icon"
              src={getMessagesNavigationImage('perfil')}
              alt=""
              aria-hidden="true"
            />
            Perfil
          </button>
        </nav>
      </header>

      <section className="mensajes-shell">
        <aside className="mensajes-sidebar" aria-label="Conversaciones">
          <header className="mensajes-inbox-header">
            <div>
              <h1 className="mensajes-title-image-wrap">
                <img src={getMessagesTitleImage()} alt={page.title} />
              </h1>
              <span>{page.conversations.length} conversaciones</span>
            </div>
          </header>

          <section className="mensajes-search-row" aria-label="Buscar conversaciones">
            <label className="mensajes-search">
              <span>o</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar"
              />
            </label>
          </section>

          <div className="mensajes-list-title">
            <strong>Mensajes</strong>
          </div>

          <section className="mensajes-list" aria-label="Lista de conversaciones">
            {filteredConversations.map((conversation) => (
              <button
                className={`mensajes-item ${
                  activeConversationId === conversation.id ? 'mensajes-item-active' : ''
                }`}
                key={conversation.id}
                type="button"
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <div className="mensajes-avatar-wrap">
                  <span className="mensajes-avatar">{conversation.avatar}</span>
                  {conversation.isOnline ? <span className="mensajes-online" /> : null}
                </div>

                <span className="mensajes-copy">
                  <strong>{conversation.author}</strong>
                  <span>{conversation.lastMessage}</span>
                </span>

                <span className="mensajes-meta">
                  <time>{conversation.time}</time>
                  {conversation.unreadCount > 0 ? (
                    <span className="mensajes-unread">{conversation.unreadCount}</span>
                  ) : null}
                </span>
              </button>
            ))}
          </section>
        </aside>

        <section className="mensajes-chat-pane" aria-label="Panel de chat">
          {activeConversation ? (
            <ChatView
              conversation={activeConversation}
              draft={draft}
              isCampaignMenuOpen={isCampaignMenuOpen}
              onBack={handleBack}
              onDraftChange={setDraft}
              onSubmit={handleSubmit}
              onToggleCampaignMenu={() => setIsCampaignMenuOpen((current) => !current)}
              onCreateCampaign={openCampaignComposer}
              activeCampaignType={activeCampaignType}
              campaignForm={campaignForm}
              onCampaignFormChange={updateCampaignForm}
              onCancelCampaign={closeCampaignComposer}
              onSubmitCampaign={submitCampaign}
              onDeleteCampaign={onDeleteCampaign}
              onAcceptCampaign={onAcceptCampaign}
              onDeclineCampaign={onDeclineCampaign}
            />
          ) : (
            <section className="mensajes-empty-state" aria-label="Tus mensajes">
              <div className="mensajes-empty-icon">
                <img src={getMessagesEmptyImage()} alt="" aria-hidden="true" />
              </div>
              <h2>Tus mensajes</h2>
              <p>Envia mensajes privados a un contacto de tu comunidad.</p>
            </section>
          )}
        </section>
      </section>
    </main>
  )
}

type ChatViewProps = {
  conversation: MensajeConversation
  draft: string
  isCampaignMenuOpen: boolean
  onBack: () => void
  onDraftChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onToggleCampaignMenu: () => void
  onCreateCampaign: (campaignType: MensajeCampaignType) => void
  activeCampaignType?: MensajeCampaignType
  campaignForm: CampaignComposerState
  onCampaignFormChange: <Key extends keyof CampaignComposerState>(
    field: Key,
    value: CampaignComposerState[Key],
  ) => void
  onCancelCampaign: () => void
  onSubmitCampaign: (event: FormEvent<HTMLFormElement>) => void
  onDeleteCampaign?: (conversationId: string, campaignMessageId: string) => void
  onAcceptCampaign?: (conversationId: string, campaignMessageId: string) => void
  onDeclineCampaign?: (conversationId: string, campaignMessageId: string) => void
}

function ChatView({
  conversation,
  draft,
  isCampaignMenuOpen,
  onBack,
  onDraftChange,
  onSubmit,
  onToggleCampaignMenu,
  onCreateCampaign,
  activeCampaignType,
  campaignForm,
  onCampaignFormChange,
  onCancelCampaign,
  onSubmitCampaign,
  onDeleteCampaign,
  onAcceptCampaign,
  onDeclineCampaign,
}: ChatViewProps) {
  const threadRef = useRef<HTMLElement | null>(null)
  const campaignRefs = useRef<Record<string, HTMLElement | null>>({})
  const [isCampaignHistoryOpen, setIsCampaignHistoryOpen] = useState(false)
  const [showScrollBottomButton, setShowScrollBottomButton] = useState(false)
  const campaignMessages = useMemo(
    () => conversation.messages.filter((message) => message.type === 'campaign'),
    [conversation.messages],
  )

  useEffect(() => {
    setIsCampaignHistoryOpen(false)
    campaignRefs.current = {}
    setShowScrollBottomButton(false)
  }, [conversation.id])

  useEffect(() => {
    const thread = threadRef.current

    if (!thread) {
      return
    }

    const currentThread = thread

    function updateScrollButton() {
      const distanceFromBottom =
        currentThread.scrollHeight - currentThread.scrollTop - currentThread.clientHeight
      setShowScrollBottomButton(distanceFromBottom > 120)
    }

    updateScrollButton()
    currentThread.addEventListener('scroll', updateScrollButton)

    return () => currentThread.removeEventListener('scroll', updateScrollButton)
  }, [conversation.id, conversation.messages.length])

  function scrollToCampaign(messageId: string) {
    const target = campaignRefs.current[messageId]

    if (!target) {
      return
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setIsCampaignHistoryOpen(false)
  }

  function scrollToLastMessage() {
    const thread = threadRef.current

    if (!thread) {
      return
    }

    thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' })
  }

  return (
    <main className="chat-page">
      <header className="chat-header">
        <div className="chat-header-main">
          <button className="mensajes-back" type="button" aria-label="Volver a mensajes" onClick={onBack}>
            {'<'}
          </button>
          <span className="mensajes-avatar chat-avatar">{conversation.avatar}</span>
          <div className="chat-title">
            <h1>{conversation.author}</h1>
            <p>{conversation.isOnline ? 'En linea' : 'Desconectado'}</p>
          </div>
        </div>

        <div className="chat-header-actions">
          <div className="chat-campaign-history-wrap">
            <button
              className="chat-history-button"
              type="button"
              aria-expanded={isCampaignHistoryOpen}
              onClick={() => setIsCampaignHistoryOpen((current) => !current)}
            >
              Campañas
            </button>
            {isCampaignHistoryOpen ? (
              <section className="chat-campaign-history" aria-label="Historial de campañas">
                <div className="chat-campaign-history-title">
                  <strong>Historial</strong>
                  <span>{campaignMessages.length} campañas</span>
                </div>
                {campaignMessages.length > 0 ? (
                  <div className="chat-campaign-history-list">
                    {campaignMessages.map((message) => (
                      <article key={message.id} className="chat-campaign-history-item">
                        <div>
                          <strong>{message.campaignName || 'Campaña sin título'}</strong>
                          <small>{message.time}</small>
                        </div>
                        <button type="button" onClick={() => scrollToCampaign(message.id)}>
                          Ver detalles
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="chat-campaign-history-empty">Todavia no hay campañas en este chat.</p>
                )}
              </section>
            ) : null}
          </div>
        </div>
      </header>

      <section ref={threadRef} className="chat-thread" aria-label={`Chat con ${conversation.author}`}>
        {conversation.messages.map((message) => (
          <ChatMessageBubble
            key={message.id}
            message={message}
            conversationId={conversation.id}
            onDeleteCampaign={onDeleteCampaign}
            onAcceptCampaign={onAcceptCampaign}
            onDeclineCampaign={onDeclineCampaign}
            onRegisterRef={(element) => {
              if (message.type === 'campaign') {
                campaignRefs.current[message.id] = element
              }
            }}
          />
        ))}
      </section>

      {showScrollBottomButton ? (
        <button
          className="chat-scroll-bottom"
          type="button"
          aria-label="Ir al ultimo mensaje"
          onClick={scrollToLastMessage}
        >
          <img src="/icons/scroll-bottom.png" alt="" />
        </button>
      ) : null}

      <footer className="chat-footer">
        {isCampaignMenuOpen ? (
          <section className="chat-campaign-panel" aria-label="Iniciar campana profesional">
            <p>Iniciar campana profesional:</p>
            <button type="button" onClick={() => onCreateCampaign('collaboration')}>
              <span className="chat-campaign-logo-wrap">
                <img className="chat-campaign-logo" src="/campanas-logo.png" alt="" aria-hidden="true" />
              </span>
              <span>
                <strong>Enviar Propuesta de Colaboracion</strong>
                <small>Ideal para influencers y expertos que se presentan ante una marca</small>
              </span>
            </button>
          </section>
        ) : null}

        <form className="chat-compose" onSubmit={onSubmit}>
          <button
            className="chat-plus"
            type="button"
            aria-label="Abrir opciones de campana"
            onClick={onToggleCampaignMenu}
          >
            +
          </button>
          <input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Escribe un mensaje..."
          />
          <button className="chat-send" type="submit" aria-label="Enviar mensaje">
            {'>'}
          </button>
        </form>
      </footer>

      {activeCampaignType ? (
        <CampaignComposer
          campaignType={activeCampaignType}
          form={campaignForm}
          onChange={onCampaignFormChange}
          onCancel={onCancelCampaign}
          onSubmit={onSubmitCampaign}
        />
      ) : null}
    </main>
  )
}

type CampaignComposerProps = {
  campaignType: MensajeCampaignType
  form: CampaignComposerState
  onChange: <Key extends keyof CampaignComposerState>(
    field: Key,
    value: CampaignComposerState[Key],
  ) => void
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function CampaignComposer({
  campaignType,
  form,
  onChange,
  onCancel,
  onSubmit,
}: CampaignComposerProps) {
  const isCollaboration = campaignType === 'collaboration'
  const title = isCollaboration ? 'Propuesta de Colaboracion' : 'Convocatoria de Talento'

  return (
    <div className="chat-campaign-modal-backdrop">
      <form className="chat-campaign-composer" onSubmit={onSubmit}>
        <header className="chat-campaign-composer-header">
          <span className="chat-campaign-composer-icon">{isCollaboration ? '+' : '[]'}</span>
          <div>
            <h2>{title}</h2>
            <p>{isCollaboration ? 'Presenta una colaboracion profesional' : 'Publica una solicitud para tu proyecto'}</p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onCancel}>
            x
          </button>
        </header>

        <div className="chat-campaign-composer-body">
          <span className="chat-campaign-pill">{title}</span>

          <label className="chat-campaign-field">
            <span>Nombre del proyecto</span>
            <input
              value={form.projectName}
              onChange={(event) => onChange('projectName', event.target.value)}
              placeholder="Ej: Campana de brunch de fin de semana"
              required
            />
          </label>

          <label className="chat-campaign-field">
            <span>Descripcion del trabajo</span>
            <textarea
              value={form.description}
              onChange={(event) => onChange('description', event.target.value)}
              placeholder="Describe que se necesita, objetivos y alcance del proyecto."
            />
          </label>

          <label className="chat-campaign-field">
            <span>Requisitos</span>
            <textarea
              value={form.requirements}
              onChange={(event) => onChange('requirements', event.target.value)}
              placeholder="Ej: experiencia, ubicacion, entregables, disponibilidad."
            />
          </label>

          <section className={`chat-deadline-panel ${form.hasDeadline ? 'chat-deadline-panel-active' : ''}`}>
            <div className="chat-deadline-row">
              <div>
                <strong>Fecha limite</strong>
                <small>{form.hasDeadline ? 'Activada' : 'Desactivada'}</small>
              </div>
              <button
                className={`chat-deadline-switch ${form.hasDeadline ? 'chat-deadline-switch-active' : ''}`}
                type="button"
                onClick={() => onChange('hasDeadline', !form.hasDeadline)}
              >
                <span>{form.hasDeadline ? 'Activado' : 'Desactivado'}</span>
              </button>
            </div>

            {form.hasDeadline ? (
              <label className="chat-campaign-field chat-calendar-field">
                <span>Elige la fecha limite</span>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(event) => onChange('deadline', event.target.value)}
                />
              </label>
            ) : null}
          </section>
        </div>

        <footer className="chat-campaign-composer-footer">
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit">Enviar</button>
        </footer>
      </form>
    </div>
  )
}

type ChatMessageBubbleProps = {
  message: MensajeChatMessage
  conversationId: string
  onRegisterRef?: (element: HTMLElement | null) => void
  onDeleteCampaign?: (conversationId: string, campaignMessageId: string) => void
  onAcceptCampaign?: (conversationId: string, campaignMessageId: string) => void
  onDeclineCampaign?: (conversationId: string, campaignMessageId: string) => void
}

function ChatMessageBubble({
  message,
  conversationId,
  onRegisterRef,
  onDeleteCampaign,
  onAcceptCampaign,
  onDeclineCampaign,
}: ChatMessageBubbleProps) {
  if (message.type === 'campaign') {
    const isCollaboration = message.campaignType === 'collaboration'
    const title = isCollaboration ? 'Propuesta de Colaboracion' : 'Solicitud de Talento'
    const body = isCollaboration ? 'COLABORACION' : 'SOLICITUD DE TALENTO'
    const formattedDeadline = message.campaignDeadline
      ? new Date(`${message.campaignDeadline}T00:00:00`).toLocaleDateString('es-PE', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : ''
    const campaignStatus = message.campaignStatus ?? 'pending'
    const isOwnCampaign = message.sender === 'me'

    return (
      <article
        ref={onRegisterRef}
        className={`chat-message-row ${
          message.sender === 'me' ? 'chat-message-row-me' : 'chat-message-row-them'
        }`}
      >
        <div className="chat-campaign-card">
          <header className={isCollaboration ? 'chat-card-green' : 'chat-card-blue'}>{title}</header>
          <div>
            <h3>{message.campaignName || body}</h3>
            {message.campaignDescription ? <p>{message.campaignDescription}</p> : null}
            {message.campaignRequirements ? (
              <p>
                <strong>Requisitos:</strong> {message.campaignRequirements}
              </p>
            ) : null}
            {formattedDeadline ? <small>Fecha limite: {formattedDeadline}</small> : null}
            {campaignStatus === 'pending' ? (
              <div className="chat-card-actions">
                {isOwnCampaign ? (
                  <button
                    className="chat-card-delete"
                    type="button"
                    onClick={() => onDeleteCampaign?.(conversationId, message.id)}
                  >
                    Borrar
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onAcceptCampaign?.(conversationId, message.id)}
                    >
                      Aceptar Campana
                    </button>
                    <button
                      className="chat-card-delete"
                      type="button"
                      onClick={() => onDeclineCampaign?.(conversationId, message.id)}
                    >
                      Declinar
                    </button>
                  </>
                )}
              </div>
            ) : (
              <span className={`chat-campaign-status chat-campaign-status-${campaignStatus}`}>
                {getCampaignStatusLabel(campaignStatus)}
              </span>
            )}
          </div>
        </div>
        <time>{message.time}</time>
      </article>
    )
  }

  return (
    <article
      className={`chat-message-row ${
        message.sender === 'me' ? 'chat-message-row-me' : 'chat-message-row-them'
      }`}
    >
      <p className="chat-bubble">{message.text}</p>
      <time>{message.time}</time>
    </article>
  )
}

function getCampaignStatusLabel(status: NonNullable<MensajeChatMessage['campaignStatus']>) {
  switch (status) {
    case 'accepted':
      return 'Campana aceptada'
    case 'declined':
      return 'Campana declinada'
    case 'deleted':
      return 'Campana eliminada'
    default:
      return 'Pendiente'
  }
}
