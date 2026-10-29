package com.WahegurooNetwork.SundarGutka

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.google.firebase.crashlytics.FirebaseCrashlytics
 
class MainApplication : Application(), ReactApplication {
 
  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
              add(AppLauncherPackage())
            }
 
        override fun getJSMainModuleName(): String = "index"
 
        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
 
        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }
 
  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)
 
  override fun onCreate() {
    super.onCreate()
    // The background downloader used to crash when its download service bound
    // with a cross-process binder. It now reports that instead, and the report
    // has to reach Crashlytics to be of any use: it carries the process and
    // device the bind happened on, which is what the cause is still missing.
    com.eko.Downloader.bindFailureReporter = { failure ->
      FirebaseCrashlytics.getInstance().recordException(failure)
    }
    // Let SoLoader rebuild a native library that has gone missing, instead of
    // dying on the spot.
    //
    // The app extracts its .so files at install time (useLegacyPackaging, see
    // app/build.gradle), so SoLoader loads them from the directory the installer
    // wrote and keeps its own unpacked copy under lib-main as a fallback. When a
    // library is absent from both — an interrupted install, an update that moved
    // the app, a copy of the APK with the libraries stripped out — the load
    // throws and the app cannot start at all. That is the startup crash
    // Crashlytics reports as "couldn't find DSO to load: libreactnative.so".
    //
    // SoLoader ships a recovery for exactly this: re-unpack the library from the
    // APK and retry. It is off unless asked for — see ReunpackBackupSoSources,
    // which ignores a DSO-not-found error without this flag. It runs only after
    // a load has already failed, so a healthy install never reaches it.
    //
    // Two calls, because the flags and React Native's merged-library mapping
    // cannot be passed together: the mapping overload always initialises with no
    // flags. Flags first, so initialisation carries them; the mapping second,
    // which stores it and returns early since SoLoader is already initialised —
    // the mapping is only read when a library is loaded, which is after both.
    // The manifest's soloader.enabled override belongs with this: without it the
    // first call finds React Native's `false` and switches SoLoader off.
    SoLoader.init(this, SoLoader.SOLOADER_ENABLE_BACKUP_SOSOURCE_DSONOTFOUND_ERROR_RECOVERY)
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
  }
}