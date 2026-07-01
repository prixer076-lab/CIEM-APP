import { type FormEvent, useState } from 'react'
import './Mensajes.css'

type ConnectMessageModalProps = {
  recipientName: string
  initialMessage: string
  onCancel: () => void
  onSend: (message: string) => void | Promise<void>
}

export function ConnectMessageModal({
  recipientName,
  initialMessage,
  onCancel,
  onSend,
}: ConnectMessageModalProps) {
  const [message, setMessage] = useState(initialMessage)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanMessage = message.trim()

    if (!cleanMessage) {
      return
    }

    try {
      setIsSending(true)
      setError('')
      await onSend(cleanMessage)
    } catch {
      setError('No se pudo enviar el mensaje. Intenta nuevamente.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="connect-modal-backdrop" role="presentation">
      <form className="connect-modal" onSubmit={submitMessage}>
        <header className="connect-modal-header">
          <span className="connect-modal-icon">{recipientName.charAt(0)}</span>
          <div>
            <h2>Conectar</h2>
            <p>Enviar mensaje</p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onCancel}>
            x
          </button>
        </header>

        <section className="connect-modal-body">
          <label className="connect-field">
            <span>Mensaje para {recipientName}</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escribe el mensaje que quieres enviar..."
              rows={6}
            />
          </label>
          {error ? <p className="connect-error">{error}</p> : null}
        </section>

        <footer className="connect-modal-footer">
          <button type="button" onClick={onCancel} disabled={isSending}>
            Cancelar
          </button>
          <button type="submit" disabled={isSending}>
            {isSending ? 'Enviando...' : '> Enviar'}
          </button>
        </footer>
      </form>
    </div>
  )
}
