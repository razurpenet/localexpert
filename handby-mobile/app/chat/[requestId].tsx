import { useEffect, useState, useRef } from 'react'
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

export default function ChatScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<any>(null)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    if (!requestId) return

    // Fetch request details
    supabase
      .from('quote_requests')
      .select('*, profiles!quote_requests_customer_id_fkey(full_name), provider:profiles!quote_requests_provider_id_fkey(full_name)')
      .eq('id', requestId)
      .single()
      .then(({ data }) => setRequest(data))

    // Fetch messages
    supabase
      .from('messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? [])
        setLoading(false)
      })

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${requestId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${requestId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [requestId])

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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherName ?? 'Chat'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 40 }} />
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
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#94A3B8"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={!input.trim()}>
              <Ionicons name="send" size={22} color={input.trim() ? '#F97316' : '#94A3B8'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E0E7FF',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1E3A8A' },
  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 8 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#1E40AF', borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  textMe: { color: '#FFFFFF' },
  textThem: { color: '#1E3A8A' },
  time: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  timeMe: { color: 'rgba(255,255,255,0.7)' },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyChatText: { color: '#94A3B8', fontSize: 14 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#E0E7FF',
  },
  input: {
    flex: 1, backgroundColor: '#E0E7FF', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    color: '#1E3A8A', maxHeight: 100,
  },
  sendBtn: { padding: 8 },
})
