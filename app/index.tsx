import { View, Text, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as Device from "expo-device";
import { useEffect } from "react";

export default function BiometricsScreen() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert("Biometric not available", "Redirecting to Home...");
        router.replace("/home");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to continue",
      });

      if (result.success) {
        const deviceInfo = {
          brand: Device.brand,
          manufacturer: Device.manufacturer,
          modelName: Device.modelName,
          deviceName: Device.deviceName,
          osName: Device.osName,
          osVersion: Device.osVersion,
          osBuildId: Device.osBuildId,
          deviceType: Device.deviceType,
          totalMemory: Device.totalMemory,
          supportedCpuArchitectures: Device.supportedCpuArchitectures,
          deviceYearClass: Device.deviceYearClass,
          isDevice: Device.isDevice,
        };

        try {
          await AsyncStorage.setItem("deviceInfo", JSON.stringify(deviceInfo));
          console.log("Device info saved");
        } catch (error) {
          console.error("Failed to save device info:", error);
        }

        router.replace("/(tabs)");
      } else {
        Alert.alert("Authentication failed", "Try again or close app.");
      }
    })();
  });

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Authenticating...</Text>
      <ActivityIndicator size="large" />
    </View>
  );
}
