package com.WahegurooNetwork.SundarGutka

import android.app.ActivityManager
import android.app.ApplicationExitInfo
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

/**
 * Every use of ApplicationExitInfo, kept in a class of its own.
 *
 * The type only exists from Android 11 (API 30). React Native's bridge reflects
 * over every declared method of a native module class, private ones included
 * (JavaModuleWrapper.findMethods → getDeclaredMethods), so a module that merely
 * NAMES the type in a method signature throws NoClassDefFoundError on Android 9
 * and 10 the moment JavaScript touches the module. Nothing reflects over this
 * class, and it is only loaded once a caller has already checked the version.
 */
@RequiresApi(Build.VERSION_CODES.R)
internal object ExitInfoReader {
  /** Tombstones can carry every memory mapping and log buffer; the frames come first. */
  private const val MAX_TOMBSTONE_BYTES = 4 * 1024 * 1024

  fun read(context: Context, limit: Int): WritableArray {
    val out = Arguments.createArray()
    val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager ?: return out
    // Own package only; null asks for this app, which needs no permission.
    manager.getHistoricalProcessExitReasons(null, 0, limit).forEach { out.pushMap(describe(it)) }
    return out
  }

  private fun describe(info: ApplicationExitInfo): WritableMap =
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
        putInt("pid", info.pid)
        tombstoneLines(info)?.let { lines ->
          putArray("tombstone", Arguments.createArray().apply { lines.forEach { pushString(it) } })
        }
      }

  /**
   * The crash as debuggerd recorded it. Android 12 and later only: before that
   * the system keeps the tombstone to itself. A read failure costs the detail,
   * never the report it belongs to.
   */
  private fun tombstoneLines(info: ApplicationExitInfo): List<String>? {
    if (info.reason != ApplicationExitInfo.REASON_CRASH_NATIVE) return null
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return null
    return try {
      val bytes = info.traceInputStream?.use { stream -> readCapped(stream) } ?: return null
      TombstoneSummary.parse(bytes)?.lines()
    } catch (e: Exception) {
      listOf("tombstone unreadable: ${e.javaClass.simpleName}: ${e.message}")
    }
  }

  private fun readCapped(stream: java.io.InputStream): ByteArray {
    val buffer = java.io.ByteArrayOutputStream()
    val chunk = ByteArray(64 * 1024)
    while (buffer.size() < MAX_TOMBSTONE_BYTES) {
      val read = stream.read(chunk, 0, minOf(chunk.size, MAX_TOMBSTONE_BYTES - buffer.size()))
      if (read <= 0) break
      buffer.write(chunk, 0, read)
    }
    return buffer.toByteArray()
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
        else -> "UNKNOWN($reason)"
      }
}
