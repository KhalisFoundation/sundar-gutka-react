package com.WahegurooNetwork.SundarGutka

import android.app.ActivityManager
import android.app.ApplicationExitInfo
import android.content.Context
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray

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
 * REASON_CRASH_NATIVE when it segfaulted) and, crucially, the process's real
 * footprint at the moment it died. Crashlytics reports free DEVICE memory,
 * which cannot separate "this phone was busy" from "this app used its budget";
 * PSS and RSS can.
 *
 * Read-only, and history the system already keeps. Below API 30 it resolves
 * empty rather than throwing, so callers need no version branch of their own.
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
      val manager =
          reactApplicationContext.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
      if (manager == null) {
        promise.resolve(Arguments.createArray())
        return
      }
      // Own package only; null asks for this app, which needs no permission.
      val records = manager.getHistoricalProcessExitReasons(null, 0, limit.coerceIn(1, 30))
      val out: WritableArray = Arguments.createArray()
      records.forEach { out.pushMap(describe(it)) }
      promise.resolve(out)
    } catch (e: Throwable) {
      // Diagnostics must never be the thing that breaks a launch.
      promise.reject("exit_reasons_unavailable", e.message, e)
    }
  }

  private fun describe(info: ApplicationExitInfo) =
      Arguments.createMap().apply {
        putInt("reason", info.reason)
        putString("reasonName", nameOf(info.reason))
        putInt("status", info.status)
        putInt("importance", info.importance)
        // Both are bytes here; the platform reports them in kB.
        putDouble("pss", info.pss * 1024.0)
        putDouble("rss", info.rss * 1024.0)
        putDouble("timestamp", info.timestamp.toDouble())
        putString("description", info.description ?: "")
        putString("processName", info.processName ?: "")
      }

  private fun nameOf(reason: Int) =
      when (reason) {
        ApplicationExitInfo.REASON_EXIT_SELF -> "EXIT_SELF"
        ApplicationExitInfo.REASON_SIGNALED -> "SIGNALED"
        ApplicationExitInfo.REASON_LOW_MEMORY -> "LOW_MEMORY"
        ApplicationExitInfo.REASON_CRASH -> "CRASH"
        ApplicationExitInfo.REASON_CRASH_NATIVE -> "CRASH_NATIVE"
        ApplicationExitInfo.REASON_ANR -> "ANR"
        ApplicationExitInfo.REASON_INITIALIZATION_FAILURE -> "INITIALIZATION_FAILURE"
        ApplicationExitInfo.REASON_PERMISSION_CHANGE -> "PERMISSION_CHANGE"
        ApplicationExitInfo.REASON_EXCESSIVE_RESOURCE_USAGE -> "EXCESSIVE_RESOURCE_USAGE"
        ApplicationExitInfo.REASON_USER_REQUESTED -> "USER_REQUESTED"
        ApplicationExitInfo.REASON_USER_STOPPED -> "USER_STOPPED"
        ApplicationExitInfo.REASON_DEPENDENCY_DIED -> "DEPENDENCY_DIED"
        ApplicationExitInfo.REASON_OTHER -> "OTHER"
        else -> "UNKNOWN"
      }
}
