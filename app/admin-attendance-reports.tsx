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

function AdminAttendanceReportsScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadAttendanceReports();

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

  const loadAttendanceReports = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/attendance-reports`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setRecords(data.data.records);
        setSummary(data.data.summary);
      } else {
        Alert.alert(
          "Error",
          data.message || "Failed to fetch attendance reports"
        );
      }
    } catch (error) {
      console.error("Error loading attendance reports:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendanceReports();
  };

  const exportAttendance = async () => {
    try {
      setExporting(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/export-attendance`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert("Error", errorData.message || "Failed to export data");
        setExporting(false);
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const fileName = `attendance_export_${Date.now()}.xlsx`;
      const file = new FileSystem.File(FileSystem.Paths.cache, fileName);

      await file.write(new Uint8Array(arrayBuffer));

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export Attendance Data",
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
    if (!record.checkoutTime) return "#f39c12";
    return "#27ae60";
  };

  const getStatusText = (record: any) => {
    if (!record.checkoutTime) return "Active";
    return "Completed";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c3e50" />
        <Text style={styles.loadingText}>Loading attendance reports...</Text>
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

          <Text style={styles.headerTitle}>Attendance Reports</Text>
          <Text style={styles.headerSubtitle}>
            {summary?.totalRecords || 0} total records
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
        {/* Summary Stats */}
        {summary && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Ionicons name="calendar-outline" size={20} color="#3498db" />
              <Text style={styles.summaryNumber}>{summary.totalRecords}</Text>
              <Text style={styles.summaryLabel}>Records</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="time-outline" size={20} color="#27ae60" />
              <Text style={styles.summaryNumber}>{summary.totalHours}h</Text>
              <Text style={styles.summaryLabel}>Total Hours</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="pulse-outline" size={20} color="#f39c12" />
              <Text style={styles.summaryNumber}>{summary.activeCount}</Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
          </View>
        )}

        {/* Export Button */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={exportAttendance}
          disabled={exporting || records.length === 0}
        >
          <LinearGradient
            colors={["#27ae60", "#2ecc71"]}
            style={styles.exportButtonGradient}
          >
            {exporting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.exportButtonText}>
                  Export Attendance to Excel
                </Text>
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
          {records.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#bdc3c7" />
              <Text style={styles.emptyText}>No attendance records found</Text>
            </View>
          ) : (
            records.map((record: any) => (
              <View key={record._id} style={styles.attendanceCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.userSection}>
                    <View style={styles.userAvatar}>
                      {record.userId?.profileImage ? (
                        <Image
                          source={{ uri: record.userId.profileImage }}
                          style={styles.userAvatarImage}
                        />
                      ) : (
                        <Text style={styles.userInitials}>
                          {getInitials(record.userId?.username || "")}
                        </Text>
                      )}
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>
                        {record.userId?.username || "Unknown"}
                      </Text>
                      <Text style={styles.userEmail}>
                        {record.userId?.email || ""}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.dateStatusSection}>
                    <Text style={styles.recordDate}>
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
                </View>

                <View style={styles.timeRow}>
                  <View style={styles.timeBlock}>
                    <Ionicons
                      name="log-in-outline"
                      size={14}
                      color="#27ae60"
                    />
                    <Text style={styles.timeLabel}> In: </Text>
                    <Text style={styles.timeValue}>
                      {formatTime(record.checkinTime)}
                    </Text>
                  </View>
                  <View style={styles.timeBlock}>
                    <Ionicons
                      name="log-out-outline"
                      size={14}
                      color="#e74c3c"
                    />
                    <Text style={styles.timeLabel}> Out: </Text>
                    <Text style={styles.timeValue}>
                      {record.checkoutTime
                        ? formatTime(record.checkoutTime)
                        : "Active"}
                    </Text>
                  </View>
                  {record.totalHours > 0 && (
                    <View style={styles.timeBlock}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color="#3498db"
                      />
                      <Text style={styles.hoursValue}>
                        {" "}
                        {formatDuration(record.totalHours)}
                      </Text>
                    </View>
                  )}
                </View>

                {record.checkinLocation?.address && (
                  <Text style={styles.locationText} numberOfLines={1}>
                    <Ionicons name="location-outline" size={12} color="#95a5a6" />{" "}
                    {record.checkinLocation.address}
                  </Text>
                )}
              </View>
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
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#7f8c8d",
    marginTop: 2,
  },
  exportButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
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
  attendanceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  userAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userInitials: {
    fontSize: 14,
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
  },
  userEmail: {
    fontSize: 11,
    color: "#7f8c8d",
  },
  dateStatusSection: {
    alignItems: "flex-end",
  },
  recordDate: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  timeBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  timeValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2c3e50",
  },
  hoursValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3498db",
  },
  locationText: {
    fontSize: 11,
    color: "#95a5a6",
    marginTop: 4,
  },
});

export default AdminAttendanceReportsScreen;
