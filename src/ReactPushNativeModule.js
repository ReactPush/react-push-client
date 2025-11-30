/**
 * ReactPush Native Module
 * 
 * This module provides native code access to ReactPush functionality.
 * It can be used from iOS (Objective-C/Swift) and Android (Java/Kotlin) code.
 * 
 * Usage:
 * - Import this module in your native code
 * - Call getDownloadedBundleURL() to get the path to the downloaded bundle
 */

import { NativeModules, Platform } from 'react-native';
import RNFS from 'react-native-fs';

const { ReactPushNativeModule } = NativeModules;

class ReactPushNativeModuleHelper {
  /**
   * Get the downloaded bundle URL/path
   * This method reads the bundle path from the file system
   * and returns it as a string that native code can use
   * 
   * @returns {Promise<string|null>} The local file path of the downloaded bundle, or null
   */
  static async getDownloadedBundleURL() {
    try {
      const bundlePathFile = `${RNFS.DocumentDirectoryPath}/ReactPushBundlePath.txt`;
      
      // Check if the bundle path file exists
      const fileExists = await RNFS.exists(bundlePathFile);
      if (!fileExists) {
        return null;
      }
      
      // Read the bundle path from the file
      const bundlePath = await RNFS.readFile(bundlePathFile, 'utf8');
      
      if (!bundlePath || bundlePath.trim().length === 0) {
        return null;
      }
      
      const trimmedPath = bundlePath.trim();
      
      // Verify the bundle file actually exists
      const bundleExists = await RNFS.exists(trimmedPath);
      if (!bundleExists) {
        console.warn('ReactPush: Bundle file not found at path:', trimmedPath);
        return null;
      }
      
      return trimmedPath;
    } catch (error) {
      console.error('ReactPush: Error reading bundle path:', error);
      return null;
    }
  }

  /**
   * Get the bundle directory path
   * This is where all downloaded bundles are stored
   * 
   * @returns {string} The bundle directory path
   */
  static getBundleDirectory() {
    return `${RNFS.DocumentDirectoryPath}/ReactPushBundles`;
  }

  /**
   * Get the bundle path file location
   * This is the file that stores the current bundle path
   * 
   * @returns {string} The bundle path file location
   */
  static getBundlePathFile() {
    return `${RNFS.DocumentDirectoryPath}/ReactPushBundlePath.txt`;
  }

  /**
   * Check if a downloaded bundle exists
   * 
   * @returns {Promise<boolean>} True if a downloaded bundle exists, false otherwise
   */
  static async hasDownloadedBundle() {
    const bundlePath = await this.getDownloadedBundleURL();
    return bundlePath !== null;
  }
}

export default ReactPushNativeModuleHelper;

