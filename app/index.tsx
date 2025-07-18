import { View, Text, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as Device from "expo-device";
import { useEffect } from "react";

const API_BASE_URL = "http://192.168.10.9:5000/api";

export default function BiometricsScreen() {
  const router = useRouter();

  const checkUserRoleAndNavigate = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        // Navigate based on user role
        if (user.role === "admin") {
          router.replace("/admin-home");
          return;
        }
      }
      // Default navigation for regular users
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error checking user role:", error);
      router.replace("/(tabs)");
    }
  };

  useEffect(() => {
    (async () => {
      // const hasHardware = await LocalAuthentication.hasHardwareAsync();
      // const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      // if (!hasHardware || !isEnrolled) {
      //   Alert.alert("Biometric not available", "Redirecting to Home...");
      //   router.replace("/(tabs)");
      //   return;
      // }

      // const result = await LocalAuthentication.authenticateAsync({
      //   promptMessage: "Authenticate to continue",
      // });

      // if (result.success) {
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

        const response = await fetch(API_BASE_URL + "/saveDeviceInfo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deviceInfo),
        });

        if (!response.ok) {
          console.error("Failed to save device info on backend");
        }
      } catch (error) {
        console.error("Error saving device info:", error);
      }

      checkUserRoleAndNavigate();
      // } else {
      //   Alert.alert("Authentication failed", "Try again or close app.");
      //   checkUserRoleAndNavigate();
      // }
    })();
  });

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Loading...</Text>
      <ActivityIndicator size="large" />
    </View>
  );
}
