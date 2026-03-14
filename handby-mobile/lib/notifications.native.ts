import { Platform } from 'react-native'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { supabase } from './supabase'

// Detect Expo Go — expo-notifications push functionality was removed from Expo Go in SDK 53
const isExpoGo = Constants.appOwnership === 'expo'

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (isExpoGo) {
    console.log('Push notifications are not supported in Expo Go (SDK 53+)')
    return null
  }

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device')
    return null
  }

  try {
    const N = await import('expo-notifications')

    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    })

    const { status: existingStatus } = await N.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await N.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted')
      return null
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const tokenData = await N.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    })
    const token = tokenData.data

    if (Platform.OS === 'android') {
      N.setNotificationChannelAsync('job-updates', {
        name: 'Job Updates',
        importance: N.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E40AF',
      })
    }

    await supabase.from('push_tokens').upsert(
      { user_id: userId, token, platform: Platform.OS, updated_at: new Date().toISOString() },
      { onConflict: 'user_id, token' }
    )

    return token
  } catch (e) {
    console.log('Push notifications not available:', e)
    return null
  }
}

export async function removePushToken(userId: string) {
  if (isExpoGo) return

  try {
    const N = await import('expo-notifications')
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const tokenData = await N.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    })
    await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', tokenData.data)
  } catch {
    // Ignore errors during cleanup
  }
}
