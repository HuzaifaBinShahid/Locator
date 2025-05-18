// app/biometrics.tsx
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export default function BiometricsScreen() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert('Biometric not available', 'Redirecting to Home...');
        router.replace('/(tabs)')

        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
      });

      if (result.success) {
        router.replace('/(tabs)')

      } else {
        Alert.alert('Authentication failed', 'Try again or close app.');
      }
    })();
  }, );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Authenticating...</Text>
      <ActivityIndicator size="large" />
    </View>
  );
}
