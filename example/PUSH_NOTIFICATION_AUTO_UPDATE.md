# Push Notification Auto-Update Feature

This document describes the push notification auto-update feature in the ReactPush example app.

## Overview

The example app now includes functionality to automatically check for and install updates when a push notification is received. When a push notification with the type `update_available` is received, the app will:

1. Automatically check for available updates
2. Download the update if available
3. Install and restart the app to apply the update

## How It Works

### Push Notification Service

The `PushNotificationService` class (`src/PushNotificationService.js`) handles all push notification logic:

- **Initialization**: Sets up push notification listeners for both iOS and Android
- **Notification Handling**: When a notification with `data.type === 'update_available'` is received, it automatically triggers the update process
- **Auto-Update Flow**: 
  1. Receives notification
  2. Calls `reactPush.checkForUpdate()`
  3. Downloads the update if available
  4. Restarts the app to apply the update

### Integration in App.js

The main `App.js` file:

- Initializes the `PushNotificationService` on app start
- Requests push notification permissions
- Displays push notification status in the UI
- Provides a test button to simulate a push notification

## Setup Instructions

### 1. Install Dependencies

```bash
cd example
npm install
```

The following packages are required:
- `react-native-push-notification` - For Android push notifications
- `@react-native-community/push-notification-ios` - For iOS push notifications

### 2. iOS Setup

#### Update Podfile (if needed)

The iOS setup requires the push notification pod. Run:

```bash
cd ios
pod install
```

#### Configure AppDelegate

The `AppDelegate.mm` has been updated to:
- Request notification permissions
- Handle remote notification registration
- Handle notification events

#### Configure Info.plist

The `Info.plist` includes:
- `UIBackgroundModes` with `remote-notification` for background notifications

### 3. Android Setup

#### Update AndroidManifest.xml

The `AndroidManifest.xml` includes:
- Required permissions: `POST_NOTIFICATIONS`, `VIBRATE`, `RECEIVE_BOOT_COMPLETED`
- Push notification receivers and services

## Usage

### Testing with Local Notifications

You can test the auto-update feature using the "Test Push Notification (Auto-Update)" button in the app. This will:

1. Send a local notification with `type: 'update_available'`
2. Trigger the auto-update flow
3. Check for updates and install if available

### Sending Remote Push Notifications

To trigger auto-update via remote push notifications, send a notification with the following structure:

#### iOS (APNs)

```json
{
  "aps": {
    "alert": {
      "title": "Update Available",
      "body": "A new version is available"
    },
    "sound": "default",
    "badge": 1
  },
  "type": "update_available"
}
```

#### Android (FCM)

```json
{
  "notification": {
    "title": "Update Available",
    "body": "A new version is available"
  },
  "data": {
    "type": "update_available"
  }
}
```

### Notification Data Format

The notification must include `data.type === 'update_available'` to trigger auto-update:

```javascript
{
  data: {
    type: 'update_available'
  },
  title: 'Update Available',
  message: 'A new version is available'
}
```

## Features

### Automatic Update on Notification

When a push notification with `type: 'update_available'` is received:

- **Foreground**: The app immediately checks for updates
- **Background**: The app checks for updates when opened
- **Killed**: The app checks for updates when launched

### Manual Testing

Use the test button in the app UI to simulate a push notification and verify the auto-update flow works correctly.

### Status Display

The app displays the push notification status:
- "Push notifications ready" - Permissions granted and service initialized
- "Push notifications permission denied" - User denied permissions
- "Push notifications unavailable" - Service failed to initialize

## Troubleshooting

### iOS Issues

1. **Notifications not working**: 
   - Ensure `pod install` was run
   - Check that notification permissions are granted in Settings
   - Verify `UIBackgroundModes` includes `remote-notification`

2. **AppDelegate errors**:
   - Ensure `UNUserNotificationCenterDelegate` protocol is implemented
   - Check that all required methods are implemented

### Android Issues

1. **Notifications not working**:
   - Verify permissions in `AndroidManifest.xml`
   - Check that notification channels are created (Android 8.0+)
   - Ensure `POST_NOTIFICATIONS` permission is requested at runtime (Android 13+)

2. **Service not starting**:
   - Check that receivers and services are properly declared in `AndroidManifest.xml`
   - Verify the package name matches your app

### General Issues

1. **Auto-update not triggering**:
   - Verify the notification includes `data.type === 'update_available'`
   - Check console logs for errors
   - Ensure ReactPush is properly initialized

2. **Update check fails**:
   - Verify API key and URL are correct
   - Check network connectivity
   - Ensure device ID is initialized

## Code Structure

```
example/
├── src/
│   └── PushNotificationService.js    # Push notification service
├── App.js                             # Main app with push notification integration
├── ios/
│   └── ExampleApp/
│       ├── AppDelegate.h             # AppDelegate header with UNUserNotificationCenterDelegate
│       ├── AppDelegate.mm            # AppDelegate implementation with push notification handlers
│       └── Info.plist                # iOS configuration with background modes
└── android/
    └── app/
        └── src/
            └── main/
                └── AndroidManifest.xml  # Android configuration with permissions and services
```

## Best Practices

1. **Error Handling**: The service includes error handling and crash reporting
2. **User Experience**: Updates are installed automatically without user intervention
3. **Testing**: Use the test button to verify functionality before deploying
4. **Permissions**: Always request permissions gracefully and explain why they're needed
5. **Background Updates**: The app can check for updates even when in the background

## Future Enhancements

Potential improvements:
- Support for silent push notifications
- Configurable update behavior (immediate vs. scheduled)
- User preferences for auto-update
- Update progress notifications
- Rollback capability

## Related Documentation

- [ReactPush Client Documentation](../client/README.md)
- [Integration Guide](../client/INTEGRATION_GUIDE.md)
- [React Native Push Notification](https://github.com/zo0r/react-native-push-notification)
- [React Native Community Push Notification iOS](https://github.com/react-native-community/push-notification-ios)

