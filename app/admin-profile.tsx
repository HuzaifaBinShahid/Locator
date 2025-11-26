import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../constants/Config";

export default function AdminProfileScreen() {
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

      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        if (parsedUser.profileImage) {
          setProfileImage(parsedUser.profileImage);
        }

        if (parsedUser.role !== "admin") {
          Alert.alert("Access Denied", "You don't have admin privileges");
          router.replace("/");
          return;
        }
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
        mediaTypes: ["images"] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageLoading(true);
        const imageUri = result.assets[0].uri;
        const base64Image = result.assets[0].base64;
        
        if (base64Image) {
          const token = await AsyncStorage.getItem("token");
          if (token) {
            try {
              const response = await fetch(`${API_BASE_URL}/auth/upload-profile-image`, {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ profileImage: `data:image/jpeg;base64,${base64Image}` }),
              });

              if (response.ok) {
                const data = await response.json();
                setProfileImage(data.profileImage);
                const userData = await AsyncStorage.getItem("user");
                if (userData) {
                  const user = JSON.parse(userData);
                  user.profileImage = data.profileImage;
                  await AsyncStorage.setItem("user", JSON.stringify(user));
                }
              }
            } catch (error) {
              Alert.alert("Error", "Failed to upload image to server");
            }
          }
        }
        setImageLoading(false);
      }
    } catch (error) {
      setImageLoading(false);
      Alert.alert("Error", "Failed to update profile picture");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need camera permissions to take a photo."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageLoading(true);
        const imageUri = result.assets[0].uri;
        const base64Image = result.assets[0].base64;
        
        if (base64Image) {
          const token = await AsyncStorage.getItem("token");
          if (token) {
            try {
              const response = await fetch(`${API_BASE_URL}/auth/upload-profile-image`, {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ profileImage: `data:image/jpeg;base64,${base64Image}` }),
              });

              if (response.ok) {
                const data = await response.json();
                setProfileImage(data.profileImage);
                const userData = await AsyncStorage.getItem("user");
                if (userData) {
                  const user = JSON.parse(userData);
                  user.profileImage = data.profileImage;
                  await AsyncStorage.setItem("user", JSON.stringify(user));
                }
              }
            } catch (error) {
              Alert.alert("Error", "Failed to upload image to server");
            }
          }
        }
        setImageLoading(false);
      }
    } catch (error) {
      setImageLoading(false);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      "Update Profile Picture",
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
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(["token", "user", "profileImage"]);
            router.replace("/auth");
          } catch (error) {
            Alert.alert("Error", "Failed to logout");
          }
        },
      },
    ]);
  };

  const goBackToAdmin = () => {
    router.replace("/admin-home");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3e50" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={["#2c3e50", "#3498db", "#5dade2"]}
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
          <TouchableOpacity style={styles.backButton} onPress={goBackToAdmin}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Avatar positioned to overlap between blue and white sections */}
      <Animated.View
        style={[
          styles.overlappingAvatarContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={showImageOptions}
        >
          {imageLoading ? (
            <View style={styles.avatarPlaceholder}>
              <ActivityIndicator size="large" color="#2c3e50" />
            </View>
          ) : profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color="#2c3e50" />
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={24} color="#2c3e50" />
            <Text style={styles.cardTitle}>Admin Information</Text>
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

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <View style={styles.roleContainer}>
              <Ionicons name="shield-checkmark" size={16} color="#2c3e50" />
              <Text style={[styles.infoValue, styles.roleText]}>
                {user?.role?.toUpperCase() || "ADMIN"}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LinearGradient
            colors={["#D92D20", "#B91C1C"]}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#2c3e50",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 0,
    padding: 12,
    zIndex: 1,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 40,
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  overlappingAvatarContainer: {
    position: "absolute",
    top: 150,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
  },
  profileImage: {
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
    backgroundColor: "#2c3e50",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  contentContainer: {
    padding: 20,
    marginTop: 40,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
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
    color: "#34495e",
    fontWeight: "500",
    marginRight: 5,
  },
  infoValue: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  roleText: {
    marginLeft: 8,
    color: "#2c3e50",
    fontWeight: "bold",
  },
  userIdText: {
    fontSize: 12,
    color: "#7f8c8d",
    fontFamily: "monospace",
  },
  logoutButton: {
    marginHorizontal: "auto",
    marginVertical: 40,
    width: "80%",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
