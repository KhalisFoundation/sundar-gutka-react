package com.WahegurooNetwork.SundarGutka

import android.os.Build
import android.webkit.WebView
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

/**
 * Answers "can a WebView be created on this phone right now?" so the JS side
 * can decide not to mount one.
 *
 * Android renders every WebView through a separate, updatable provider
 * package (Android System WebView, or Chrome on Android 7). When that package
 * is disabled, uninstalled, or half-way through an update, constructing a
 * WebView throws MissingWebViewPackageException from inside View's own
 * constructor — before any JavaScript error boundary can see it — and the
 * process dies. The Reader is a WebView, so on such a phone opening any bani
 * was a guaranteed crash.
 *
 * The probe is the real thing: it constructs a WebView and reports whether that
 * threw. On Android 8+ the provider package is checked first, which is free
 * and catches the common case without touching the WebView machinery at all.
 * A "yes" is remembered for the life of the process, since a provider does not
 * vanish from under a running app; a "no" is not, so that the user installing
 * or enabling the provider and coming back is seen on the next check.
 */
class WebViewAvailabilityModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "WebViewAvailability"

  @ReactMethod
  fun isAvailable(promise: Promise) {
    if (knownAvailable) {
      promise.resolve(true)
      return
    }
    // A WebView may only be constructed on the UI thread.
    UiThreadUtil.runOnUiThread {
      val available = probe()
      if (available) knownAvailable = true
      promise.resolve(available)
    }
  }

  private fun probe(): Boolean {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
        WebView.getCurrentWebViewPackage() == null) {
      return false
    }
    return try {
      // Constructed and destroyed at once; this is exactly the call that
      // crashes when the provider is missing, so it is the honest test on
      // every API level, including 7.x where the package query does not exist.
      WebView(reactApplicationContext).destroy()
      true
    } catch (t: Throwable) {
      false
    }
  }

  private companion object {
    @Volatile var knownAvailable = false
  }
}
