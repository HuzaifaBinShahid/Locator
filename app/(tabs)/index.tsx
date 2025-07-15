import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.10.9:5000/api";

export default function TabHomeScreen() {
  const [attendance, setAttendance] = useState(null);
  const [canCheckin, setCanCheckin] = useState(false);
  const [canCheckout, setCanCheckout] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const timerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  useEffect(() => {
    if (canCheckout && attendance?.checkinTime) {
      const startTimer = () => {
        timerRef.current = setInterval(() => {
          const now = new Date();
          const checkinTime = new Date(attendance.checkinTime);
          const diff = now.getTime() - checkinTime.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          setElapsedTime(
            `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
          );
        }, 1000);
      };
      startTimer();
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [canCheckout, attendance]);

  useEffect(() => {
    if (canCheckout) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [canCheckout, pulseAnim]);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchTodayAttendance = async () => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(`${API_BASE_URL}/attendance/today`, {
        headers,
      });

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        Alert.alert("Error", "Server returned invalid response");
        return;
      }

      if (response.ok) {
        setAttendance(data.attendance);
        setCanCheckin(data.canCheckin);
        setCanCheckout(data.canCheckout);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch attendance");
      }
    } catch (error) {
      Alert.alert("Error", "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const getLocationAsync = async () => {
    setIsLoadingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please grant location permissions to use this feature",
          [{ text: "OK" }]
        );
        setIsLoadingLocation(false);
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation);

      const geocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (geocode.length > 0) {
        const loc = geocode[0];
        const addressComponents = [
          loc.name,
          loc.street,
          loc.district,
          loc.city,
          loc.region,
          loc.postalCode,
          loc.country,
        ].filter(Boolean);

        const addressStr = addressComponents.join(", ");
        setAddress(addressStr);
        return {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          address: addressStr,
        };
      }

      return null;
    } catch (error) {
      Alert.alert("Error", "Failed to get your location");
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleCheckIn = async () => {
    const locationData = await getLocationAsync();
    if (!locationData) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/attendance/checkin`, {
        method: "POST",
        headers,
        body: JSON.stringify(locationData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Checked in successfully!");
        fetchTodayAttendance();
      } else {
        Alert.alert("Error", data.message || "Check-in failed");
      }
    } catch (error) {
      Alert.alert("Error", "Network error");
    }
  };

  const handleCheckOut = async () => {
    const locationData = await getLocationAsync();
    if (!locationData) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/attendance/checkout`, {
        method: "POST",
        headers,
        body: JSON.stringify(locationData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Success",
          `Checked out successfully! Total hours: ${data.totalHours}h`
        );
        fetchTodayAttendance();
      } else {
        Alert.alert("Error", data.message || "Check-out failed");
      }
    } catch (error) {
      Alert.alert("Error", "Network error");
    }
  };

  const formatTimeDisplay = (dateString) => {
    if (!dateString) return "--:--";
    return format(new Date(dateString), "hh:mm a");
  };

  const formatDateDisplay = (date) => {
    if (!date) return "--/--/----";
    return format(date, "EEE, MMM dd, yyyy");
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{formatDateDisplay(new Date())}</Text>

      <Animated.View
        style={[
          styles.timeCard,
          { transform: [{ scale: canCheckout ? pulseAnim : 1 }] },
        ]}
      >
        <LinearGradient
          colors={canCheckout ? ["#4CAF50", "#2E7D32"] : ["#3498db", "#2980b9"]}
          style={styles.timeCardGradient}
        >
          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>Check-in</Text>
              <Text style={styles.timeValue}>
                {attendance?.checkinTime
                  ? formatTimeDisplay(attendance.checkinTime)
                  : "--:--"}
              </Text>
            </View>

            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>Check-out</Text>
              <Text style={styles.timeValue}>
                {attendance?.checkoutTime
                  ? formatTimeDisplay(attendance.checkoutTime)
                  : "--:--"}
              </Text>
            </View>
          </View>

          {canCheckout && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>Elapsed Time</Text>
              <Text style={styles.timerValue}>{elapsedTime}</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      {location && address && (
        <View style={styles.locationContainer}>
          <View style={styles.locationHeader}>
            <Ionicons name="location" size={18} color="#555" />
            <Text style={styles.locationTitle}>Current Location</Text>
          </View>
          <Text style={styles.locationText} numberOfLines={2}>
            {address}
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {canCheckin ? (
          <TouchableOpacity
            style={[styles.button, styles.checkinButton]}
            onPress={handleCheckIn}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="login" size={24} color="#fff" />
                <Text style={styles.buttonText}>Check In</Text>
              </>
            )}
          </TouchableOpacity>
        ) : canCheckout ? (
          <TouchableOpacity
            style={[styles.button, styles.checkoutButton]}
            onPress={handleCheckOut}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="logout" size={24} color="#fff" />
                <Text style={styles.buttonText}>Check Out</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={[styles.button, styles.disabledButton]}>
            <Text style={styles.buttonText}>
              {attendance?.checkoutTime
                ? "Completed for today"
                : "Already checked in"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {canCheckout
            ? "✓ You are currently checked in"
            : attendance?.checkoutTime
              ? `✓ Completed - Total: ${attendance.totalHours?.toFixed(2) || 0}h`
              : canCheckin
                ? "Click Check In to start your day"
                : "Attendance recorded for today"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  dateText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 50,
    marginBottom: 24,
    color: "#333",
  },
  timeCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeCardGradient: {
    padding: 24,
    borderRadius: 16,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeColumn: {
    alignItems: "center",
  },
  timeLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    marginBottom: 4,
  },
  timeValue: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  timerContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 16,
    marginTop: 16,
    alignItems: "center",
  },
  timerLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    marginBottom: 4,
  },
  timerValue: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  locationContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 24,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
    color: "#555",
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkinButton: {
    backgroundColor: "#4CAF50",
  },
  checkoutButton: {
    backgroundColor: "#F44336",
  },
  disabledButton: {
    backgroundColor: "#95a5a6",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  statusContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  statusText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
