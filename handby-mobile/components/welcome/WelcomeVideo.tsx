import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useEffect } from 'react'

const videoSource = require('../../assets/videos/handby-welcome.mp4')

export function WelcomeVideo() {
  const { width, height } = useWindowDimensions()
  const videoHeight = height * 0.42

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true
    p.muted = true
    p.play()
  })

  return (
    <View style={[styles.container, { width, height: videoHeight }]}>
      <VideoView
        player={player}
        style={{ width, height: videoHeight }}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
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
