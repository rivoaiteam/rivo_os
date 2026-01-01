/**
 * WhatsApp React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { whatsappApi } from '@/api/whatsapp'
import type { SendMessagePayload } from '@/types/whatsapp'

// Query keys
const WHATSAPP_KEYS = {
  conversations: ['whatsapp', 'conversations'] as const,
  messages: (entityType: 'lead' | 'client', entityId: number) =>
    ['whatsapp', 'messages', entityType, entityId] as const,
}

// Get all conversations
export function useWhatsAppConversations() {
  return useQuery({
    queryKey: WHATSAPP_KEYS.conversations,
    queryFn: () => whatsappApi.getConversations(),
    refetchInterval: 10000, // Poll every 10 seconds
  })
}

// Get messages for a lead or client
export function useWhatsAppMessages(entityType: 'lead' | 'client', entityId: number) {
  return useQuery({
    queryKey: WHATSAPP_KEYS.messages(entityType, entityId),
    queryFn: () =>
      whatsappApi.getMessages(
        entityType === 'lead' ? { leadId: entityId } : { clientId: entityId }
      ),
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  })
}

// Send a message
export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => whatsappApi.sendMessage(payload),
    onSuccess: (_, variables) => {
      // Invalidate the messages query to refetch
      if (variables.leadId) {
        queryClient.invalidateQueries({
          queryKey: WHATSAPP_KEYS.messages('lead', variables.leadId),
        })
      }
      if (variables.clientId) {
        queryClient.invalidateQueries({
          queryKey: WHATSAPP_KEYS.messages('client', variables.clientId),
        })
      }
    },
  })
}

// Simulate inbound message (for testing)
export function useSimulateInboundMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => whatsappApi.simulateInbound(payload),
    onSuccess: (_, variables) => {
      if (variables.leadId) {
        queryClient.invalidateQueries({
          queryKey: WHATSAPP_KEYS.messages('lead', variables.leadId),
        })
      }
      if (variables.clientId) {
        queryClient.invalidateQueries({
          queryKey: WHATSAPP_KEYS.messages('client', variables.clientId),
        })
      }
    },
  })
}
