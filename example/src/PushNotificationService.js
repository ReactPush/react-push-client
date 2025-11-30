import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import PushNotificationIOS from '@react-native-community/push-notification-ios';

class PushNotificationService {
  constructor(reactPushInstance) {
    this.reactPush = reactPushInstance;
    this.onNotificationReceived = null;
    this.initialized = false;
  }

  /**
   * Initialize push notification service
   */
  initialize() {
    if (this.initialized) {
      return;
    }

    // Configure Android push notifications
    PushNotification.configure({
      // Called when a notification is received
      onNotification: (notification) => {
        console.log('Push notification received:', notification);
        
        // Check if this is a silent notification for auto-update
        if (notification.data && notification.data.type === 'update_available') {
          this.handleUpdateNotification(notification);
        } else {
          // Show the notification to the user
          if (notification.userInteraction === false) {
            // Notification was received in foreground
            PushNotification.localNotification({
              title: notification.title || 'New Update',
              message: notification.message || 'An update is available',
              playSound: true,
              soundName: 'default',
            });
          }
        }

        // Call custom handler if provided
        if (this.onNotificationReceived) {
          this.onNotificationReceived(notification);
        }

        // Required on iOS only
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },

      // Called when user taps on notification
      onAction: (notification) => {
        console.log('Push notification action:', notification);
        
        if (notification.data && notification.data.type === 'update_available') {
          this.handleUpdateNotification(notification);
        }
      },

      // Request permissions on iOS
      requestPermissions: Platform.OS === 'ios',
      
      // Permissions callback
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Pop initial notification
      popInitialNotification: true,
    });

    // Configure iOS notification actions
    if (Platform.OS === 'ios') {
      PushNotificationIOS.addEventListener('notification', (notification) => {
        console.log('iOS push notification received:', notification);
        
        const notificationData = notification.getData ? notification.getData() : (notification.data || {});
        const notificationTitle = notification.getTitle ? notification.getTitle() : (notification.title || '');
        const notificationBody = notification.getBody ? notification.getBody() : (notification.body || '');
        
        if (notificationData.type === 'update_available') {
          this.handleUpdateNotification({
            data: notificationData,
            title: notificationTitle,
            message: notificationBody,
          });
        }

        // Call custom handler if provided
        if (this.onNotificationReceived) {
          this.onNotificationReceived({
            data: notificationData,
            title: notificationTitle,
            message: notificationBody,
          });
        }
      });

      PushNotificationIOS.addEventListener('register', (token) => {
        console.log('iOS push notification token:', token);
      });

      PushNotificationIOS.addEventListener('registrationError', (error) => {
        console.error('iOS push notification registration error:', error);
      });
    }

    this.initialized = true;
  }

  /**
   * Handle update notification - automatically check and install update
   */
  async handleUpdateNotification(notification) {
    try {
      console.log('Handling update notification, checking for updates...');
      
      // Check for update
      const update = await this.reactPush.checkForUpdate();
      
      if (update) {
        console.log('Update available, downloading...');
        
        // Download the update
        await this.reactPush.downloadUpdate(update);
        
        console.log('Update downloaded, restarting app...');
        
        // Auto-restart to apply update
        setTimeout(async () => {
          try {
            await this.reactPush.restartApp();
          } catch (error) {
            console.error('Failed to restart app:', error);
            // Show notification that update is ready
            this.showUpdateReadyNotification();
          }
        }, 1000);
      } else {
        console.log('No update available');
      }
    } catch (error) {
      console.error('Error handling update notification:', error);
      // Report error
      if (this.reactPush.reportJavaScriptError) {
        this.reactPush.reportJavaScriptError(error, {
          context: 'handleUpdateNotification',
          notification: notification,
        }).catch(err => console.error('Failed to report error:', err));
      }
    }
  }

  /**
   * Show notification that update is ready
   */
  showUpdateReadyNotification() {
    PushNotification.localNotification({
      title: 'Update Ready',
      message: 'An update has been downloaded. Please restart the app to apply it.',
      playSound: true,
      soundName: 'default',
    });
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    if (Platform.OS === 'ios') {
      return await PushNotificationIOS.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
      });
    } else {
      // Android permissions are requested automatically
      return { alert: true, badge: true, sound: true };
    }
  }

  /**
   * Get notification permissions status
   */
  async getPermissions() {
    if (Platform.OS === 'ios') {
      return await PushNotificationIOS.checkPermissions((permissions) => {
        return permissions;
      });
    } else {
      // Android permissions are granted by default
      return { alert: true, badge: true, sound: true };
    }
  }

  /**
   * Schedule a local notification (for testing)
   */
  scheduleLocalNotification(title, message, data = {}) {
    PushNotification.localNotification({
      title: title,
      message: message,
      data: data,
      playSound: true,
      soundName: 'default',
    });
  }

  /**
   * Schedule a test update notification
   */
  scheduleTestUpdateNotification() {
    this.scheduleLocalNotification(
      'Update Available',
      'A new version is available. The app will check and install it automatically.',
      { type: 'update_available' }
    );
  }

  /**
   * Cancel all notifications
   */
  cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
    if (Platform.OS === 'ios') {
      PushNotificationIOS.removeAllDeliveredNotifications();
    }
  }
}

export default PushNotificationService;

