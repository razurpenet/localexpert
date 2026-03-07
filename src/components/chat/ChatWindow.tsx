'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

interface ChatWindowProps {
  requestId: string
  currentUserId: string
  currentUserRole: 'provider' | 'customer'
  providerId: string
  providerName: string
  customerName: string
  initialMessages: Message[]
}

// Provider = indigo, Customer = emerald
const BUBBLE = {
  provider: {
    self:  'bg-indigo-600 text-white rounded-br-sm',
    other: 'bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-bl-sm',
    time:  { self: 'text-indigo-200', other: 'text-indigo-400' },
    label: 'text-indigo-500',
  },
  customer: {
    self:  'bg-emerald-600 text-white rounded-br-sm',
    other: 'bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-bl-sm',
    time:  { self: 'text-emerald-200', other: 'text-emerald-400' },
    label: 'text-emerald-500',
  },
}

export function ChatWindow({
  requestId,
  currentUserId,
  currentUserRole,
  providerId,
  providerName,
  customerName,
  initialMessages,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [requestId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    setInput('')

    const { data, error } = await supabase
      .from('messages')
      .insert({ request_id: requestId, sender_id: currentUserId, content })
      .select()
      .single()

    if (!error && data) {
      setMessages((prev) => [...prev, data])
    }
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Legend header
  const providerStyle = BUBBLE.provider
  const customerStyle = BUBBLE.customer

  return (
    <div className="flex flex-col h-[600px]">

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b bg-slate-50 text-xs font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
          <span className="text-indigo-700">{providerName} (Provider)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
          <span className="text-emerald-700">{customerName} (Customer)</span>
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">
            No messages yet — say hello to get started.
          </p>
        )}
        {messages.map((m) => {
          const isMe = m.sender_id === currentUserId
          const senderIsProvider = m.sender_id === providerId
          const role: 'provider' | 'customer' = senderIsProvider ? 'provider' : 'customer'
          const style = role === 'provider' ? providerStyle : customerStyle
          const bubbleCls = isMe ? style.self : style.other
          const timeCls  = isMe ? style.time.self : style.time.other
          const senderLabel = senderIsProvider ? providerName : customerName

          return (
            <div key={m.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
              {/* Sender label — only on incoming messages */}
              {!isMe && (
                <span className={`text-[11px] font-semibold px-1 ${style.label}`}>
                  {senderLabel}
                </span>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm space-y-1 ${bubbleCls}`}>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`text-[10px] ${timeCls}`}>
                  {new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white p-3 flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={2}
          className="resize-none"
        />
        <Button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          size="icon"
          className={`shrink-0 ${currentUserRole === 'provider' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
