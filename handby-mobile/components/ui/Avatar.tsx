import { Image, View, Text, StyleSheet } from 'react-native'

interface AvatarProps {
  uri: string | null
  name: string
  size?: number
}

export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  if (uri) {
    return <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
  }

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: { backgroundColor: '#E2E8F0', borderWidth: 2, borderColor: '#DBEAFE' },
  fallback: { backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#DBEAFE' },
  initials: { color: '#475569', fontWeight: '700' },
})
