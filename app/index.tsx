import { View, Text, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import * as Device from "expo-device";
import { useEffect } from "react";
import { API_BASE_URL } from "../constants/Config";

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

        // Get the authentication token
        const token = await AsyncStorage.getItem("token");
        
        if (token) {
          const response = await fetch(API_BASE_URL + "/saveDeviceInfo", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(deviceInfo),
          });

          if (response.ok) {
            // Device info was successfully saved or updated
            // Silently handle - this is expected behavior, no need to log
            const data = await response.json();
            // Only log in development for debugging
            if (__DEV__) {
              console.log("Device info:", data.message);
            }
          } else {
            // Only log error if response is not ok (actual error occurred)
            try {
              const errorData = await response.json();
              console.error("Failed to save device info:", errorData.message || "Unknown error");
            } catch (e) {
              console.error("Failed to save device info: HTTP", response.status);
            }
          }
        } else {
          // No token means user is not logged in yet, which is fine
          // Device info will be saved after login
          console.log("No token found, device info will be saved after authentication");
        }
      } catch (error) {
        // Only log network/connection errors, not expected update scenarios
        console.error("Network error saving device info:", error);
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
