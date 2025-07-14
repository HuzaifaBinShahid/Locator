import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Animated,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const router = useRouter();

  useEffect(() => {
    loadUserData();
    loadDeviceInfo();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const savedImage = await AsyncStorage.getItem("profileImage");

      if (userData) {
        setUser(JSON.parse(userData));
      }

      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceInfo = async () => {
    try {
      const savedDeviceInfo = await AsyncStorage.getItem("deviceInfo");
      if (savedDeviceInfo) {
        setDeviceInfo(JSON.parse(savedDeviceInfo));
      } else {
        const currentDeviceInfo = {
          deviceName: Device.deviceName || "Unknown Device",
          brand: Device.brand || "Unknown",
          modelName: Device.modelName || "Unknown Model",
          osName: Device.osName || "Unknown OS",
          osVersion: Device.osVersion || "Unknown Version",
        };
        setDeviceInfo(currentDeviceInfo);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load device info");
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need camera roll permissions to change your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageLoading(true);
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await AsyncStorage.setItem("profileImage", imageUri);
        setImageLoading(false);
      }
    } catch (error) {
      setImageLoading(false);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need camera permissions to take your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageLoading(true);
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await AsyncStorage.setItem("profileImage", imageUri);
        setImageLoading(false);
      }
    } catch (error) {
      setImageLoading(false);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Change Profile Picture",
      "Choose an option",
      [
        { text: "Camera", onPress: takePhoto },
        { text: "Photo Library", onPress: pickImage },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const logout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(["token", "user", "profileImage"]);
            router.replace("/auth");
          } catch (error) {
            console.error("Error during logout:", error);
            router.replace("/auth");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.headerGradient}
      >
        <Animated.View
          style={[
            styles.profileSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={showImageOptions}
            style={styles.avatarContainer}
          >
            {imageLoading ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="large" color="#667eea" />
              </View>
            ) : profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={60} color="#667eea" />
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user?.username || "User"}</Text>
          <Text style={styles.userEmail}>{user?.email || "No email"}</Text>
        </Animated.View>
      </LinearGradient>

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(fadeAnim, -20) }],
          },
        ]}
      >
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={24} color="#667eea" />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>
              {user?.username || "Not available"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>
              {user?.email || "Not available"}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="phone-portrait-outline" size={24} color="#667eea" />
            <Text style={styles.cardTitle}>Device Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Device Name</Text>
            <Text style={styles.infoValue}>
              {deviceInfo?.deviceName || "Unknown"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Brand</Text>
            <Text style={styles.infoValue}>
              {deviceInfo?.brand || "Unknown"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Model</Text>
            <Text style={styles.infoValue}>
              {deviceInfo?.modelName || "Unknown"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>OS</Text>
            <Text style={styles.infoValue}>
              {deviceInfo?.osName || "Unknown"} {deviceInfo?.osVersion || ""}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LinearGradient
            colors={["#FF6B6B", "#FF8E53"]}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#667eea",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  contentContainer: {
    padding: 20,
    marginTop: -20,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  infoLabel: {
    fontSize: 16,
    color: "#7f8c8d",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  logoutButton: {
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 12,
    overflow: "hidden",
  },
  logoutGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  logoutText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
});
