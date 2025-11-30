import { Platform, NativeModules, DevSettings } from 'react-native';
import RNFS from 'react-native-fs';
import RNRestart from 'react-native-restart';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UpdateChecker from './UpdateChecker';
import BundleManager from './BundleManager';
import CrashReporter from './CrashReporter';

const DEVICE_ID_STORAGE_KEY = '@ReactPush:deviceId';

class ReactPush {
  constructor(config) {
    if (!config) {
      throw new Error('ReactPush config is required');
    }
    
    if (!config.appVersion) {
      throw new Error('appVersion is required in ReactPush config');
    }
    
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || 'https://reactpush.com';
    this.appVersion = config.appVersion;
    this.deviceId = null; // Will be loaded asynchronously
    this.userId = config.userId || null;
    this.updateChecker = new UpdateChecker(this);
    this.bundleManager = new BundleManager(this);
    this.crashReporter = new CrashReporter(this);
    this.onUpdateAvailable = config.onUpdateAvailable || null;
    this.onUpdateDownloaded = config.onUpdateDownloaded || null;
    this.onError = config.onError || null;
    this._deviceIdPromise = null;
    
    // Setup crash reporting if enabled
    if (config.enableCrashReporting !== false) {
      this.crashReporter.setupGlobalErrorHandlers();
    }
    
    // If deviceId is provided in config, use it (for testing/override)
    if (config.deviceId) {
      this.deviceId = config.deviceId;
      this._deviceIdPromise = Promise.resolve(config.deviceId);
    } else {
      // Initialize device ID asynchronously
      this._deviceIdPromise = this.initializeDeviceId();
    }
  }

  /**
   * Generate a unique device ID
   */
  generateDeviceId() {
    // Generate a UUID-like device ID
    // Format: device_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const s4 = () => {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    };
    return `device_${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  }

  /**
   * Initialize device ID from storage or generate a new one
   */
  async initializeDeviceId() {
    try {
      // Try to load existing device ID from storage
      const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
      
      if (storedDeviceId) {
        this.deviceId = storedDeviceId;
        console.log('ReactPush: Loaded existing device ID:', storedDeviceId);
        return storedDeviceId;
      }
      
      // Generate new device ID if none exists
      const newDeviceId = this.generateDeviceId();
      await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, newDeviceId);
      this.deviceId = newDeviceId;
      console.log('ReactPush: Generated new device ID:', newDeviceId);
      return newDeviceId;
    } catch (error) {
      console.error('ReactPush: Failed to initialize device ID:', error);
      // Fallback to generating a temporary ID (won't persist)
      const fallbackId = this.generateDeviceId();
      this.deviceId = fallbackId;
      return fallbackId;
    }
  }

  /**
   * Ensure device ID is initialized before use
   */
  async ensureDeviceId() {
    if (this.deviceId) {
      return this.deviceId;
    }
    return await this._deviceIdPromise;
  }

  async checkForUpdate() {
    try {
      // Ensure device ID is initialized before checking for updates
      await this.ensureDeviceId();
      const update = await this.updateChecker.check();
      
      if (update && update.hasUpdate) {
        if (this.onUpdateAvailable) {
          this.onUpdateAvailable(update);
        }
        return update;
      }
      
      return null;
    } catch (error) {
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }

  async downloadUpdate(update) {
    try {
      const bundlePath = await this.bundleManager.downloadBundle(update);
      
      // Track current update for crash reporting
      if (update && update.updateId) {
        this.crashReporter.setCurrentUpdate(update.updateId, update.version);
      }
      
      if (this.onUpdateDownloaded) {
        this.onUpdateDownloaded({
          ...update,
          localBundlePath: bundlePath
        });
      }
      
      return bundlePath;
    } catch (error) {
      // Report download errors
      this.crashReporter.reportJavaScriptError(error, {
        context: 'downloadUpdate',
        updateVersion: update?.version,
      }).catch(err => console.error('Failed to report download error:', err));
      
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }

  async sync(options = {}) {
    const { checkFrequency = 'ON_APP_START', installMode = 'ON_NEXT_RESTART' } = options;
    
    try {
      const update = await this.checkForUpdate();
      
      if (update) {
        if (update.isMandatory || installMode === 'IMMEDIATE') {
          await this.downloadUpdate(update);
          if (installMode === 'IMMEDIATE') {
            await this.restartApp();
          }
        } else {
          await this.downloadUpdate(update);
        }
      }
    } catch (error) {
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  async restartApp() {
    try {
      // Method 1: Try DevSettings.reload() first (works in development, faster)
      const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
      if (isDev && DevSettings && typeof DevSettings.reload === 'function') {
        try {
          DevSettings.reload();
          return;
        } catch (e) {
          console.warn('DevSettings.reload failed, trying RNRestart:', e);
        }
      }

      // Method 2: Use react-native-restart (works in both dev and production)
      // This is the primary method for production builds
      if (RNRestart && RNRestart.Restart && typeof RNRestart.Restart === 'function') {
        RNRestart.Restart();
        return;
      }

      // Method 3: Fallback to NativeModules.DevSettings.reload()
      if (NativeModules && NativeModules.DevSettings && typeof NativeModules.DevSettings.reload === 'function') {
        NativeModules.DevSettings.reload();
        return;
      }

      // If all methods failed
      throw new Error('Failed to restart app: No restart method available');
    } catch (error) {
      console.error('Failed to restart app:', error);
      throw error;
    }
  }

  getCurrentVersion() {
    return this.appVersion;
  }

  getDeviceId() {
    return this.deviceId;
  }

  /**
   * Get device ID (async version that ensures it's initialized)
   */
  async getDeviceIdAsync() {
    return await this.ensureDeviceId();
  }

  /**
   * Reset device ID (generates a new one)
   * Useful for testing or if user wants to reset their device identity
   */
  async resetDeviceId() {
    try {
      const newDeviceId = this.generateDeviceId();
      await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, newDeviceId);
      this.deviceId = newDeviceId;
      console.log('ReactPush: Device ID reset to:', newDeviceId);
      return newDeviceId;
    } catch (error) {
      console.error('ReactPush: Failed to reset device ID:', error);
      throw error;
    }
  }

  /**
   * Report a crash/error
   */
  async reportCrash(error, options = {}) {
    return await this.crashReporter.reportCrash(error, options);
  }

  /**
   * Report a JavaScript error
   */
  async reportJavaScriptError(error, userInfo = null) {
    return await this.crashReporter.reportJavaScriptError(error, userInfo);
  }

  /**
   * Report a native error
   */
  async reportNativeError(error, userInfo = null) {
    return await this.crashReporter.reportNativeError(error, userInfo);
  }

  /**
   * Report a custom error
   */
  async reportCustomError(message, errorType = 'CustomError', stackTrace = null, userInfo = null) {
    return await this.crashReporter.reportCustomError(message, errorType, stackTrace, userInfo);
  }

  /**
   * Add a breadcrumb (event that happened before crash)
   */
  addBreadcrumb(message, data = {}) {
    this.crashReporter.addBreadcrumb(message, data);
  }

  /**
   * Get the crash reporter instance
   */
  getCrashReporter() {
    return this.crashReporter;
  }

  /**
   * Get the downloaded bundle URL/path
   * Returns the local file path of the downloaded bundle, or null if no bundle is downloaded
   * This can be used by native code to load the bundle
   * 
   * @returns {Promise<string|null>} The local file path of the downloaded bundle, or null
   */
  async getDownloadedBundleURL() {
    try {
      const bundlePath = await this.bundleManager.getStoredBundlePath();
      
      if (bundlePath) {
        // Verify the file still exists
        const exists = await RNFS.exists(bundlePath);
        if (exists) {
          return bundlePath;
        } else {
          // File doesn't exist, clear the stored path
          console.warn('ReactPush: Stored bundle path does not exist, clearing it');
          await this.bundleManager.clearStoredBundlePath();
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('ReactPush: Error getting downloaded bundle URL:', error);
      return null;
    }
  }

  /**
   * Get the downloaded bundle URL synchronously (from cache)
   * Note: This may return null if the bundle hasn't been loaded yet
   * 
   * @returns {string|null} The local file path of the downloaded bundle, or null
   */
  getDownloadedBundleURLSync() {
    // Try to get from AsyncStorage synchronously (not recommended, but available)
    // This is a fallback - prefer using getDownloadedBundleURL() async version
    try {
      // We can't access AsyncStorage synchronously, so return null
      // Native code should read from the file directly
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get bundle manager instance for advanced usage
   */
  getBundleManager() {
    return this.bundleManager;
  }
}

export default ReactPush;

