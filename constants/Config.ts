import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

const PRODUCTION_API_URL = "https://locator-backend-g5v6.vercel.app/api";

const getDevHost = (): string | null => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost ||
    (Constants.manifest as any)?.debuggerHost;
  if (!hostUri) return null;
  return hostUri.split(":").shift() || null;
};

const getApiBaseUrl = (): string => {
  if (__DEV__) {
    if (Platform.OS === "android" && !Device.isDevice) {
      return "http://10.0.2.2:5000/api";
    }
    if (Platform.OS === "ios" && !Device.isDevice) {
      return "http://localhost:5000/api";
    }
    const host = getDevHost();
    if (host) return `http://${host}:5000/api`;
    return PRODUCTION_API_URL;
  }
  return PRODUCTION_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();
