/**
 * WhatsApp API
 */

import api from './client'
import type { WhatsAppMessage, SendMessagePayload, WhatsAppConversation } from '@/types/whatsapp'

export const whatsappApi = {
  // Get all conversations
  async getConversations(): Promise<WhatsAppConversation[]> {
    const response = await api.get<WhatsAppConversation[]>('/whatsapp/conversations/')
    return response.data
  },

  // Get messages for a lead or client
  async getMessages(params: { leadId?: number; clientId?: number }): Promise<WhatsAppMessage[]> {
    const queryParams = new URLSearchParams()
    if (params.leadId) queryParams.append('lead_id', params.leadId.toString())
    if (params.clientId) queryParams.append('client_id', params.clientId.toString())

    const response = await api.get<WhatsAppMessage[]>(`/whatsapp/messages/?${queryParams.toString()}`)
    return response.data
  },

  // Send a message
  async sendMessage(payload: SendMessagePayload): Promise<WhatsAppMessage> {
    const response = await api.post<WhatsAppMessage>('/whatsapp/send/', {
      lead_id: payload.leadId,
      client_id: payload.clientId,
      content: payload.content,
    })
    return response.data
  },

  // Simulate inbound message (for testing)
  async simulateInbound(payload: SendMessagePayload): Promise<WhatsAppMessage> {
    const response = await api.post<WhatsAppMessage>('/whatsapp/simulate-inbound/', {
      lead_id: payload.leadId,
      client_id: payload.clientId,
      content: payload.content,
    })
    return response.data
  },
}
