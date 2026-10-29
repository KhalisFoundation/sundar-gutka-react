package com.WahegurooNetwork.SundarGutka

import android.app.Activity
import android.app.ActivityManager
import android.app.Application
import android.content.ComponentCallbacks2
import android.content.Context
import android.content.res.Configuration
import android.os.Bundle
import android.os.Debug
import android.os.Handler
import android.os.HandlerThread
import android.os.Process
import com.google.firebase.crashlytics.FirebaseCrashlytics
import java.io.File

/**
 * Keeps the app's own memory state on every crash report.
 *
 * Crashlytics records free DEVICE memory, which cannot tell "this phone was
 * busy" from "this app had grown to fill its budget". A native crash inside the
 * runtime (the libart.so SIGSEGVs) arrives with no frames, so that distinction
 * is most of what there is to go on. Custom keys travel with every report,
 * native ones included, so the app's footprint is written there: whole-process
 * RSS (which counts the JavaScript heap; Hermes does not allocate through
 * malloc), the Java heap against its ceiling, the native heap, thread count,
 * and the last memory warning the system sent.
 *
 * Sampled every 30 seconds while the app is on screen and immediately on each
 * memory warning, on a background thread. Nothing runs while the app is in the
 * background. Every read is best-effort: a diagnostic must never fail the app.
 */
internal object MemoryContext {
  private const val INTERVAL_MS = 30_000L
  private const val MB = 1024 * 1024

  private val thread = HandlerThread("MemoryContext", Process.THREAD_PRIORITY_BACKGROUND)
  private lateinit var handler: Handler
  private lateinit var app: Application
  private var started = 0
  private val sample = object : Runnable {
    override fun run() {
      record()
      handler.postDelayed(this, INTERVAL_MS)
    }
  }

  fun install(application: Application) {
    app = application
    thread.start()
    handler = Handler(thread.looper)
    application.registerActivityLifecycleCallbacks(foreground)
    application.registerComponentCallbacks(warnings)
  }

  private val foreground =
      object : Application.ActivityLifecycleCallbacks {
        override fun onActivityStarted(activity: Activity) {
          if (started++ == 0) handler.post(sample)
        }

        override fun onActivityStopped(activity: Activity) {
          if (--started == 0) {
            handler.removeCallbacks(sample)
            handler.post { record() }
          }
        }

        override fun onActivityCreated(activity: Activity, state: Bundle?) {}

        override fun onActivityResumed(activity: Activity) {}

        override fun onActivityPaused(activity: Activity) {}

        override fun onActivitySaveInstanceState(activity: Activity, state: Bundle) {}

        override fun onActivityDestroyed(activity: Activity) {}
      }

  private val warnings =
      object : ComponentCallbacks2 {
        override fun onTrimMemory(level: Int) {
          // UI_HIDDEN is the app going to the background, not a warning.
          if (level == ComponentCallbacks2.TRIM_MEMORY_UI_HIDDEN) return
          val name = trimName(level)
          handler.post {
            report { crashlytics ->
              crashlytics.setCustomKey("mem_warning", "$name at ${System.currentTimeMillis()}")
              crashlytics.log("Memory warning from the system: $name")
            }
            record()
          }
        }

        override fun onLowMemory() = onTrimMemory(ComponentCallbacks2.TRIM_MEMORY_COMPLETE)

        override fun onConfigurationChanged(newConfig: Configuration) {}
      }

  private fun record() =
      report { crashlytics ->
        val runtime = Runtime.getRuntime()
        val status = procStatus()
        crashlytics.setCustomKey("mem_rss_mb", status["VmRSS"]?.let { it / 1024 } ?: -1L)
        crashlytics.setCustomKey("mem_threads", status["Threads"] ?: -1L)
        crashlytics.setCustomKey("mem_java_mb", (runtime.totalMemory() - runtime.freeMemory()) / MB)
        crashlytics.setCustomKey("mem_java_max_mb", runtime.maxMemory() / MB)
        crashlytics.setCustomKey("mem_native_mb", Debug.getNativeHeapAllocatedSize() / MB)
        val manager = app.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        if (manager != null) {
          val info = ActivityManager.MemoryInfo().also { manager.getMemoryInfo(it) }
          crashlytics.setCustomKey("mem_device_avail_mb", info.availMem / MB)
          crashlytics.setCustomKey("mem_device_low", info.lowMemory)
          crashlytics.setCustomKey("mem_app_budget_mb", manager.memoryClass)
        }
        crashlytics.setCustomKey("mem_sampled_at", System.currentTimeMillis())
      }

  /** kB values (and counts) from /proc/self/status: cheap, and no binder call. */
  private fun procStatus(): Map<String, Long> =
      try {
        File("/proc/self/status")
            .readLines()
            .mapNotNull { line ->
              val key = line.substringBefore(':')
              if (key != "VmRSS" && key != "Threads") return@mapNotNull null
              line.substringAfter(':').trim().split(' ').first().toLongOrNull()?.let { key to it }
            }
            .toMap()
      } catch (e: Exception) {
        emptyMap()
      }

  private inline fun report(block: (FirebaseCrashlytics) -> Unit) {
    try {
      block(FirebaseCrashlytics.getInstance())
    } catch (e: Exception) {
      // Never let a diagnostic fail the app.
    }
  }

  private fun trimName(level: Int) =
      when (level) {
        ComponentCallbacks2.TRIM_MEMORY_RUNNING_MODERATE -> "RUNNING_MODERATE"
        ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW -> "RUNNING_LOW"
        ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL -> "RUNNING_CRITICAL"
        ComponentCallbacks2.TRIM_MEMORY_BACKGROUND -> "BACKGROUND"
        ComponentCallbacks2.TRIM_MEMORY_MODERATE -> "MODERATE"
        ComponentCallbacks2.TRIM_MEMORY_COMPLETE -> "COMPLETE"
        else -> "LEVEL_$level"
      }
}
