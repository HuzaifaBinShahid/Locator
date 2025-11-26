import * as Device from "expo-device";
import { Platform } from "react-native";

const getApiBaseUrl = (): string => {
  if (Platform.OS === "android" && !Device.isDevice) {
    return "http://10.0.2.2:5000/api";
  }

  if (Platform.OS === "ios" && !Device.isDevice) {
    return "http://localhost:5000/api";
  }

  return "http://192.168.18.9:5000/api";
};

export const API_BASE_URL = getApiBaseUrl();
