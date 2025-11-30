package com.reactpush;

import android.content.Context;
import android.util.Log;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * ReactPush Native Module for Android
 * 
 * This class provides static methods that can be called directly from Java/Kotlin code
 * to get the downloaded bundle path without going through the React Native bridge.
 */
public class ReactPush {
    private static final String TAG = "ReactPush";
    private static final String BUNDLE_PATH_FILE = "ReactPushBundlePath.txt";
    private static final String BUNDLE_DIRECTORY = "ReactPushBundles";

    /**
     * Get the downloaded JavaScript bundle path
     * 
     * This method reads the bundle path from ReactPushBundlePath.txt and returns it as a String.
     * If no downloaded bundle is found, returns the default bundle name.
     * 
     * @param context The application context
     * @param defaultBundleName The default bundle name (e.g., "index.android.bundle")
     * @return String path of the downloaded bundle, or the default bundle name if not found
     */
    public static String getJsBundlePath(Context context, String defaultBundleName) {
        try {
            File bundlePathFile = new File(context.getFilesDir(), BUNDLE_PATH_FILE);
            
            if (bundlePathFile.exists()) {
                FileInputStream fis = new FileInputStream(bundlePathFile);
                byte[] data = new byte[(int) bundlePathFile.length()];
                fis.read(data);
                fis.close();
                
                String bundlePath = new String(data, StandardCharsets.UTF_8).trim();
                
                if (!bundlePath.isEmpty()) {
                    File bundleFile = new File(bundlePath);
                    if (bundleFile.exists()) {
                        return bundlePath;
                    } else {
                        Log.w(TAG, "Bundle file not found at path: " + bundlePath);
                    }
                }
            }
        } catch (IOException e) {
            Log.e(TAG, "Error reading bundle path file: " + e.getMessage());
        }
        
        // Fall back to default bundle name
        return defaultBundleName;
    }

    /**
     * Get the downloaded JavaScript bundle path (legacy method, returns null if not found)
     * 
     * @param context The application context
     * @return String path of the downloaded bundle, or null if not found
     */
    public static String getJsBundlePath(Context context) {
        try {
            File bundlePathFile = new File(context.getFilesDir(), BUNDLE_PATH_FILE);
            
            if (!bundlePathFile.exists()) {
                return null;
            }
            
            // Read the bundle path from the file
            FileInputStream fis = new FileInputStream(bundlePathFile);
            byte[] data = new byte[(int) bundlePathFile.length()];
            fis.read(data);
            fis.close();
            
            String bundlePath = new String(data, StandardCharsets.UTF_8).trim();
            
            if (bundlePath.isEmpty()) {
                return null;
            }
            
            // Check if the bundle file actually exists
            File bundleFile = new File(bundlePath);
            if (bundleFile.exists()) {
                return bundlePath;
            } else {
                Log.w(TAG, "Bundle file not found at path: " + bundlePath);
            }
        } catch (IOException e) {
            Log.e(TAG, "Error reading bundle path file: " + e.getMessage());
        }
        
        return null;
    }

    /**
     * Check if a downloaded bundle exists
     * 
     * @param context The application context
     * @return true if a downloaded bundle exists, false otherwise
     */
    public static boolean hasDownloadedBundle(Context context) {
        return getJsBundlePath(context) != null;
    }

    /**
     * Get the bundle directory path where all bundles are stored
     * 
     * @param context The application context
     * @return String path of the bundle directory
     */
    public static String getBundleDirectory(Context context) {
        return new File(context.getFilesDir(), BUNDLE_DIRECTORY).getAbsolutePath();
    }

    /**
     * Get the bundle path file location
     * 
     * @param context The application context
     * @return String path of the ReactPushBundlePath.txt file
     */
    public static String getBundlePathFile(Context context) {
        return new File(context.getFilesDir(), BUNDLE_PATH_FILE).getAbsolutePath();
    }
}

