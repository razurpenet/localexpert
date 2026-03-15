import { View, StyleSheet, useWindowDimensions } from 'react-native'

export function WelcomeVideo() {
  const { width, height } = useWindowDimensions()
  const videoHeight = height * 0.42

  return (
    <View style={[styles.container, { width, height: videoHeight }]}>
      <video
        src="/handby-welcome.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: '#0F172A',
  },
})
