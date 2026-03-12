import { useEffect, useState, useRef, useCallback } from 'react'
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { colors, radius } from '../../lib/theme'
import { QuoteCard } from '../../components/chat/QuoteCard'
import { BookingCard } from '../../components/chat/BookingCard'
import { QuoteBottomSheet } from '../../components/chat/QuoteBottomSheet'
import { BookingBottomSheet } from '../../components/chat/BookingBottomSheet'
import { ChatActionMenu } from '../../components/chat/ChatActionMenu'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  type: 'text' | 'quote' | 'booking'
  metadata: { quote_id?: string; appointment_id?: string } | null
}

export default function ChatScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>()
  const { user, profile } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<any>(null)
  const [acceptedQuote, setAcceptedQuote] = useState<{ id: string; total: number } | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showQuoteSheet, setShowQuoteSheet] = useState(false)
  const [showBookingSheet, setShowBookingSheet] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  const isProvider = user?.id === request?.provider_id

  const fetchAcceptedQuote = useCallback(async () => {
    if (!requestId) return
    const { data } = await supabase
      .from('quotes')
      .select('id, total')
      .eq('request_id', requestId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    setAcceptedQuote(data ?? null)
  }, [requestId])

  useEffect(() => {
    if (!requestId) return

    // Fetch request details
    supabase
      .from('quote_requests')
      .select('*, profiles!quote_requests_customer_id_fkey(full_name), provider:profiles!quote_requests_provider_id_fkey(full_name)')
      .eq('id', requestId)
      .single()
      .then(({ data }) => setRequest(data))

    // Fetch messages (including type + metadata)
    supabase
      .from('messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as unknown as Message[]) ?? [])
        setLoading(false)
      })

    // Fetch accepted quote
    fetchAcceptedQuote()

    // Subscribe to new messages
    const msgChannel = supabase
      .channel(`chat-${requestId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${requestId}` },
        (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === (payload.new as Message).id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .subscribe()

    // Subscribe to quote status changes (for card updates + booking gate)
    const quoteChannel = supabase
      .channel(`chat-quotes-${requestId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quotes', filter: `request_id=eq.${requestId}` },
        () => { fetchAcceptedQuote() }
      )
      .subscribe()

    // Subscribe to appointment status changes (for card updates)
    const apptChannel = supabase
      .channel(`chat-appts-${requestId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `request_id=eq.${requestId}` },
        () => { /* BookingCard fetches its own data; this just ensures re-render if needed */ }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(quoteChannel)
      supabase.removeChannel(apptChannel)
    }
  }, [requestId, fetchAcceptedQuote])

  async function sendMessage() {
    if (!input.trim() || !user) return
    const content = input.trim()
    setInput('')

    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: user.id,
      content,
    })
  }

  const otherName = request
    ? (user?.id === request.customer_id ? request.provider?.full_name : request.profiles?.full_name)
    : 'Chat'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (router.canGoBack()) {
            router.back()
          } else {
            router.replace(profile?.role === 'provider' ? '/(provider)/requests' : '/(customer)/bookings')
          }
        }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherName ?? 'Chat'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>No messages yet — start the conversation</Text>
              </View>
            }
            renderItem={({ item }) => {
              // Quote card
              if (item.type === 'quote' && item.metadata?.quote_id) {
                return <QuoteCard quoteId={item.metadata.quote_id} onStatusChange={fetchAcceptedQuote} />
              }

              // Booking card
              if (item.type === 'booking' && item.metadata?.appointment_id) {
                return <BookingCard appointmentId={item.metadata.appointment_id} />
              }

              // Text bubble (default)
              const isMe = item.sender_id === user?.id
              return (
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.bubbleText, isMe ? styles.textMe : styles.textThem]}>
                    {item.content}
                  </Text>
                  <Text style={[styles.time, isMe && styles.timeMe]}>
                    {new Date(item.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )
            }}
          />

          {/* Input bar */}
          <View style={styles.inputBar}>
            {isProvider && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowMenu(true)}>
                <Ionicons name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={!input.trim()}>
              <Ionicons name="send" size={22} color={input.trim() ? colors.cta : colors.textMuted} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Action menu */}
      <ChatActionMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onSendQuote={() => setShowQuoteSheet(true)}
        onBookAppointment={() => setShowBookingSheet(true)}
        canBook={!!acceptedQuote}
      />

      {/* Quote bottom sheet */}
      <QuoteBottomSheet
        visible={showQuoteSheet}
        onClose={() => setShowQuoteSheet(false)}
        requestId={requestId!}
        customerId={request?.customer_id}
      />

      {/* Booking bottom sheet */}
      <BookingBottomSheet
        visible={showBookingSheet}
        onClose={() => setShowBookingSheet(false)}
        requestId={requestId!}
        customerId={request?.customer_id}
        acceptedQuote={acceptedQuote}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 8 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  textMe: { color: '#FFFFFF' },
  textThem: { color: colors.textPrimary },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  timeMe: { color: 'rgba(255,255,255,0.7)' },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyChatText: { color: colors.textMuted, fontSize: 14 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, backgroundColor: colors.primaryBg, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    color: colors.textPrimary, maxHeight: 100,
  },
  sendBtn: { padding: 8 },
})
