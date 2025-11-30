import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class BundleManager {
  constructor(reactPush) {
    this.reactPush = reactPush;
    this.bundleDirectory = `${RNFS.DocumentDirectoryPath}/ReactPushBundles`;
    this.bundlePathFile = `${RNFS.DocumentDirectoryPath}/ReactPushBundlePath.txt`;
  }

  async ensureDirectory() {
    const exists = await RNFS.exists(this.bundleDirectory);
    if (!exists) {
      await RNFS.mkdir(this.bundleDirectory);
    }
  }

  async downloadBundle(update) {
    await this.ensureDirectory();
    
    // Check if we have a zip file (preferred) or separate bundle/assets URLs
    if (update.zipUrl) {
      return await this.downloadAndExtractZip(update);
    } else if (update.bundleUrl) {
      return await this.downloadSeparateBundle(update);
    } else {
      throw new Error('Neither ZipUrl nor BundleUrl is provided in update');
    }
  }

  async downloadAndExtractZip(update) {
    if (!update.zipUrl) {
      throw new Error('ZipUrl is missing in update');
    }

    const versionDir = `${this.bundleDirectory}/version_${update.version}_${Date.now()}`;
    await RNFS.mkdir(versionDir);

    const zipPath = `${versionDir}/update.zip`;
    const extractedPath = `${versionDir}/extracted`;

    console.log(`Downloading zip from: ${update.zipUrl}`);
    console.log(`Saving to: ${zipPath}`);

    try {
      // Download zip file
      const downloadResult = await RNFS.downloadFile({
        fromUrl: update.zipUrl,
        toFile: zipPath,
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          console.log(`Download progress: ${progress.toFixed(2)}%`);
        },
      }).promise;

      if (downloadResult.statusCode !== 200) {
        throw new Error(`Failed to download zip: HTTP ${downloadResult.statusCode}. URL: ${update.zipUrl}`);
      }

      console.log(`Zip downloaded successfully: ${zipPath}`);

      // Extract zip file
      await this.extractZip(zipPath, extractedPath);

      // Remove zip file after extraction
      await RNFS.unlink(zipPath);

      // Find bundle.js in extracted directory
      const bundlePath = await this.findBundleInExtracted(extractedPath);
      
      if (!bundlePath) {
        throw new Error('bundle.js not found in extracted zip file');
      }

      console.log(`Bundle found at: ${bundlePath}`);

      // Find assets directory
      const assetsPath = `${extractedPath}/assets`;
      const assetsExist = await RNFS.exists(assetsPath);
      if (assetsExist) {
        console.log(`Assets found at: ${assetsPath}`);
      }

      // Store the bundle path so native code can load it on next app start
      await this.storeBundlePath(bundlePath, update.version);

      return bundlePath;
    } catch (error) {
      console.error('Zip download/extraction error:', error);
      // Clean up on error
      try {
        if (await RNFS.exists(versionDir)) {
          await RNFS.unlink(versionDir);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      if (error.message && error.message.includes('404')) {
        throw new Error(`Zip not found (404). Please check that the zip URL is correct: ${update.zipUrl}`);
      }
      throw new Error(`Failed to download/extract zip: ${error.message || error}. URL: ${update.zipUrl}`);
    }
  }

  async downloadSeparateBundle(update) {
    if (!update.bundleUrl) {
      throw new Error('BundleUrl is missing in update');
    }
    
    const bundleFileName = `bundle_${update.version}_${Date.now()}.js`;
    const bundlePath = `${this.bundleDirectory}/${bundleFileName}`;

    console.log(`Downloading bundle from: ${update.bundleUrl}`);
    console.log(`Saving to: ${bundlePath}`);

    // Download bundle.js
    try {
      const downloadResult = await RNFS.downloadFile({
        fromUrl: update.bundleUrl,
        toFile: bundlePath,
        progress: (res) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          console.log(`Download progress: ${progress.toFixed(2)}%`);
        },
      }).promise;

      if (downloadResult.statusCode !== 200) {
        throw new Error(`Failed to download bundle: HTTP ${downloadResult.statusCode}. URL: ${update.bundleUrl}`);
      }

      console.log(`Bundle downloaded successfully: ${bundlePath}`);
      
      // Store the bundle path so native code can load it on next app start
      await this.storeBundlePath(bundlePath, update.version);
    } catch (error) {
      console.error('Bundle download error:', error);
      if (error.message && error.message.includes('404')) {
        throw new Error(`Bundle not found (404). Please check that the bundle URL is correct: ${update.bundleUrl}`);
      }
      throw new Error(`Failed to download bundle: ${error.message || error}. URL: ${update.bundleUrl}`);
    }

    // Download assets if available
    if (update.assetsUrl) {
      await this.downloadAssets(update.assetsUrl, update.version);
    }

    return bundlePath;
  }

  async extractZip(zipPath, extractPath) {
    // This will need a zip extraction library
    // For iOS/Android, we can use react-native-zip-archive or similar
    // For now, we'll use a native module approach
    
    try {
      // Try to use react-native-zip-archive if available
      const ZipArchive = require('react-native-zip-archive');
      await ZipArchive.unzip(zipPath, extractPath);
      console.log(`Zip extracted to: ${extractPath}`);
    } catch (error) {
      // If react-native-zip-archive is not available, try native module
      // For iOS, we can use SSZipArchive via native module
      // For Android, we can use ZipInputStream via native module
      throw new Error(
        'Zip extraction failed. Please install react-native-zip-archive:\n' +
        '  npm install react-native-zip-archive\n' +
        '  cd ios && pod install'
      );
    }
  }

  async findBundleInExtracted(extractedPath) {
    // Look for bundle.js in the extracted directory
    const files = await RNFS.readdir(extractedPath);
    
    // Check root level
    if (files.includes('bundle.js')) {
      return `${extractedPath}/bundle.js`;
    }
    
    // Check if there's a subdirectory
    for (const file of files) {
      const fullPath = `${extractedPath}/${file}`;
      const stat = await RNFS.stat(fullPath);
      
      if (stat.isDirectory()) {
        const subFiles = await RNFS.readdir(fullPath);
        if (subFiles.includes('bundle.js')) {
          return `${fullPath}/bundle.js`;
        }
      }
    }
    
    return null;
  }

  async downloadAssets(assetsUrl, version) {
    const assetsDirectory = `${this.bundleDirectory}/assets_${version}`;
    await RNFS.mkdir(assetsDirectory);

    // In a real implementation, you would:
    // 1. Fetch the assets manifest from assetsUrl
    // 2. Download each asset file
    // 3. Store them in the assets directory
    
    // For now, this is a placeholder
    console.log(`Assets download for version ${version} would be implemented here`);
  }

  async getLocalBundlePath(version) {
    const files = await RNFS.readdir(this.bundleDirectory);
    const bundleFile = files.find(file => file.includes(version));
    
    if (bundleFile) {
      return `${this.bundleDirectory}/${bundleFile}`;
    }
    
    return null;
  }

  async clearOldBundles(keepVersion) {
    try {
      const files = await RNFS.readdir(this.bundleDirectory);
      
      for (const file of files) {
        if (!file.includes(keepVersion)) {
          await RNFS.unlink(`${this.bundleDirectory}/${file}`);
        }
      }
    } catch (error) {
      console.error('Error clearing old bundles:', error);
    }
  }

  /**
   * Store the bundle path so native code can load it on app start
   */
  async storeBundlePath(bundlePath, version) {
    try {
      // Store in AsyncStorage for JS access
      await AsyncStorage.setItem('@ReactPush:currentBundlePath', bundlePath);
      await AsyncStorage.setItem('@ReactPush:currentBundleVersion', version);
      
      // Also write to a file that native code can easily read
      await RNFS.writeFile(this.bundlePathFile, bundlePath, 'utf8');
      
      console.log(`Stored bundle path: ${bundlePath} for version ${version}`);
    } catch (error) {
      console.error('Error storing bundle path:', error);
      // Don't throw - this is not critical for the download to succeed
    }
  }

  /**
   * Get the currently stored bundle path
   */
  async getStoredBundlePath() {
    try {
      const path = await AsyncStorage.getItem('@ReactPush:currentBundlePath');
      return path;
    } catch (error) {
      console.error('Error getting stored bundle path:', error);
      return null;
    }
  }

  /**
   * Clear the stored bundle path (revert to default bundle)
   */
  async clearStoredBundlePath() {
    try {
      await AsyncStorage.removeItem('@ReactPush:currentBundlePath');
      await AsyncStorage.removeItem('@ReactPush:currentBundleVersion');
      
      if (await RNFS.exists(this.bundlePathFile)) {
        await RNFS.unlink(this.bundlePathFile);
      }
      
      console.log('Cleared stored bundle path');
    } catch (error) {
      console.error('Error clearing stored bundle path:', error);
    }
  }
}

export default BundleManager;

