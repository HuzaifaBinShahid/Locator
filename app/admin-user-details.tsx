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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../constants/Config";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

function AdminUserDetailsScreen() {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadUserDetails();

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

  const loadUserDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/users/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const responseText = await response.text();
      
      if (!response.ok) {
        console.error("HTTP Error:", response.status, responseText);
        Alert.alert("Error", `HTTP ${response.status}: ${responseText.substring(0, 100)}`);
        return;
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Response text:", responseText);
        Alert.alert("Error", "Invalid response format from server");
        return;
      }

      if (data.success) {
        setUserDetails(data.data);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch user details");
      }
    } catch (error) {
      console.error("Error loading user details:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserDetails();
  };

  const goBack = () => {
    router.back();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (wholeHours === 0) {
      return `${minutes}m`;
    }
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
  };

  const getInitials = (username: string) => {
    return username ? username.substring(0, 2).toUpperCase() : "U";
  };

  const getStatusColor = (record: any) => {
    if (!record.checkoutTime) return "#f39c12"; // Orange for active
    return "#27ae60"; // Green for completed
  };

  const getStatusText = (record: any) => {
    if (!record.checkoutTime) return "Active";
    return "Completed";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3e50" />
        <Text style={styles.loadingText}>Loading user details...</Text>
      </View>
    );
  }

  if (!userDetails) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-remove-outline" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity style={styles.backButtonError} onPress={goBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { user, attendanceHistory, statistics } = userDetails;

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

          <View style={styles.userHeaderInfo}>
            <View style={styles.userAvatarLarge}>
              <Text style={styles.userInitialsLarge}>
                {getInitials(user.username)}
              </Text>
            </View>
            <Text style={styles.userNameHeader}>{user.username}</Text>
            <Text style={styles.userEmailHeader}>{user.email}</Text>
          </View>
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Statistics Section */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Statistics (Last 30 Days)</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="time-outline" size={24} color="#3498db" />
                <Text style={styles.statNumber}>
                  {statistics.totalHoursLast30Days}h
                </Text>
                <Text style={styles.statLabel}>Total Hours</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="calendar-outline" size={24} color="#27ae60" />
                <Text style={styles.statNumber}>
                  {statistics.attendanceDaysLast30Days}
                </Text>
                <Text style={styles.statLabel}>Days Worked</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="today-outline" size={24} color="#9b59b6" />
                <Text style={styles.statNumber}>
                  {statistics.currentMonthAttendance}
                </Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>
            </View>
          </View>

          {/* Attendance History Section */}
          <View style={styles.attendanceContainer}>
            <Text style={styles.sectionTitle}>
              Attendance History ({attendanceHistory.length} records)
            </Text>

            {attendanceHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#bdc3c7" />
                <Text style={styles.emptyText}>
                  No attendance records found
                </Text>
              </View>
            ) : (
              attendanceHistory.map((record: any, index: number) => (
                <View key={record._id} style={styles.attendanceCard}>
                  <View style={styles.attendanceHeader}>
                    <View style={styles.dateSection}>
                      <Text style={styles.attendanceDate}>
                        {formatDate(record.date)}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(record) },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {getStatusText(record)}
                        </Text>
                      </View>
                    </View>
                    {record.totalHours > 0 && (
                      <Text style={styles.totalHours}>
                        {formatDuration(record.totalHours)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.timeSection}>
                    {/* Check-in Info */}
                    <View style={styles.timeEntry}>
                      <View style={styles.timeIcon}>
                        <Ionicons
                          name="log-in-outline"
                          size={16}
                          color="#27ae60"
                        />
                      </View>
                      <View style={styles.timeDetails}>
                        <Text style={styles.timeLabel}>Check-in</Text>
                        <Text style={styles.timeValue}>
                          {formatTime(record.checkinTime)}
                        </Text>
                        <Text style={styles.locationText}>
                          📍 {record.checkinLocation.address}
                        </Text>
                      </View>
                    </View>

                    {/* Check-out Info */}
                    {record.checkoutTime ? (
                      <View style={styles.timeEntry}>
                        <View style={styles.timeIcon}>
                          <Ionicons
                            name="log-out-outline"
                            size={16}
                            color="#e74c3c"
                          />
                        </View>
                        <View style={styles.timeDetails}>
                          <Text style={styles.timeLabel}>Check-out</Text>
                          <Text style={styles.timeValue}>
                            {formatTime(record.checkoutTime)}
                          </Text>
                          <Text style={styles.locationText}>
                            📍{" "}
                            {record.checkoutLocation?.address || "No location"}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.timeEntry}>
                        <View
                          style={[
                            styles.timeIcon,
                            { backgroundColor: "#f39c12" },
                          ]}
                        >
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color="#fff"
                          />
                        </View>
                        <View style={styles.timeDetails}>
                          <Text style={styles.timeLabel}>Check-out</Text>
                          <Text
                            style={[styles.timeValue, { color: "#f39c12" }]}
                          >
                            Still active
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
  },
  errorText: {
    fontSize: 18,
    color: "#e74c3c",
    marginTop: 16,
    marginBottom: 20,
  },
  backButtonError: {
    backgroundColor: "#3498db",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
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
  userHeaderInfo: {
    alignItems: "center",
    marginTop: 20,
  },
  userAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  userInitialsLarge: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  userNameHeader: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  userEmailHeader: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  statsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginVertical: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
  },
  attendanceContainer: {
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginTop: 12,
  },
  attendanceCard: {
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
  attendanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  attendanceDate: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  totalHours: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3498db",
  },
  timeSection: {
    gap: 16,
  },
  timeEntry: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ecf0f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  timeDetails: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#95a5a6",
    lineHeight: 16,
  },
});

export default AdminUserDetailsScreen;
