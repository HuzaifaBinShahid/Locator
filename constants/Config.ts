import * as Device from "expo-device";
import { Platform } from "react-native";

// Get the API base URL based on the environment
// For Android emulator, use 10.0.2.2 (special IP to access host machine)
// For physical devices, use your computer's local IP address
// For iOS simulator, use localhost
const getApiBaseUrl = (): string => {
  // Check if running on Android emulator
  if (Platform.OS === "android" && !Device.isDevice) {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    return "http://10.0.2.2:5000/api";
  }

  // For iOS simulator, use localhost
  if (Platform.OS === "ios" && !Device.isDevice) {
    return "http://localhost:5000/api";
  }

  // For physical devices, use your computer's local network IP
  // Update this IP address to match your current network IP
  // You can find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
  return "http://192.168.18.183:5000/api";
};

export const API_BASE_URL = getApiBaseUrl();

