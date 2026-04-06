# Locator

A React Native (Expo) mobile app for employee attendance tracking with GPS location, biometric authentication, and admin management.

## Features

### User
- **Attendance Tracking** - Check-in/check-out with real-time GPS location and address
- **Elapsed Time** - Live timer showing current session duration
- **Biometric Login** - Fingerprint/Face ID authentication
- **Device Info** - View device specifications synced to server
- **Profile Management** - Profile picture upload, account settings

### Admin
- **Dashboard** - Quick stats (total users, admins)
- **User Management** - View all users and their details
- **Attendance History** - Per-user attendance records
- **Export Data** - Download user data as Excel (.xlsx)

## Tech Stack

- **Framework:** React Native with Expo SDK 54
- **Navigation:** Expo Router (file-based) + React Navigation
- **Location:** expo-location (foreground permissions, reverse geocoding)
- **Auth:** expo-local-authentication (biometrics) + JWT tokens
- **Storage:** AsyncStorage for local persistence
- **Styling:** React Native StyleSheet with dark/light theme support

## Screens

| Screen | File | Description |
|--------|------|-------------|
| Auth | `app/auth.tsx` | Login/signup with biometric option |
| Home | `app/(tabs)/index.tsx` | Check-in/check-out with location |
| Device | `app/(tabs)/device.tsx` | Device information display |
| Profile | `app/(tabs)/profile.tsx` | User profile & settings |
| Admin Home | `app/admin-home.tsx` | Admin dashboard |
| Admin Users | `app/admin-users.tsx` | User list + export |
| User Details | `app/admin-user-details.tsx` | User attendance history |
| Admin Profile | `app/admin-profile.tsx` | Admin profile page |

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS: macOS with Xcode (for simulator/device)
- Android: Android Studio with emulator or physical device

### Installation

```bash
cd Locator
npm install
```

### Run

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on Web
npm run web
```

### Configuration

The API base URL is configured in `constants/Config.ts`:
- **Production:** `https://locator-backend.vercel.app/api`
- **Development:** Automatically uses local backend based on platform

## Building

### Android APK (EAS Build)
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

### iOS (requires Mac + Apple Developer Account)
```bash
eas build --platform ios
```

### iOS Local (Mac only, own device)
```bash
npx expo run:ios --device
```

## Project Structure

```
Locator/
  app/
    _layout.tsx          # Root navigation layout
    index.tsx            # Splash/loading screen
    auth.tsx             # Authentication screen
    home.tsx             # Legacy home screen
    admin-home.tsx       # Admin dashboard
    admin-users.tsx      # Admin user management
    admin-user-details.tsx
    admin-profile.tsx
    (tabs)/
      _layout.tsx        # Tab navigation layout
      index.tsx          # Main attendance screen
      device.tsx         # Device info screen
      profile.tsx        # User profile screen
  components/
    Collapsible.tsx
    ExternalLink.tsx
    HapticTab.tsx
    ThemedText.tsx
    ThemedView.tsx
    ParallaxScrollView.tsx
    ui/                  # Platform-specific UI components
  constants/
    Config.ts            # API URL configuration
    Colors.ts            # Theme colors
  hooks/                 # Theme and color scheme hooks
  assets/
    fonts/               # Custom fonts (SpaceMono)
    images/              # App icons, splash screens
```

## Backend

See [Locator-Backend/README.md](../Locator-Backend/README.md) for the API server documentation.
