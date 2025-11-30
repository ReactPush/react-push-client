package com.exampleapp

import android.app.Application
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.flipper.ReactNativeFlipper
import com.facebook.soloader.SoLoader
// ReactPush is imported from the react-push-client package via Gradle sourceSets (no files needed in example project)
import com.reactpush.ReactPush

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // packages.add(new MyReactNativePackage());
          return PackageList(this).packages
        }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override fun getJSBundleFile(): String? {
          // In debug mode, always use Metro bundler
          if (BuildConfig.DEBUG) {
            return super.getJSBundleFile()
          }
          
          // Use ReactPush native class - automatically falls back to default bundle if not found
          val defaultBundleName = super.getJSBundleFile() ?: "index.android.bundle"
          val bundlePath = ReactPush.getJsBundlePath(applicationContext, defaultBundleName)
          if (bundlePath != defaultBundleName) {
            Log.d("ReactPush", "Loading downloaded bundle from: $bundlePath")
            return bundlePath
          }
          
          // Return default bundle (will be handled by React Native)
          return defaultBundleName
        }

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(this.applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
    ReactNativeFlipper.initializeFlipper(this, reactNativeHost.reactInstanceManager)
  }

}
