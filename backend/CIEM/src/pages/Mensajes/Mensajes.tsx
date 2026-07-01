import { MensajesContent } from './components/MensajesContent'
import { useMensajesPage } from './hooks/useMensajesPage'
import type {
  MensajeCampaignForm,
  MensajeCampaignType,
  MensajeConversation,
} from './types/mensajesTypes'

type MensajesProps = {
  conversations?: MensajeConversation[]
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

export default function Mensajes({
  conversations,
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
}: MensajesProps) {
  const page = useMensajesPage(conversations)

  return (
    <MensajesContent
      page={page}
      selectedConversationId={selectedConversationId}
      onBack={onBack}
      onOpenProfile={onOpenProfile}
      onSelectConversation={onSelectConversation}
      hasUnreadMessages={hasUnreadMessages}
      onSendMessage={onSendMessage}
      onCreateCampaign={onCreateCampaign}
      onDeleteCampaign={onDeleteCampaign}
      onAcceptCampaign={onAcceptCampaign}
      onDeclineCampaign={onDeclineCampaign}
    />
  )
}
