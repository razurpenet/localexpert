import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function CustomerLayout() {
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
      <Tabs.Screen name="search" options={{
        title: 'Search',
        tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
      }} />
      <Tabs.Screen name="bookings" options={{
        title: 'Bookings',
        tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
      }} />
      {/* Hidden screens accessible via navigation */}
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="favourites" options={{ href: null }} />
    </Tabs>
  )
}
