package com.WahegurooNetwork.SundarGutka

import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

// Launches another app's own launcher activity directly when it's installed,
// instead of routing through a market:// Play Store listing (which only ever
// opens the store page, never the target app itself). The target package must
// also be listed in AndroidManifest.xml's <queries> block, or Android 11+
// package-visibility rules make getLaunchIntentForPackage() return null for
// it unconditionally.
class AppLauncherModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "AppLauncher"

  @ReactMethod
  fun openApp(packageName: String, promise: Promise) {
    val launchIntent = reactApplicationContext.packageManager.getLaunchIntentForPackage(packageName)
    if (launchIntent == null) {
      promise.resolve(false)
      return
    }
    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    reactApplicationContext.startActivity(launchIntent)
    promise.resolve(true)
  }

  /**
   * Opens an https URL in the app that owns it — Instagram for an Instagram
   * profile, YouTube for a channel — and resolves true. Resolves false, having
   * opened nothing, when only a browser would take it; the JS side then shows
   * the link in the in-app browser instead of leaving the app for Chrome.
   *
   * Android 11+: FLAG_ACTIVITY_REQUIRE_NON_BROWSER makes the system refuse the
   * intent (ActivityNotFoundException) when the only handlers are browsers, so
   * no package list has to be maintained here. Below 11 the flag does not
   * exist; the handlers are queried directly and browsers are recognised as the
   * apps that also accept a generic http:// link, which no single-service app
   * does.
   */
  @ReactMethod
  fun openUrlInApp(url: String, promise: Promise) {
    try {
      val intent =
          Intent(Intent.ACTION_VIEW, Uri.parse(url))
              .addCategory(Intent.CATEGORY_BROWSABLE)
              .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        intent.addFlags(Intent.FLAG_ACTIVITY_REQUIRE_NON_BROWSER)
        try {
          reactApplicationContext.startActivity(intent)
          promise.resolve(true)
        } catch (e: ActivityNotFoundException) {
          promise.resolve(false)
        }
        return
      }

      val pm = reactApplicationContext.packageManager
      val browsers =
          pm.queryIntentActivities(
                  Intent(Intent.ACTION_VIEW, Uri.parse("http://example.com"))
                      .addCategory(Intent.CATEGORY_BROWSABLE),
                  PackageManager.MATCH_DEFAULT_ONLY)
              .map { it.activityInfo.packageName }
              .toSet()
      val handler =
          pm.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY)
              .firstOrNull { it.activityInfo.packageName !in browsers }
      if (handler == null) {
        promise.resolve(false)
        return
      }
      intent.setPackage(handler.activityInfo.packageName)
      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }
}
