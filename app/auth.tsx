import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { API_BASE_URL } from "../constants/Config";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    if (isLogin) {
      checkBiometricStatus();
    } else {
      setBiometricEnabled(false);
    }
  }, [isLogin]);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      setBiometricAvailable(false);
    }
  };

  const checkBiometricStatus = async () => {
    try {
      const biometricEmail = await AsyncStorage.getItem("biometricEmail");
      const biometricUserId = await AsyncStorage.getItem("biometricUserId");
      
      if (biometricEmail && biometricUserId) {
        setBiometricEnabled(true);
      } else {
        setBiometricEnabled(false);
      }
    } catch (error) {
      setBiometricEnabled(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const biometricUserId = await AsyncStorage.getItem("biometricUserId");
      if (!biometricUserId) {
        Alert.alert("Error", "Biometric login not set up. Please login with credentials first.");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to login",
        cancelLabel: "Cancel",
      });

      if (result.success) {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/auth/biometric-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: biometricUserId }),
        });

        const data = await response.json();

        if (response.ok && data.token) {
          await AsyncStorage.setItem("token", data.token);
          await AsyncStorage.setItem("user", JSON.stringify(data.user));

          if (data.user && data.user.role === "admin") {
            router.replace("/admin-home");
          } else {
            router.replace("/");
          }
        } else {
          Alert.alert("Error", data.message || "Biometric login failed");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", "Biometric authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setIsLogin(!isLogin);
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      const endpoint = isLogin ? "/login" : "/signup";
      const body = isLogin
        ? { email, password }
        : { username, email, password };

      const res = await fetch(API_BASE_URL + "/auth" + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        
        if (data.user && data.user.role === "admin") {
          router.replace("/admin-home");
        } else {
          router.replace("/");
        }
      } else {
        Alert.alert("Error", data.message || "Authentication failed");
      }
    } catch (e) {
      Alert.alert("Error", "Network error - Backend may not be running");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isLogin ? "#b3cde0" : "#c8e6c9" }]}>
      <LinearGradient
        colors={isLogin ? ["#b3cde0", "#7eb4ff"] : ["#c8e6c9", "#81c784"]}
        style={styles.backgroundGradient}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.headerContainer}>
                <View style={styles.titleContainer}>
                  <Ionicons
                    name={isLogin ? "happy-outline" : "gift-outline"}
                    size={24}
                    color={isLogin ? "#005b96" : "#4CAF50"}
                    style={styles.headerIcon}
                  />
                  <Text style={styles.title}>
                    {isLogin ? "Welcome Back" : "Welcome"}
                  </Text>
                </View>
                <Text style={styles.subtitle}>
                  {isLogin ? "Sign in to continue" : "Create your account"}
                </Text>
              </View>

              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Username</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color="#4CAF50"
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your username"
                      placeholderTextColor="#999"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={isLogin ? "#005b96" : "#4CAF50"}
                    style={styles.icon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={16}
                    color={isLogin ? "#005b96" : "#4CAF50"}
                    style={styles.icon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

      

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleAuth}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={
                      isLogin ? ["#005b96", "#003a6b"] : ["#4CAF50", "#2E7D32"]
                    }
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name={
                            isLogin
                              ? "log-in-outline"
                              : "checkmark-circle-outline"
                          }
                          size={20}
                          color="#fff"
                        />
                        <Text style={styles.buttonText}>
                          {isLogin ? "Sign In" : "Sign Up"}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {isLogin && biometricAvailable && biometricEnabled && (
                <View style={styles.biometricContainer}>
                  <TouchableOpacity
                    style={styles.biometricButton}
                    onPress={handleBiometricLogin}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={["#4CAF50", "#2E7D32"]}
                      style={styles.biometricButtonGradient}
                    >
                      <Ionicons name="finger-print" size={16} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                  <Text style={styles.biometricText}>Use Biometric</Text>
                </View>
              )}

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isLogin
                    ? "Don't have an account? "
                    : "Already have an account? "}
                  <Text
                    style={[
                      styles.switchButton,
                      isLogin ? { color: "#4CAF50" } : { color: "#005b96" },
                    ]}
                    onPress={switchMode}
                  >
                    {isLogin ? "Sign Up" : "Sign In"}
                  </Text>
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#b3cde0",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  backgroundGradient: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    marginHorizontal: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#011f4b",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#03396c",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#03396c",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  inputWrapperFocused: {
    borderColor: "#005b96",
    backgroundColor: "#fff",
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 14,
    color: "#011f4b",
  },
  eyeIcon: {
    padding: 0,
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  switchContainer: {
    marginTop: 10,

  },
  switchText: {
    fontSize: 16,
    color: "#03396c",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    marginTop: 10,
  },
  switchButton: {
    color: "#005b96",
    fontWeight: "600",
  },
  switchTextBold: {
    fontWeight: "bold",
    color: "#006aff",
  },
  biometricContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  biometricButton: {
    width: 50,
    height: 50,
    borderRadius: 40,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  biometricButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  biometricText: {
    marginTop: 8,
    fontSize: 14,
    color: "#03396c",
    fontWeight: "500",
  },
});
