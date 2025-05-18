import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DeviceInfoScreen() {
  const [deviceInfo, setDeviceInfo] = useState<Record<string, any> | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDeviceInfo = async () => {
      try {
        const storedInfo = await AsyncStorage.getItem("deviceInfo");
        if (storedInfo) {
          setDeviceInfo(JSON.parse(storedInfo));
        }
      } catch (error) {
        console.error("Error loading device info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeviceInfo();
  }, []);

  const getCategoryIcon = (key: string) => {
    const iconMap: Record<string, { name: string; color: string }> = {
      brand: { name: "business", color: "#3498db" },
      manufacturer: { name: "build", color: "#3498db" },
      model: { name: "phone-portrait", color: "#3498db" },
      os: { name: "logo-android", color: "#2ecc71" },
      battery: { name: "battery-full", color: "#f39c12" },
      network: { name: "wifi", color: "#9b59b6" },
      app: { name: "apps", color: "#e74c3c" },
      device: { name: "hardware-chip", color: "#1abc9c" },
    };

    if (key.includes("os")) return iconMap.os;
    if (key.includes("battery")) return iconMap.battery;
    if (
      key.includes("network") ||
      key.includes("wifi") ||
      key.includes("cellular")
    )
      return iconMap.network;
    if (key.includes("app")) return iconMap.app;
    if (
      key.includes("model") ||
      key.includes("device") ||
      key.includes("product")
    )
      return iconMap.model;
    if (key.includes("manufacturer") || key.includes("brand"))
      return iconMap.manufacturer;

    return iconMap.device;
  };

  const renderDeviceInfo = () => {
    if (!deviceInfo) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#888" />
          <Text style={styles.emptyText}>No device information available</Text>
        </View>
      );
    }

    const infoEntries = Object.entries(deviceInfo);

    const categories = {
      Device: [
        "brand",
        "manufacturer",
        "modelName",
        "deviceName",
        "deviceType",
        "isDevice",
      ],
      System: ["osName", "osVersion", "osBuildId"],
      Hardware: ["deviceYearClass", "totalMemory", "supportedCpuArchitectures"],
      Network: ["networkType", "isConnected", "isWifi", "isCellular"],
      Power: ["batteryLevel"],
      App: ["appVersion", "appBuildVersion"],
    };

    return (
      <ScrollView style={styles.scrollView}>
        {Object.entries(categories).map(([category, keys]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>

            {keys.map((key) => {
              const entry = infoEntries.find(([k]) => k === key);
              if (!entry) return null;

              const [k, v] = entry;
              const { name, color } = getCategoryIcon(k);

              return (
                <View key={k} style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={name as any} size={20} color={color} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{k}</Text>
                    <Text style={styles.infoValue}>
                      {typeof v === "object" ? JSON.stringify(v) : String(v)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="phone-portrait-outline" size={24} color="#333" />
        <Text style={styles.headerTitle}>Device Information</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading device information...</Text>
        </View>
      ) : (
        renderDeviceInfo()
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
    color: "#333",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  categorySection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  iconContainer: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
});
