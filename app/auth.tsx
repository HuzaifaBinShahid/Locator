import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as LocalAuthentication from "expo-local-authentication";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
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

const { width } = Dimensions.get("window");

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [signupStep, setSignupStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nieOrDni, setNieOrDni] = useState("");
  const [socialSecurityNumber, setSocialSecurityNumber] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const stepSlideAnim = useRef(new Animated.Value(0)).current;

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

  const animateStepTransition = (direction: "forward" | "back") => {
    const startValue = direction === "forward" ? 300 : -300;
    stepSlideAnim.setValue(startValue);
    Animated.spring(stepSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
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
        Alert.alert(
          "Error",
          "Biometric login not set up. Please login with credentials first."
        );
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

  const pickProfileImage = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Camera roll access is needed to upload a photo."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      const base64Size = (result.assets[0].base64.length * 3) / 4;
      if (base64Size > 3 * 1024 * 1024) {
        Alert.alert("Image Too Large", "Maximum image size is 3MB.");
        return;
      }
      setProfileImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
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
    setNieOrDni("");
    setSocialSecurityNumber("");
    setProfileImage(null);
    setUsername("");
    setEmail("");
    setPassword("");
    setSignupStep(1);
    setIsLogin(!isLogin);
  };

  const handleNextStep = () => {
    if (!nieOrDni.trim()) {
      Alert.alert("Error", "NIE/DNI is required");
      return;
    }
    if (!socialSecurityNumber.trim()) {
      Alert.alert("Error", "Social Security Number is required");
      return;
    }
    setSignupStep(2);
    animateStepTransition("forward");
  };

  const handleBackStep = () => {
    setSignupStep(1);
    animateStepTransition("back");
  };

  const handleAuth = async () => {
    if (!isLogin) {
      if (!username.trim()) {
        Alert.alert("Error", "Username is required");
        return;
      }
      if (!email.trim()) {
        Alert.alert("Error", "Email is required");
        return;
      }
      if (!password.trim()) {
        Alert.alert("Error", "Password is required");
        return;
      }
    }
    setLoading(true);
    try {
      const endpoint = isLogin ? "/login" : "/signup";
      const body = isLogin
        ? { email, password }
        : {
            username,
            email,
            password,
            nieOrDni,
            socialSecurityNumber,
            profileImage,
          };

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

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <View style={styles.stepRow}>
        <View
          style={[
            styles.stepCircle,
            signupStep >= 1 && styles.stepCircleActive,
          ]}
        >
          <Text
            style={[
              styles.stepCircleText,
              signupStep >= 1 && styles.stepCircleTextActive,
            ]}
          >
            1
          </Text>
        </View>
        <View
          style={[
            styles.stepLine,
            signupStep >= 2 && styles.stepLineActive,
          ]}
        />
        <View
          style={[
            styles.stepCircle,
            signupStep >= 2 && styles.stepCircleActive,
          ]}
        >
          <Text
            style={[
              styles.stepCircleText,
              signupStep >= 2 && styles.stepCircleTextActive,
            ]}
          >
            2
          </Text>
        </View>
      </View>
      <View style={styles.stepLabelRow}>
        <Text style={[styles.stepLabel, signupStep === 1 && styles.stepLabelActive]}>
          Identity
        </Text>
        <Text style={[styles.stepLabel, signupStep === 2 && styles.stepLabelActive]}>
          Account
        </Text>
      </View>
    </View>
  );

  const renderSignupStep1 = () => (
    <Animated.View style={{ transform: [{ translateX: signupStep === 1 ? stepSlideAnim : 0 }] }}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>NIE / DNI</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="card-outline"
            size={20}
            color="#4CAF50"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter your NIE or DNI"
            placeholderTextColor="#999"
            value={nieOrDni}
            onChangeText={setNieOrDni}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Social Security Number</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="document-text-outline"
            size={20}
            color="#4CAF50"
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter your SS number"
            placeholderTextColor="#999"
            value={socialSecurityNumber}
            onChangeText={setSocialSecurityNumber}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Upload Your Photo</Text>
        <Text style={styles.optionalLabel}>Optional but recommended</Text>
        <TouchableOpacity
          style={styles.photoUploadButton}
          onPress={pickProfileImage}
        >
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.photoPreview}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={32} color="#4CAF50" />
              <Text style={styles.photoPlaceholderText}>
                Tap to select photo
              </Text>
            </View>
          )}
        </TouchableOpacity>
        {profileImage && (
          <TouchableOpacity
            onPress={() => setProfileImage(null)}
            style={styles.removePhotoButton}
          >
            <Ionicons name="close-circle" size={18} color="#e74c3c" />
            <Text style={styles.removePhotoText}>Remove photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleNextStep}>
          <LinearGradient
            colors={["#4CAF50", "#2E7D32"]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderSignupStep2 = () => (
    <Animated.View style={{ transform: [{ translateX: signupStep === 2 ? stepSlideAnim : 0 }] }}>
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

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="mail-outline"
            size={16}
            color="#4CAF50"
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
            color="#4CAF50"
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

      <View style={styles.stepButtonsRow}>
        <TouchableOpacity
          style={[styles.button, styles.backStepButton]}
          onPress={handleBackStep}
        >
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={20} color="#4CAF50" />
            <Text style={styles.backButtonText}>Back</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitStepButton, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          <LinearGradient
            colors={["#4CAF50", "#2E7D32"]}
            style={styles.buttonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.buttonText}>Sign Up</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderLoginForm = () => (
    <>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="mail-outline"
            size={16}
            color="#005b96"
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
            color="#005b96"
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
            colors={["#005b96", "#003a6b"]}
            style={styles.buttonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="enter-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Sign In</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {biometricAvailable && biometricEnabled && (
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
    </>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isLogin ? "#b3cde0" : "#c8e6c9" },
      ]}
    >
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
                    name={
                      isLogin ? "person-circle-outline" : "person-add-outline"
                    }
                    size={24}
                    color={isLogin ? "#005b96" : "#4CAF50"}
                    style={styles.headerIcon}
                  />
                  <Text style={styles.title}>
                    {isLogin
                      ? "Welcome Back"
                      : signupStep === 1
                      ? "Identity Info"
                      : "Create Account"}
                  </Text>
                </View>
                <Text style={styles.subtitle}>
                  {isLogin
                    ? "Sign in to continue"
                    : signupStep === 1
                    ? "Enter your identity details"
                    : "Set up your login credentials"}
                </Text>
              </View>

              {!isLogin && renderStepIndicator()}

              {isLogin
                ? renderLoginForm()
                : signupStep === 1
                ? renderSignupStep1()
                : renderSignupStep2()}

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
    marginBottom: 20,
  },
  // Step indicator styles
  stepIndicatorContainer: {
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: {
    backgroundColor: "#4CAF50",
  },
  stepCircleText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#999",
  },
  stepCircleTextActive: {
    color: "#fff",
  },
  stepLine: {
    width: 60,
    height: 3,
    backgroundColor: "#e9ecef",
    marginHorizontal: 8,
    borderRadius: 2,
  },
  stepLineActive: {
    backgroundColor: "#4CAF50",
  },
  stepLabelRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    gap: 52,
  },
  stepLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  stepLabelActive: {
    color: "#4CAF50",
    fontWeight: "700",
  },
  // Input styles
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
  // Button styles
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
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Step 2 back/submit row
  stepButtonsRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 12,
  },
  backStepButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#4CAF50",
  },
  backButtonInner: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    gap: 6,
  },
  backButtonText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "600",
  },
  submitStepButton: {
    flex: 2,
  },
  // Switch mode
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
  // Biometric
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
  // Photo upload
  optionalLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 8,
    fontStyle: "italic",
  },
  photoUploadButton: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f8f9fa",
  },
  photoPreview: {
    width: "100%",
    height: 150,
    borderRadius: 12,
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
  },
  removePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    alignSelf: "center",
  },
  removePhotoText: {
    marginLeft: 4,
    fontSize: 13,
    color: "#e74c3c",
  },
});
