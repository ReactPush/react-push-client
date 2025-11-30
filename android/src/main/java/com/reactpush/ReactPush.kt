package com.reactpush

import android.content.Context
import android.util.Log
import java.io.File

/**
 * ReactPush Native Module for Android (Kotlin)
 * 
 * This object provides static methods that can be called directly from Java/Kotlin code
 * to get the downloaded bundle path without going through the React Native bridge.
 */
object ReactPush {
    private const val TAG = "ReactPush"
    private const val BUNDLE_PATH_FILE = "ReactPushBundlePath.txt"
    private const val BUNDLE_DIRECTORY = "ReactPushBundles"

    /**
     * Get the downloaded JavaScript bundle path
     * 
     * This method reads the bundle path from ReactPushBundlePath.txt and returns it as a String.
     * If no downloaded bundle is found, returns the default bundle path from assets.
     * 
     * @param context The application context
     * @param defaultBundleName The default bundle name (e.g., "index.android.bundle")
     * @return String path of the downloaded bundle, or the default bundle path if not found
     */
    @JvmStatic
    fun getJsBundlePath(context: Context, defaultBundleName: String): String {
        try {
            val bundlePathFile = File(context.filesDir, BUNDLE_PATH_FILE)
            
            if (bundlePathFile.exists()) {
                val bundlePath = bundlePathFile.readText(Charsets.UTF_8).trim()
                
                if (bundlePath.isNotEmpty()) {
                    val bundleFile = File(bundlePath)
                    if (bundleFile.exists()) {
                        return bundlePath
                    } else {
                        Log.w(TAG, "Bundle file not found at path: $bundlePath")
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error reading bundle path file: ${e.message}")
        }
        
        // Fall back to default bundle from assets
        // Return null to use default behavior, or return the asset path
        // The caller should handle the default bundle loading
        return defaultBundleName
    }

    /**
     * Get the downloaded JavaScript bundle path (legacy method, returns null if not found)
     * 
     * @param context The application context
     * @return String path of the downloaded bundle, or null if not found
     */
    @JvmStatic
    fun getJsBundlePath(context: Context): String? {
        try {
            val bundlePathFile = File(context.filesDir, BUNDLE_PATH_FILE)
            
            if (!bundlePathFile.exists()) {
                return null
            }
            
            val bundlePath = bundlePathFile.readText(Charsets.UTF_8).trim()
            
            if (bundlePath.isEmpty()) {
                return null
            }
            
            val bundleFile = File(bundlePath)
            if (bundleFile.exists()) {
                return bundlePath
            } else {
                Log.w(TAG, "Bundle file not found at path: $bundlePath")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error reading bundle path file: ${e.message}")
        }
        
        return null
    }

    /**
     * Check if a downloaded bundle exists
     * 
     * @param context The application context
     * @return true if a downloaded bundle exists, false otherwise
     */
    @JvmStatic
    fun hasDownloadedBundle(context: Context): Boolean {
        return getJsBundlePath(context) != null
    }

    /**
     * Get the bundle directory path where all bundles are stored
     * 
     * @param context The application context
     * @return String path of the bundle directory
     */
    @JvmStatic
    fun getBundleDirectory(context: Context): String {
        return File(context.filesDir, BUNDLE_DIRECTORY).absolutePath
    }

    /**
     * Get the bundle path file location
     * 
     * @param context The application context
     * @return String path of the ReactPushBundlePath.txt file
     */
    @JvmStatic
    fun getBundlePathFile(context: Context): String {
        return File(context.filesDir, BUNDLE_PATH_FILE).absolutePath
    }
}

