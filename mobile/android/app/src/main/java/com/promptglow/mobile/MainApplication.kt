package com.promptglow.mobile

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.facebook.react.soloader.OpenSourceMergedSoMapping

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> =
        PackageList(this).packages

      override fun getJSMainModuleName(): String = "index"

      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      // Explicitly disable New Architecture
      override val isNewArchEnabled: Boolean = false
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

  // reactHost is only used in New Architecture mode - null for Old Arch
  override val reactHost: ReactHost? = null

  override fun onCreate() {
    super.onCreate()
    // RN 0.81 requires OpenSourceMergedSoMapping for proper .so library resolution
    // This replaces the old SoLoader.init(this, false) pattern
    SoLoader.init(this, OpenSourceMergedSoMapping)
    // Do NOT call DefaultNewArchitectureEntryPoint.load() - we are in Old Arch mode
  }
}
