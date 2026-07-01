export type MensajeCampaignType = 'collaboration' | 'talent'
export type MensajeCampaignStatus = 'pending' | 'accepted' | 'declined' | 'deleted'

export type MensajeCampaignForm = {
  projectName: string
  description: string
  requirements: string
  deadline?: string
}

export type MensajeChatMessage = {
  id: string
  sender: 'me' | 'them'
  type: 'text' | 'campaign'
  text?: string
  campaignType?: MensajeCampaignType
  campaignName?: string
  campaignDescription?: string
  campaignRequirements?: string
  campaignDeadline?: string
  campaignStatus?: MensajeCampaignStatus
  campaignSenderUserId?: string
  campaignReceiverUserId?: string
  time: string
}

export type MensajeConversation = {
  id: string
  recipientUserId?: string | null
  author: string
  avatar: string
  lastMessage: string
  time: string
  unreadCount: number
  isOnline: boolean
  messages: MensajeChatMessage[]
}

export type MensajesPageState = {
  title: string
  conversations: MensajeConversation[]
}
