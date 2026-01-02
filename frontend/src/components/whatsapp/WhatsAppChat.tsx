/**
 * WhatsApp Chat Component
 * Displays chat messages and allows sending messages
 */

import { useState, useEffect, useRef } from 'react'
import { Send, Check, CheckCheck, AlertCircle, MessageCircle } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { useWhatsAppMessages, useSendWhatsAppMessage } from '@/hooks/useWhatsApp'
import type { WhatsAppMessage, MessageStatus } from '@/types/whatsapp'

interface WhatsAppChatProps {
  entityType: 'lead' | 'client'
  entityId: number
  phone: string
  contactName?: string
  showHeader?: boolean
}

// Status indicator component
function StatusIndicator({ status }: { status: MessageStatus }) {
  switch (status) {
    case 'sent':
      return <Check className="w-3.5 h-3.5 text-slate-400" />
    case 'delivered':
      return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
    case 'read':
      return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
    case 'failed':
      return <AlertCircle className="w-3.5 h-3.5 text-red-500" />
    default:
      return null
  }
}

// Format timestamp for display
function formatMessageTime(dateString: string): string {
  const date = new Date(dateString)
  return format(date, 'HH:mm')
}

// Format date for day separator
function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMMM d, yyyy')
}

// Group messages by date
function groupMessagesByDate(messages: WhatsAppMessage[]): Map<string, WhatsAppMessage[]> {
  const groups = new Map<string, WhatsAppMessage[]>()

  messages.forEach(msg => {
    const date = format(new Date(msg.createdAt), 'yyyy-MM-dd')
    const existing = groups.get(date) || []
    groups.set(date, [...existing, msg])
  })

  return groups
}

export function WhatsAppChat({ entityType, entityId, phone, contactName, showHeader = false }: WhatsAppChatProps) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: messages = [], isLoading, error } = useWhatsAppMessages(entityType, entityId)
  const sendMessage = useSendWhatsAppMessage()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = () => {
    if (!message.trim() || sendMessage.isPending) return

    const payload = entityType === 'lead'
      ? { leadId: entityId, content: message.trim() }
      : { clientId: entityId, content: message.trim() }

    sendMessage.mutate(payload, {
      onSuccess: () => {
        setMessage('')
        inputRef.current?.focus()
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-400">Loading messages...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-sm text-red-500">Failed to load messages</div>
      </div>
    )
  }

  const groupedMessages = groupMessagesByDate(messages)

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      {showHeader && contactName && (
        <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-medium text-slate-900">
              {contactName}
            </h2>
            <p className="text-xs text-slate-500">
              {phone}
            </p>
          </div>
        </div>
      )}
      {/* Chat Background */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3"
        style={{
          backgroundColor: '#e5ded8',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23d4cdc5\' fill-opacity=\'0.4\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")'
        }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <p className="text-sm text-slate-600">
              No messages yet
            </p>
          </div>
        ) : (
          <>
            {Array.from(groupedMessages.entries()).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex justify-center my-3">
                  <span className="px-3 py-1 text-xs bg-white/80 text-slate-600 rounded-lg shadow-sm">
                    {formatDateSeparator(dateMessages[0].createdAt)}
                  </span>
                </div>

                {/* Messages */}
                {dateMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex mb-1 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`relative max-w-[75%] px-3 py-2 rounded-lg shadow-sm ${
                        msg.direction === 'outbound'
                          ? 'bg-[#dcf8c6]'
                          : 'bg-white'
                      }`}
                    >
                      {/* Message tail */}
                      <div
                        className={`absolute top-0 w-3 h-3 overflow-hidden ${
                          msg.direction === 'outbound'
                            ? '-right-1.5'
                            : '-left-1.5'
                        }`}
                        style={{
                          clipPath: msg.direction === 'outbound'
                            ? 'polygon(0 0, 100% 0, 0 100%)'
                            : 'polygon(100% 0, 0 0, 100% 100%)'
                        }}
                      >
                        <div
                          className={`w-full h-full ${
                            msg.direction === 'outbound'
                              ? 'bg-[#dcf8c6]'
                              : 'bg-white'
                          }`}
                        />
                      </div>

                      {/* Message Content */}
                      <p className="text-sm text-slate-900 whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>

                      {/* Time and Status */}
                      <div className={`flex items-center gap-1 mt-1 ${
                        msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-[10px] text-slate-500">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                        {msg.direction === 'outbound' && (
                          <StatusIndicator status={msg.status} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 py-3 bg-slate-100 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sendMessage.isPending}
            className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-full text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            className={`p-2.5 rounded-full transition-colors ${
              message.trim() && !sendMessage.isPending
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
