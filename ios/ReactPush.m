//
// ReactPush.m
// ReactPush Native Module for iOS
//

#import "ReactPush.h"

@implementation ReactPush

+ (NSURL *)getJsBundleURL:(NSString *)resourceName withExtension:(NSString *)extension {
    NSString *bundlePath = [self getJsBundlePath];
    if (bundlePath != nil) {
        return [NSURL fileURLWithPath:bundlePath];
    }
    // Fall back to default bundle from main bundle
    return [[NSBundle mainBundle] URLForResource:resourceName withExtension:extension];
}

+ (nullable NSString *)getJsBundlePath {
    // Get the Documents directory path
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    if (paths.count == 0) {
        NSLog(@"ReactPush: Could not find Documents directory");
        return nil;
    }
    
    NSString *documentsDirectory = [paths objectAtIndex:0];
    NSString *bundlePathFile = [documentsDirectory stringByAppendingPathComponent:@"ReactPushBundlePath.txt"];
    
    // Check if the bundle path file exists
    NSFileManager *fileManager = [NSFileManager defaultManager];
    if (![fileManager fileExistsAtPath:bundlePathFile]) {
        return nil;
    }
    
    // Read the bundle path from the file
    NSError *error = nil;
    NSString *bundlePath = [NSString stringWithContentsOfFile:bundlePathFile encoding:NSUTF8StringEncoding error:&error];
    
    if (error != nil) {
        NSLog(@"ReactPush: Error reading bundle path file: %@", error.localizedDescription);
        return nil;
    }
    
    if (bundlePath == nil || bundlePath.length == 0) {
        return nil;
    }
    
    // Remove any whitespace/newlines
    bundlePath = [bundlePath stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    
    // Check if the bundle file actually exists
    if (![fileManager fileExistsAtPath:bundlePath]) {
        NSLog(@"ReactPush: Bundle file not found at path: %@", bundlePath);
        return nil;
    }
    
    return bundlePath;
}

+ (BOOL)hasDownloadedBundle {
    return [self getJsBundlePath] != nil;
}

+ (NSString *)getBundleDirectory {
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    if (paths.count == 0) {
        return @"";
    }
    NSString *documentsDirectory = [paths objectAtIndex:0];
    return [documentsDirectory stringByAppendingPathComponent:@"ReactPushBundles"];
}

+ (NSString *)getBundlePathFile {
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    if (paths.count == 0) {
        return @"";
    }
    NSString *documentsDirectory = [paths objectAtIndex:0];
    return [documentsDirectory stringByAppendingPathComponent:@"ReactPushBundlePath.txt"];
}

@end

