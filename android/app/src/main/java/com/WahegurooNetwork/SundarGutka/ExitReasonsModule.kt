package com.WahegurooNetwork.SundarGutka

import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Reports why the previous process died, as the system recorded it.
 *
 * Crashlytics can only describe a death it was alive to witness. When Android's
 * Low Memory Killer reclaims the app there is no crash and no report at all, so
 * a phone that keeps losing the app looks identical to one that never opened
 * it. That blind spot is the reason a cluster of SIGSEGVs inside libart.so and
 * libart-compiler.so — every one of them on Android 11, on a 2-4GB device, in
 * the Reader, with under 150MB free — cannot be told apart from the app
 * genuinely corrupting memory. The two have opposite fixes.
 *
 * getHistoricalProcessExitReasons answers it directly, and arrived in API 30,
 * which is Android 11: exactly the population that crashes. Each record carries
 * the system's own verdict (REASON_LOW_MEMORY when the LMK took it,
 * REASON_CRASH_NATIVE when it segfaulted) and the process's real footprint at
 * the moment it died. On Android 12 and later a native crash also carries its
 * tombstone, which is read into the record (see ExitInfoReader).
 *
 * This class must never mention ApplicationExitInfo, not even in a private
 * method: see ExitInfoReader for why that breaks Android 9 and 10. Below API 30
 * it resolves empty, so callers need no version branch of their own.
 */
class ExitReasonsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "ExitReasons"

  @ReactMethod
  fun getRecentExits(limit: Int, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      promise.resolve(Arguments.createArray())
      return
    }
    try {
      promise.resolve(ExitInfoReader.read(reactApplicationContext, limit.coerceIn(1, 30)))
    } catch (e: Throwable) {
      // Diagnostics must never be the thing that breaks a launch.
      promise.reject("exit_reasons_unavailable", e.message, e)
    }
  }
}
