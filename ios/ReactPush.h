//
// ReactPush.h
// ReactPush Native Module for iOS
//
// This header provides a native iOS class that can be called directly from Objective-C/Swift code
// to get the downloaded bundle URL without going through the React Native bridge.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface ReactPush : NSObject

/**
 * Get the downloaded JavaScript bundle URL
 * 
 * This method reads the bundle path from ReactPushBundlePath.txt and returns it as an NSURL.
 * If no downloaded bundle is found, returns the default bundle from the main bundle.
 * 
 * @param resourceName The resource name (e.g., @"main")
 * @param extension The file extension (e.g., @"jsbundle")
 * @return NSURL of the downloaded bundle, or the default bundle if not found
 */
+ (NSURL *)getJsBundleURL:(NSString *)resourceName withExtension:(NSString *)extension;

/**
 * Get the downloaded JavaScript bundle path as a string
 * 
 * @return NSString path of the downloaded bundle, or nil if not found
 */
+ (nullable NSString *)getJsBundlePath;

/**
 * Check if a downloaded bundle exists
 * 
 * @return YES if a downloaded bundle exists, NO otherwise
 */
+ (BOOL)hasDownloadedBundle;

/**
 * Get the bundle directory path where all bundles are stored
 * 
 * @return NSString path of the bundle directory
 */
+ (NSString *)getBundleDirectory;

/**
 * Get the bundle path file location
 * 
 * @return NSString path of the ReactPushBundlePath.txt file
 */
+ (NSString *)getBundlePathFile;

@end

NS_ASSUME_NONNULL_END

