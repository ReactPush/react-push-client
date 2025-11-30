import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import ReactPush from 'react-push-client';
import PushNotificationService from './src/PushNotificationService';

// API Key for ReactPush
const API_KEY = 'q7AkvRhS3ayisrOJyF1dqWxxUfVyPp1OlBIEg2PBMoU';
// Use localhost in debug mode, production URL otherwise
const API_URL = __DEV__ ? 'http://localhost:8686' : 'https://reactpush.com';
const APP_VERSION = '0.0.1';

export default function App() {
  const [status, setStatus] = React.useState('Initializing...');
  const [updateStatus, setUpdateStatus] = React.useState('Checking for updates...');
  const [isChecking, setIsChecking] = React.useState(false);
  const [currentVersion, setCurrentVersion] = React.useState(APP_VERSION);
  const [pushNotificationStatus, setPushNotificationStatus] = React.useState('Initializing...');
  const restartInProgress = React.useRef(false);
  
  const [reactPush] = React.useState(() => {
    return new ReactPush({
      apiKey: API_KEY,
      apiUrl: API_URL,
      appVersion: APP_VERSION,
      onUpdateAvailable: (update) => {
        setUpdateStatus(`Update available: ${update.label || update.version}`);
        Alert.alert(
          'Update Available',
          `Version ${update.version} is available. Would you like to download and install it now?`,
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Download & Install',
              onPress: async () => {
                try {
                  setUpdateStatus('Downloading update...');
                  restartInProgress.current = true;
                  await reactPush.downloadUpdate(update);
                  setUpdateStatus('Update downloaded! Restarting app...');
                  
                  // Show a brief message before restart
                  Alert.alert(
                    'Update Installed',
                    'The app will restart now to apply the update.',
                    [{ text: 'OK' }],
                    { cancelable: false }
                  );
                  
                  // Wait a moment for the alert to show, then restart
                  setTimeout(async () => {
                    try {
                      await reactPush.restartApp();
                    } catch (restartError) {
                      restartInProgress.current = false;
                      setUpdateStatus(`Restart failed: ${restartError.message}`);
                      Alert.alert('Restart Required', 'Please manually restart the app to apply the update.');
                    }
                  }, 1000);
                } catch (error) {
                  restartInProgress.current = false;
                  setUpdateStatus(`Error: ${error.message}`);
                  Alert.alert('Error', `Failed to download update: ${error.message}`);
                }
              },
            },
          ]
        );
      },
      onUpdateDownloaded: (update) => {
        // Auto-restart when update is downloaded (if not already handled in onUpdateAvailable)
        if (!restartInProgress.current) {
          setUpdateStatus('Update downloaded! Restarting app...');
          restartInProgress.current = true;
          setTimeout(async () => {
            try {
              await reactPush.restartApp();
            } catch (error) {
              restartInProgress.current = false;
              console.error('Auto-restart failed:', error);
              setUpdateStatus('Update ready. Please restart the app manually.');
              Alert.alert('Restart Required', 'Update downloaded. Please restart the app to apply it.');
            }
          }, 500);
        }
      },
      onError: (error) => {
        console.error('ReactPush error:', error);
        setUpdateStatus(`Error: ${error.message}`);
        // Automatically report errors to crash reporting
        reactPush.reportJavaScriptError(error, {
          context: 'ReactPush',
          updateStatus: updateStatus,
        }).catch(err => console.error('Failed to report error:', err));
      },
      enableCrashReporting: true, // Enable automatic crash reporting
    });
  });

  const [pushNotificationService] = React.useState(() => {
    return new PushNotificationService(reactPush);
  });

  React.useEffect(() => {
    // Initialize device ID, push notifications, and then check for updates on app start
    const initializeAndCheck = async () => {
      try {
        // Ensure device ID is initialized
        await reactPush.getDeviceIdAsync();
        
        // Initialize push notification service
        try {
          pushNotificationService.initialize();
          setPushNotificationStatus('Push notifications enabled');
          
          // Request permissions
          const permissions = await pushNotificationService.requestPermissions();
          if (permissions.alert || permissions.badge || permissions.sound) {
            setPushNotificationStatus('Push notifications ready');
          } else {
            setPushNotificationStatus('Push notifications permission denied');
          }
        } catch (error) {
          console.error('Failed to initialize push notifications:', error);
          setPushNotificationStatus('Push notifications unavailable');
        }
        
        // Then check for updates
        checkForUpdates();
      } catch (error) {
        console.error('Failed to initialize device ID:', error);
        // Still try to check for updates even if device ID init fails
        checkForUpdates();
      }
    };
    
    initializeAndCheck();
  }, []);

  const checkForUpdates = async () => {
    setIsChecking(true);
    setUpdateStatus('Checking for updates...');
    try {
      const update = await reactPush.checkForUpdate();
      if (update) {
        setUpdateStatus(`Update available: ${update.label || update.version}`);
      } else {
        setUpdateStatus('You are on the latest version!');
      }
    } catch (error) {
      setUpdateStatus(`Error: ${error.message}`);
      // Report check update errors
      reactPush.reportJavaScriptError(error, {
        context: 'checkForUpdates',
      }).catch(err => console.error('Failed to report error:', err));
    } finally {
      setIsChecking(false);
    }
  };

  const testButton = () => {
    // Add breadcrumb for user action
    reactPush.addBreadcrumb('Test button clicked', {
      timestamp: new Date().toISOString(),
    });
    
    Alert.alert('Test', 'Button works!');
    setStatus('Button clicked at ' + new Date().toLocaleTimeString());
  };

  // Example: Test crash reporting
  const testCrashReport = async () => {
    try {
      await reactPush.reportCustomError(
        'Test crash report from example app',
        'TestError',
        'This is a test stack trace\n  at testCrashReport (App.js:xxx)\n  at onPress (App.js:xxx)',
        { test: true, timestamp: new Date().toISOString() }
      );
      Alert.alert('Success', 'Test crash report sent!');
    } catch (error) {
      Alert.alert('Error', `Failed to send crash report: ${error.message}`);
    }
  };

  // Test push notification that triggers auto-update
  const testPushNotification = () => {
    pushNotificationService.scheduleTestUpdateNotification();
    setStatus('Test push notification sent! Check for auto-update...');
    Alert.alert(
      'Test Notification',
      'A test push notification has been sent. The app will automatically check for updates and install them if available.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🚀 ReactPush Example</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>App Status:</Text>
          <Text style={styles.status}>{status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Current Version:</Text>
          <Text style={styles.version}>{currentVersion}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Update Status:</Text>
          <View style={styles.updateContainer}>
            {isChecking && <ActivityIndicator size="small" color="#1976d2" style={styles.spinner} />}
            <Text style={styles.updateStatus}>{updateStatus}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Push Notification Status:</Text>
          <Text style={styles.status}>{pushNotificationStatus}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={testButton}>
            <Text style={styles.buttonText}>Test Button</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.checkButton]} 
            onPress={checkForUpdates}
            disabled={isChecking}
          >
            <Text style={styles.buttonText}>
              {isChecking ? 'Checking...' : 'Check for Updates'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.testCrashButton]} 
            onPress={testCrashReport}
          >
            <Text style={styles.buttonText}>Test Crash Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.pushNotificationButton]} 
            onPress={testPushNotification}
          >
            <Text style={styles.buttonText}>Test Push Notification (Auto-Update)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ About ReactPush</Text>
          <Text style={styles.infoText}>
            This app is integrated with ReactPush for over-the-air updates.{'\n\n'}
            • Automatic update checking on app start{'\n'}
            • Manual update checking via button{'\n'}
            • Download and install updates seamlessly{'\n'}
            • Push notification auto-update: When a push notification with type "update_available" is received, the app automatically checks for updates and installs them{'\n\n'}
            Make changes to the code and publish via CLI to see updates!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    marginTop: 20,
    textAlign: 'center',
    color: '#1976d2',
  },
  section: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  status: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  version: {
    fontSize: 18,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  updateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  updateStatus: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20,
    gap: 12,
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  checkButton: {
    backgroundColor: '#4caf50',
    shadowColor: '#4caf50',
  },
  testCrashButton: {
    backgroundColor: '#ff9800',
    shadowColor: '#ff9800',
  },
  pushNotificationButton: {
    backgroundColor: '#9c27b0',
    shadowColor: '#9c27b0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1976d2',
  },
  infoText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
});
