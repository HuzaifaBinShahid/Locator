import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from "expo-local-authentication";
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
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../../constants/Config";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const router = useRouter();

  useEffect(() => {
    loadUserData();
    loadDeviceInfo();
    checkBiometricAvailability();
    loadBiometricStatus();

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
        allowsMultipleSelection: false,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const base64Image = result.assets[0].base64;
        
        if (!base64Image) {
          setToastMessage("Failed to process image");
          setTimeout(() => setToastMessage(null), 3000);
          return;
        }

        const base64Size = (base64Image.length * 3) / 4;
        const maxSize = 3 * 1024 * 1024;

        if (base64Size > maxSize) {
          setToastMessage("Image is too large. Maximum size is 3MB");
          setTimeout(() => setToastMessage(null), 3000);
          return;
        }

        setImageLoading(true);
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setImageLoading(false);
          setToastMessage("Authentication required");
          setTimeout(() => setToastMessage(null), 3000);
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/upload-profile-image`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ profileImage: `data:image/jpeg;base64,${base64Image}` }),
          });

          const data = await response.json();

          if (response.ok && data.profileImage) {
            setProfileImage(data.profileImage);
            const userData = await AsyncStorage.getItem("user");
            if (userData) {
              const user = JSON.parse(userData);
              user.profileImage = data.profileImage;
              await AsyncStorage.setItem("user", JSON.stringify(user));
            }
            setToastMessage("Profile picture updated successfully");
            setTimeout(() => setToastMessage(null), 3000);
          } else {
            setToastMessage(data.message || "Failed to upload image");
            setTimeout(() => setToastMessage(null), 3000);
          }
        } catch (error: any) {
          setToastMessage("Failed to upload image to server");
          setTimeout(() => setToastMessage(null), 3000);
        } finally {
          setImageLoading(false);
        }
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
        allowsMultipleSelection: false,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const base64Image = result.assets[0].base64;
        
        if (!base64Image) {
          setToastMessage("Failed to process image");
          setTimeout(() => setToastMessage(null), 3000);
          return;
        }

        const base64Size = (base64Image.length * 3) / 4;
        const maxSize = 3 * 1024 * 1024;

        if (base64Size > maxSize) {
          setToastMessage("Image is too large. Maximum size is 3MB");
          setTimeout(() => setToastMessage(null), 3000);
          return;
        }

        setImageLoading(true);
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setImageLoading(false);
          setToastMessage("Authentication required");
          setTimeout(() => setToastMessage(null), 3000);
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/upload-profile-image`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ profileImage: `data:image/jpeg;base64,${base64Image}` }),
          });

          const data = await response.json();

          if (response.ok && data.profileImage) {
            setProfileImage(data.profileImage);
            const userData = await AsyncStorage.getItem("user");
            if (userData) {
              const user = JSON.parse(userData);
              user.profileImage = data.profileImage;
              await AsyncStorage.setItem("user", JSON.stringify(user));
            }
            setToastMessage("Profile picture updated successfully");
            setTimeout(() => setToastMessage(null), 3000);
          } else {
            setToastMessage(data.message || "Failed to upload image");
            setTimeout(() => setToastMessage(null), 3000);
          }
        } catch (error: any) {
          setToastMessage("Failed to upload image to server");
          setTimeout(() => setToastMessage(null), 3000);
        } finally {
          setImageLoading(false);
        }
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

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      setBiometricAvailable(false);
    }
  };

  const loadBiometricStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/auth/biometric-status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBiometricEnabled(data.biometricEnabled || false);
      }
    } catch (error) {
      console.error("Error loading biometric status:", error);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          Alert.alert("Biometric Not Available", "Biometric authentication is not available on this device.");
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to enable biometric login",
        });

        if (!result.success) {
          return;
        }
      } catch (error) {
        Alert.alert("Error", "Failed to authenticate");
        return;
      }
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/biometric-status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ biometricEnabled: value }),
      });

      if (response.ok) {
        const data = await response.json();
        setBiometricEnabled(data.biometricEnabled);
        
        if (value) {
          const userData = await AsyncStorage.getItem("user");
          if (userData) {
            const currentUser = JSON.parse(userData);
            await AsyncStorage.setItem("biometricEmail", currentUser.email);
            await AsyncStorage.setItem("biometricUserId", currentUser.id);
          }
        } else {
          await AsyncStorage.removeItem("biometricEmail");
          await AsyncStorage.removeItem("biometricUserId");
        }
        
        Alert.alert("Success", value ? "Biometric login enabled" : "Biometric login disabled");
      } else {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        Alert.alert("Error", errorData.message || `Failed to update biometric settings (${response.status})`);
      }
    } catch (error: any) {
      Alert.alert("Error", `Failed to update biometric settings: ${error.message || "Network error"}`);
    }
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
        <ActivityIndicator size="large" color="#005b96" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={["#011f4b", "#005b96", "#6497b1"]}
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
          {/* Header content space */}
        </Animated.View>
      </LinearGradient>

      {/* Avatar positioned to overlap blue and white sections */}
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
              <ActivityIndicator size="large" color="#4CAF50" />
            </View>
          ) : profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color="#005b96" />
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
            <Ionicons name="person-circle-outline" size={24} color="#005b96" />
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

        {biometricAvailable && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="finger-print-outline" size={24} color="#005b96" />
              <Text style={styles.cardTitle}>Biometric Authentication</Text>
            </View>
            <View style={styles.biometricRow}>
              <View style={styles.biometricInfo}>
                <Text style={styles.infoLabel}>Enable Biometric Login</Text>
                <Text style={styles.biometricSubtext}>
                  Use fingerprint recognition to login
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: "#ccc", true: "#4CAF50" }}
                thumbColor={biometricEnabled ? "#fff" : "#f4f3f4"}
              />
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LinearGradient
            colors={["#D92D20", "#D92D20"]}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecf0f1",
  },
  scrollContainer: {
    flex: 1,
  },
  toastContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "#d32f2f",
    padding: 16,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#b3cde0",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#03396c",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 80, // Increased to create space for overlapping avatar
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: "center",
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
    backgroundColor: "#005b96",
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
  overlappingAvatarContainer: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  contentContainer: {
    padding: 20,
    marginTop: 40,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginTop: 50,
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
    color: "#011f4b",
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
    color: "#03396c",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#011f4b",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
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
  biometricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  biometricInfo: {
    flex: 1,
    marginRight: 16,
  },
  biometricSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
});
