import { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'

interface ReviewModalProps {
  visible: boolean
  requestId: string
  providerId: string
  providerName: string
  onClose: () => void
  onSubmitted: () => void
}

export function ReviewModal({ visible, requestId, providerId, providerName, onClose, onSubmitted }: ReviewModalProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setRating(0)
    setBody('')
  }

  async function handleSubmit() {
    if (!rating) {
      const msg = 'Please select a star rating.'
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Rating required', msg)
      return
    }
    if (!user) return

    setSubmitting(true)
    const { error } = await supabase.from('reviews').insert({
      request_id: requestId,
      reviewer_id: user.id,
      provider_id: providerId,
      rating,
      body: body.trim() || null,
    })
    setSubmitting(false)

    if (error) {
      const msg = error.message.includes('unique')
        ? 'You have already reviewed this job.'
        : error.message
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Error', msg)
      return
    }

    reset()
    onSubmitted()
  }

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Rate your experience</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={24} color="#475569" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>How was your experience with {providerName}?</Text>

          {/* Star picker */}
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)} activeOpacity={0.7}>
                <Ionicons
                  name={n <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={n <= rating ? '#FACC15' : '#94A3B8'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Great' : 'Excellent'}
            </Text>
          )}

          {/* Comment */}
          <TextInput
            style={styles.input}
            placeholder="Tell others about your experience (optional)..."
            placeholderTextColor="#94A3B8"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !rating && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !rating}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 20,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    padding: 14,
    fontSize: 15,
    color: '#1E3A8A',
    minHeight: 100,
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#DBEAFE',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
