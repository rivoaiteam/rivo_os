/**
 * WhatsApp Types
 */

export type MessageDirection = 'inbound' | 'outbound'
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed'

export interface WhatsAppMessage {
  id: number
  direction: MessageDirection
  phone: string
  content: string
  status: MessageStatus
  createdAt: string
}

export interface SendMessagePayload {
  leadId?: number
  clientId?: number
  content: string
}

export interface WhatsAppConversation {
  entityType: 'lead' | 'client'
  entityId: number
  name: string
  phone: string
  lastMessage: string
  lastMessageTime: string
  lastMessageDirection: MessageDirection
}
