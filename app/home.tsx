import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { format } from "date-fns";
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TabHomeScreen() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkinTime, setCheckinTime] = useState<Date | null>(null);
  const [checkoutTime, setCheckoutTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCheckedIn) {
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
  }, [isCheckedIn, pulseAnim]);

  // Timer effect
  useEffect(() => {
    if (isCheckedIn) {
      timerRef.current = setInterval(() => {
        const now = new Date();
        if (checkinTime && typeof checkinTime.getTime === "function") {
          const diff = now.getTime() - checkinTime.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          setElapsedTime(
            `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
          );
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isCheckedIn, checkinTime]);

  // Get location and convert to address
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
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation);

      // Reverse geocode to get address
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

        setAddress(addressComponents.join(", "));
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get your location");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleCheckIn = async () => {
    await getLocationAsync();
    const now = new Date();
    setCheckinTime(now);
    setIsCheckedIn(true);
    setCheckoutTime(null);

    console.log("CHECK-IN INFO:", {
      time: now.toISOString(),
      location: location,
      address: address,
    });
  };

  const handleCheckOut = () => {
    const now = new Date();
    setCheckoutTime(now);
    setIsCheckedIn(false);

    if (checkinTime) {
      const duration = now.getTime() - checkinTime.getTime();
      const hours = Math.floor(duration / (1000 * 60 * 60));
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

      console.log("CHECK-OUT INFO:", {
        checkinTime: checkinTime.toISOString(),
        checkoutTime: now.toISOString(),
        duration: `${hours}h ${minutes}m`,
        location: location,
        address: address,
      });

      Alert.alert(
        "Check-out Successful",
        `You worked for ${hours}h ${minutes}m`,
        [{ text: "OK" }]
      );
    } else {
      console.warn("No check-in time found for check-out.");
      Alert.alert("Check-out Error", "No check-in time found.", [
        { text: "OK" },
      ]);
    }
  };

  const formatTimeDisplay = (date: any) => {
    if (!date) return "--:--";
    return format(date, "hh:mm a");
  };

  const formatDateDisplay = (date: any) => {
    if (!date) return "--/--/----";
    return format(date, "EEE, MMM dd, yyyy");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{formatDateDisplay(new Date())}</Text>

      <Animated.View
        style={[
          styles.timeCard,
          { transform: [{ scale: isCheckedIn ? pulseAnim : 1 }] },
        ]}
      >
        <LinearGradient
          colors={isCheckedIn ? ["#4CAF50", "#2E7D32"] : ["#3498db", "#2980b9"]}
          style={styles.timeCardGradient}
        >
          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>Check-in</Text>
              <Text style={styles.timeValue}>
                {checkinTime ? formatTimeDisplay(checkinTime) : "--:--"}
              </Text>
            </View>

            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>Check-out</Text>
              <Text style={styles.timeValue}>
                {checkoutTime ? formatTimeDisplay(checkoutTime) : "--:--"}
              </Text>
            </View>
          </View>

          {isCheckedIn && (
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
        {!isCheckedIn ? (
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
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.checkoutButton]}
            onPress={handleCheckOut}
          >
            <MaterialCommunityIcons name="logout" size={24} color="#fff" />
            <Text style={styles.buttonText}>Check Out</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isCheckedIn
            ? "✓ You are currently checked in"
            : checkinTime && checkoutTime
              ? "✓ Last session completed"
              : "Click Check In to start a new session"}
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
  dateText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 20,
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
    // marginBottom: isCheckedIn => isCheckedIn ? 16 : 0, // Remove function style, not supported in StyleSheet
    marginBottom: 0,
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
} as const);
