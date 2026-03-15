import { View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Button } from '../../components/ui/Button'
import { WelcomeVideo } from '../../components/welcome/WelcomeVideo'
import { OnboardingCards } from '../../components/welcome/OnboardingCards'

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Video hero */}
      <WelcomeVideo />

      {/* Onboarding cards */}
      <View style={styles.cardsSection}>
        <OnboardingCards />
      </View>

      {/* CTA buttons */}
      <SafeAreaView style={styles.buttons}>
        <Button
          title="Get Started"
          onPress={() => router.push('/(auth)/signup')}
        />
        <Button
          title="I already have an account"
          variant="ghost"
          onPress={() => router.push('/(auth)/login')}
          style={{ marginTop: 6 }}
        />
        <Text style={styles.legal}>
          By continuing you agree to our Terms & Privacy Policy
        </Text>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
cardsSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttons: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  legal: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
  },
})
