import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { API_BASE_URL } from "../constants/Config";

function AdminUsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadUsers();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUsers = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUsers(data.data.users);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const navigateToUserDetails = (user: any) => {
    router.push({
      pathname: "/admin-user-details",
      params: { userId: user._id, userName: user.username },
    });
  };

  const goBack = () => {
    router.back();
  };

  const getInitials = (username: string) => {
    return username ? username.substring(0, 2).toUpperCase() : "U";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const exportToExcel = async () => {
    try {
      setExporting(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/export-users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert("Error", errorData.message || "Failed to export data");
        setExporting(false);
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const fileName = `users_export_${Date.now()}.xlsx`;
      const file = new FileSystem.File(FileSystem.Paths.cache, fileName);

      await file.write(new Uint8Array(arrayBuffer));

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export Users Data",
        });
        Alert.alert("Success", "File exported successfully");
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error: any) {
      Alert.alert("Error", `Failed to export: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3e50" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#2c3e50", "#3498db", "#5dade2"]}
        style={styles.headerGradient}
      >
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>{users.length} total users</Text>
        </Animated.View>
      </LinearGradient>

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.exportButton}
          onPress={exportToExcel}
          disabled={exporting || users.length === 0}
        >
          <LinearGradient
            colors={["#27ae60", "#2ecc71"]}
            style={styles.exportButtonGradient}
          >
            {exporting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.exportButtonText}>Export to Excel</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {users.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#bdc3c7" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          ) : (
            users.map((user, index) => (
              <TouchableOpacity
                key={user._id}
                style={styles.userCard}
                onPress={() => navigateToUserDetails(user)}
                activeOpacity={0.7}
              >
                <View style={styles.userCardContent}>
                  <View style={styles.userAvatar}>
                    {user.profileImage ? (
                      <Image source={{ uri: user.profileImage }} style={styles.userAvatarImage} />
                    ) : (
                      <Text style={styles.userInitials}>
                        {getInitials(user.username)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.username}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userJoinDate}>
                      Joined: {formatDate(user.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.userActions}>
                    <View style={styles.roleTag}>
                      <Text style={styles.roleText}>{user.role}</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#bdc3c7"
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecf0f1",
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 0,
    padding: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    marginTop: -10,
  },
  exportButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  exportButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    color: "#7f8c8d",
    marginTop: 16,
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
  },
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInitials: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  userJoinDate: {
    fontSize: 12,
    color: "#95a5a6",
  },
  userActions: {
    alignItems: "center",
  },
  roleTag: {
    backgroundColor: "#e8f5e8",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 10,
    color: "#27ae60",
    fontWeight: "600",
    textTransform: "uppercase",
  },
});

export default AdminUsersScreen;
