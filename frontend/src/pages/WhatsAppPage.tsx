/**
 * WhatsApp Inbox Page
 * Shows all conversations with the ability to view and send messages
 */

import { useState } from 'react'
import { Search, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useWhatsAppConversations } from '@/hooks/useWhatsApp'
import { WhatsAppChat } from '@/components/whatsapp/WhatsAppChat'
import type { WhatsAppConversation } from '@/types/whatsapp'

// Conversation list item
function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: WhatsAppConversation
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${
        isSelected
          ? 'bg-slate-100'
          : 'hover:bg-slate-50'
      }`}
    >
      {/* Avatar with initials */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-slate-400">
        <span className="text-white font-medium text-sm">
          {conversation.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm text-slate-900 truncate">
            {conversation.name}
          </span>
          <span className="text-xs text-slate-400 flex-shrink-0">
            {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {conversation.lastMessageDirection === 'outbound' && (
            <span className="text-xs text-slate-400">You: </span>
          )}
          <p className="text-sm text-slate-500 truncate">
            {conversation.lastMessage}
          </p>
        </div>
      </div>
    </button>
  )
}

export function WhatsAppPage() {
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: conversations = [], isLoading, error } = useWhatsAppConversations()

  // Filter conversations by search query
  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.phone.includes(searchQuery)
  )

  return (
    <div className="h-full flex rounded-xl overflow-hidden border border-slate-200">
      {/* Conversation List */}
      <div className="w-80 flex-shrink-0 border-r-2 border-slate-300 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-lg font-semibold text-slate-900 mb-3">
            WhatsApp
          </h1>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 border-0 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-slate-400">Loading conversations...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-red-500">Failed to load conversations</div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 px-4">
              <MessageCircle className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-400 text-center">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              <p className="text-xs text-slate-400 text-center mt-1">
                Start messaging from a lead or client page
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={`${conversation.entityType}-${conversation.entityId}`}
                  conversation={conversation}
                  isSelected={
                    selectedConversation?.entityType === conversation.entityType &&
                    selectedConversation?.entityId === conversation.entityId
                  }
                  onClick={() => setSelectedConversation(conversation)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {selectedConversation ? (
          <WhatsAppChat
            entityType={selectedConversation.entityType}
            entityId={selectedConversation.entityId}
            phone={selectedConversation.phone}
            contactName={selectedConversation.name}
            showHeader={true}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center" style={{
            backgroundColor: '#e5ded8',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23d4cdc5\' fill-opacity=\'0.4\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")'
          }}>
            <p className="text-sm text-slate-600">
              Select a conversation to view messages
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WhatsAppPage
