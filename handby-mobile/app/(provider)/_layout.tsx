import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function ProviderLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#1E40AF',
      tabBarInactiveTintColor: '#94A3B8',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E7FF',
        height: 85,
        paddingBottom: 20,
        paddingTop: 8,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Home',
        tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
      }} />
      <Tabs.Screen name="requests" options={{
        title: 'Requests',
        tabBarIcon: ({ color, size }) => <Ionicons name="mail" size={size} color={color} />,
      }} />
      <Tabs.Screen name="reviews" options={{
        title: 'Reviews',
        tabBarIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color} />,
      }} />
      <Tabs.Screen name="photos" options={{
        title: 'Photos',
        tabBarIcon: ({ color, size }) => <Ionicons name="images" size={size} color={color} />,
      }} />
      <Tabs.Screen name="more" options={{
        title: 'More',
        tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal" size={size} color={color} />,
      }} />
      {/* Hidden screens accessible via navigation */}
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="manage-services" options={{ href: null }} />
      <Tabs.Screen name="appointments" options={{ href: null }} />
      <Tabs.Screen name="quotes-list" options={{ href: null }} />
      <Tabs.Screen name="job-photos" options={{ href: null }} />
      <Tabs.Screen name="credentials" options={{ href: null }} />
    </Tabs>
  )
}
