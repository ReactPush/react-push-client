# ReactPush Example App

This is a complete working example of ReactPush integration in a React Native app.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. iOS Setup

The ReactPush native files are automatically included via CocoaPods (no manual setup needed):

```bash
cd ios
pod install
cd ..
```

### 3. Configure API

Update `App.js` with your API key:
```javascript
const API_KEY = 'YOUR_APP_API_KEY';
```
Note: The API URL is automatically set to `http://localhost:8686` in development mode (`__DEV__`) and `https://reactpush.com` in production builds.

### 4. Run the App

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

## Features Demonstrated

- ✅ Checking for updates
- ✅ Downloading updates
- ✅ Automatic bundle loading on app restart
- ✅ Native integration (iOS & Android)
- ✅ Error handling and crash reporting
- ✅ **Push notification auto-update** - Automatically check and install updates when push notifications are received

## Push Notification Auto-Update

The example app includes a push notification service that automatically checks for and installs updates when a push notification with `type: 'update_available'` is received.

### Features:
- Automatic update check on push notification
- Seamless update installation
- Test button to simulate push notifications
- Works in foreground, background, and when app is killed

See [PUSH_NOTIFICATION_AUTO_UPDATE.md](./PUSH_NOTIFICATION_AUTO_UPDATE.md) for detailed documentation.

## Native Integration

This example shows how to use ReactPush native classes. The native files are automatically linked from the `react-push-client` package:

- **iOS**: Auto-linked via CocoaPods podspec - uses `[ReactPush getJsBundleURL:@"main" withExtension:@"jsbundle"]` in `AppDelegate.mm`
- **Android**: Auto-linked via Gradle script - uses `ReactPush.getJsBundlePath(context, defaultBundleName)` in `MainApplication.kt`

**Fully automatic!** Just add one line to your `build.gradle` and run `pod install` for iOS. The example project has zero ReactPush native files - everything comes from the installed package.
