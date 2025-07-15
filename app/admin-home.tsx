import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function AdminHomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadUserData();
    loadUserStats();

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

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        if (parsedUser.role !== "admin") {
          Alert.alert("Access Denied", "You don't have admin privileges");
          router.replace("/");
          return;
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const response = await fetch("http://192.168.10.9:5000/api/admin/stats", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUserStats(data.data);
      } else {
        console.error("Failed to fetch user stats:", data.message);
      }
    } catch (error) {
      console.error("Error loading user stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const adminActions = [
    {
      title: "User Management",
      description: "Manage all users and their roles",
      icon: "people-outline",
      color: "#3498db",
      onPress: () => router.push("/admin-users"),
    },
    {
      title: "Attendance Reports",
      description: "View and export attendance reports",
      icon: "document-text-outline",
      color: "#2ecc71",
      onPress: () => Alert.alert("Coming Soon", "Attendance reports feature"),
    },
    {
      title: "System Settings",
      description: "Configure system parameters",
      icon: "settings-outline",
      color: "#f39c12",
      onPress: () => Alert.alert("Coming Soon", "System settings feature"),
    },
    {
      title: "Analytics",
      description: "View system analytics and insights",
      icon: "analytics-outline",
      color: "#9b59b6",
      onPress: () => Alert.alert("Coming Soon", "Analytics feature"),
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/admin-profile")}
          >
            <Ionicons name="person-circle-outline" size={32} color="#fff" />
          </TouchableOpacity>

          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={24} color="#fff" />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>

          <Text style={styles.welcomeText}>Welcome Admin</Text>
          <Text style={styles.userNameText}>
            {user?.username || "Administrator"}
          </Text>
          <Text style={styles.subtitleText}>
            Manage your organization with ease
          </Text>
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
        <Text style={styles.sectionTitle}>Admin Dashboard</Text>

        <View style={styles.actionsGrid}>
          {adminActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={action.onPress}
            >
              <View
                style={[styles.actionIcon, { backgroundColor: action.color }]}
              >
                <Ionicons name={action.icon as any} size={28} color="#fff" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDescription}>
                  {action.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={32} color="#3498db" />
              <Text style={styles.statNumber}>
                {statsLoading ? "..." : userStats?.totalUsers || "0"}
              </Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="shield" size={32} color="#2ecc71" />
              <Text style={styles.statNumber}>
                {statsLoading ? "..." : userStats?.totalAdmins || "0"}
              </Text>
              <Text style={styles.statLabel}>Total Admins</Text>
            </View>
          </View>

          {!statsLoading &&
            userStats?.recentUsers &&
            userStats.recentUsers.length > 0 && (
              <View style={styles.recentUsersContainer}>
                <Text style={styles.sectionTitle}>Recent Users</Text>
                {userStats.recentUsers
                  .slice(0, 3)
                  .map((recentUser: any, index: number) => (
                    <View key={index} style={styles.recentUserCard}>
                      <View style={styles.recentUserIcon}>
                        <Ionicons name="person" size={20} color="#3498db" />
                      </View>
                      <View style={styles.recentUserInfo}>
                        <Text style={styles.recentUserName}>
                          {recentUser.username}
                        </Text>
                        <Text style={styles.recentUserEmail}>
                          {recentUser.email}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}
        </View>
      </Animated.View>
    </ScrollView>
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
    fontSize: 18,
    color: "#2c3e50",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  profileButton: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 8,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  userNameText: {
    fontSize: 20,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  contentContainer: {
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 20,
  },
  actionsGrid: {
    marginBottom: 30,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  statsContainer: {
    marginTop: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: (width - 60) / 2,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
  },
  recentUsersContainer: {
    marginTop: 30,
  },
  recentUserCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recentUserIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ecf0f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recentUserInfo: {
    flex: 1,
  },
  recentUserName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 2,
  },
  recentUserEmail: {
    fontSize: 14,
    color: "#7f8c8d",
  },
});
