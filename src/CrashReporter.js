import { Platform, NativeModules } from 'react-native';

class CrashReporter {
  constructor(reactPush) {
    this.reactPush = reactPush;
    this.breadcrumbs = [];
    this.maxBreadcrumbs = 50;
    this.currentUpdateId = null;
    this.currentBundleVersion = null;
    this._deviceInfoCache = null;
  }

  /**
   * Set the current update ID and bundle version
   */
  setCurrentUpdate(updateId, bundleVersion) {
    this.currentUpdateId = updateId;
    this.currentBundleVersion = bundleVersion;
  }

  /**
   * Add a breadcrumb (event that happened before crash)
   */
  addBreadcrumb(message, data = {}) {
    const breadcrumb = {
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    
    this.breadcrumbs.push(breadcrumb);
    
    // Keep only the last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs() {
    this.breadcrumbs = [];
  }

  /**
   * Get device information including model, OS version, etc.
   */
  async getDeviceInfo() {
    // Return cached info if available
    if (this._deviceInfoCache) {
      return this._deviceInfoCache;
    }

    try {
      const deviceInfo = {
        platform: Platform.OS,
        osVersion: this.getOSVersion(),
        isTablet: Platform.isPad || Platform.isTV,
        systemName: Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS,
      };

      // Try to get device model
      try {
        deviceInfo.model = await this.getDeviceModel();
      } catch (e) {
        console.warn('Could not get device model:', e);
        deviceInfo.model = 'Unknown';
      }

      // Try to get device brand (Android)
      if (Platform.OS === 'android') {
        try {
          deviceInfo.brand = this.getDeviceBrandSync();
        } catch (e) {
          // Ignore
        }
      }

      // Try to get device name
      try {
        deviceInfo.deviceName = this.getDeviceNameSync();
      } catch (e) {
        // Ignore
      }

      // App version info
      deviceInfo.appVersion = this.reactPush.appVersion;
      deviceInfo.bundleVersion = this.currentBundleVersion || this.reactPush.appVersion;

      // Cache the device info
      this._deviceInfoCache = deviceInfo;

      return deviceInfo;
    } catch (error) {
      console.error('Failed to get device info:', error);
      return {
        platform: Platform.OS,
        osVersion: this.getOSVersion(),
        appVersion: this.reactPush.appVersion,
        bundleVersion: this.currentBundleVersion || this.reactPush.appVersion,
      };
    }
  }

  /**
   * Get OS version in a readable format
   */
  getOSVersion() {
    const version = Platform.Version;
    if (Platform.OS === 'ios') {
      // iOS version is a number like 15.0, convert to string
      if (typeof version === 'number') {
        const major = Math.floor(version);
        const minor = Math.floor((version - major) * 10);
        return `${major}.${minor}`;
      }
      return String(version);
    } else if (Platform.OS === 'android') {
      // Android version is a number like 30 (API level)
      // Try to map to Android version name
      const androidVersions = {
        30: '11.0', 29: '10.0', 28: '9.0', 27: '8.1', 26: '8.0',
        25: '7.1', 24: '7.0', 23: '6.0', 22: '5.1', 21: '5.0',
        33: '13.0', 32: '12.0', 31: '12.0', 34: '14.0'
      };
      return androidVersions[version] || `${version} (API ${version})`;
    }
    return String(version);
  }

  /**
   * Get device model (synchronous version)
   */
  getDeviceModelSync() {
    try {
      // Try react-native-device-info if available
      if (NativeModules.RNDeviceInfo) {
        return NativeModules.RNDeviceInfo.model || 'Unknown';
      }

      // Try Expo Constants if available
      if (NativeModules.ExponentConstants) {
        const constants = NativeModules.ExponentConstants;
        return constants.deviceName || constants.deviceModel || 'Unknown';
      }

      // Try to get from Platform constants (limited support)
      if (Platform.OS === 'ios') {
        // iOS doesn't expose model in Platform, try NativeModules
        if (NativeModules.PlatformConstants) {
          return NativeModules.PlatformConstants.model || 'Unknown';
        }
        // Fallback: try to detect from screen dimensions (very basic)
        const { Dimensions } = require('react-native');
        const { width, height } = Dimensions.get('window');
        return `iOS Device (${width}x${height})`;
      } else if (Platform.OS === 'android') {
        // Android: try to get from Build
        if (NativeModules.PlatformConstants) {
          return NativeModules.PlatformConstants.Model || 
                 NativeModules.PlatformConstants.Brand || 
                 'Unknown Android Device';
        }
        return 'Unknown Android Device';
      }

      return 'Unknown Device';
    } catch (error) {
      console.warn('Failed to get device model:', error);
      return 'Unknown';
    }
  }

  /**
   * Get device brand (Android) - synchronous version
   */
  getDeviceBrandSync() {
    try {
      if (Platform.OS === 'android') {
        if (NativeModules.RNDeviceInfo) {
          return NativeModules.RNDeviceInfo.brand || null;
        }
        if (NativeModules.PlatformConstants) {
          return NativeModules.PlatformConstants.Brand || null;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get device name - synchronous version
   */
  getDeviceNameSync() {
    try {
      if (NativeModules.RNDeviceInfo) {
        return NativeModules.RNDeviceInfo.deviceName || null;
      }
      if (NativeModules.ExponentConstants) {
        return NativeModules.ExponentConstants.deviceName || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Report a crash/error to the server
   */
  async reportCrash(error, options = {}) {
    try {
      await this.reactPush.ensureDeviceId();
      
      const deviceInfo = await this.getDeviceInfo();
      
      const crashReport = {
        updateId: options.updateId || this.currentUpdateId || null,
        deviceId: this.reactPush.deviceId,
        platform: Platform.OS,
        appVersion: deviceInfo.appVersion || this.reactPush.appVersion,
        bundleVersion: options.bundleVersion || deviceInfo.bundleVersion || this.currentBundleVersion || this.reactPush.appVersion,
        errorType: options.errorType || this.getErrorType(error),
        errorMessage: options.errorMessage || this.getErrorMessage(error),
        stackTrace: options.stackTrace || this.getStackTrace(error),
        deviceInfo: JSON.stringify(deviceInfo),
        userInfo: options.userInfo ? JSON.stringify(options.userInfo) : null,
        breadcrumbs: this.breadcrumbs.length > 0 ? JSON.stringify(this.breadcrumbs) : null,
        severity: options.severity || 'error',
        occurredAt: options.occurredAt || new Date().toISOString(),
      };

      const response = await fetch(`${this.reactPush.apiUrl}/api/crash-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.reactPush.apiKey,
        },
        body: JSON.stringify(crashReport),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to report crash:', response.status, errorText);
        return false;
      }

      const result = await response.json();
      console.log('Crash reported successfully:', result.id);
      
      // Clear breadcrumbs after successful report
      this.clearBreadcrumbs();
      
      return true;
    } catch (error) {
      console.error('Error reporting crash:', error);
      return false;
    }
  }

  /**
   * Report a JavaScript error
   */
  async reportJavaScriptError(error, userInfo = null) {
    return await this.reportCrash(error, {
      errorType: 'JavaScriptError',
      userInfo,
    });
  }

  /**
   * Report a native error
   */
  async reportNativeError(error, userInfo = null) {
    return await this.reportCrash(error, {
      errorType: 'NativeError',
      userInfo,
    });
  }

  /**
   * Report a custom error
   */
  async reportCustomError(message, errorType = 'CustomError', stackTrace = null, userInfo = null) {
    const error = new Error(message);
    if (stackTrace) {
      error.stack = stackTrace;
    }
    
    return await this.reportCrash(error, {
      errorType,
      stackTrace: stackTrace || error.stack,
      userInfo,
    });
  }

  /**
   * Get error type from error object
   */
  getErrorType(error) {
    if (error instanceof TypeError) return 'TypeError';
    if (error instanceof ReferenceError) return 'ReferenceError';
    if (error instanceof SyntaxError) return 'SyntaxError';
    if (error instanceof RangeError) return 'RangeError';
    if (error instanceof EvalError) return 'EvalError';
    if (error.name) return error.name;
    return 'Error';
  }

  /**
   * Get error message from error object
   */
  getErrorMessage(error) {
    if (error && error.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error';
  }

  /**
   * Get stack trace from error object
   */
  getStackTrace(error) {
    if (error && error.stack) {
      return error.stack;
    }
    if (error && error.componentStack) {
      return error.componentStack;
    }
    return null;
  }

  /**
   * Set up global error handlers
   */
  setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    const originalHandler = global.ErrorUtils?.getGlobalHandler?.();
    
    if (global.ErrorUtils) {
      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        // Report the error
        this.reportJavaScriptError(error).catch(err => {
          console.error('Failed to report error:', err);
        });
        
        // Call original handler if it exists
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    // Handle unhandled promise rejections
    if (typeof global !== 'undefined') {
      const originalUnhandledRejection = global.onunhandledrejection;
      global.onunhandledrejection = (event) => {
        const error = event.reason || new Error('Unhandled Promise Rejection');
        this.reportJavaScriptError(error).catch(err => {
          console.error('Failed to report unhandled rejection:', err);
        });
        
        if (originalUnhandledRejection) {
          originalUnhandledRejection(event);
        }
      };
    }
  }
}

export default CrashReporter;

