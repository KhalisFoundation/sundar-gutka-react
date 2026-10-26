package com.WahegurooNetwork.SundarGutka

import android.os.Build
import android.view.WindowManager
import androidx.core.view.WindowCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Colours the system navigation bar's glyphs to suit whatever the app is
 * drawing behind them.
 *
 * ── Why glyphs and not a scrim ────────────────────────────────────────────
 * Targeting SDK 36 means Android 15+ enforces edge-to-edge and paints its own
 * background behind the three-button bar. That background is NOT black: it is
 * ~80% opacity tinted from the window, so over the Reader's white page it
 * composites to light grey — and with the platform's default white glyphs on
 * top, the buttons are close to unreadable. No amount of scrim fixes that,
 * because the scrim takes its colour from the very page it is meant to
 * contrast against.
 *
 * So the scrim is off everywhere (see MainActivity, SplashActivity and
 * values-v29/styles.xml), the app's own pixels run to the bottom of the
 * display, and legibility comes from the glyphs instead: dark ones over a
 * light surface, light ones over a dark surface. This is what
 * `windowLightNavigationBar` / APPEARANCE_LIGHT_NAVIGATION_BARS exist for.
 *
 * ── Scope ─────────────────────────────────────────────────────────────────
 * One flag governs the whole navigation bar, so it colours the three-button
 * icons AND the gesture pill. That is deliberate: a white pill on a white page
 * is as invisible as a white icon. Targeting only three-button would need
 * `Settings.Secure.navigation_mode`, which is not public API.
 *
 * WindowInsetsControllerCompat carries this back as far as the platform
 * supports it and is a no-op below, so the API 24 floor needs no guard here.
 */
class SystemBarsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "SystemBars"

  /**
   * @param light true when the surface BEHIND the navigation bar is light, so
   *   the glyphs should be dark. False for a dark surface.
   */
  @ReactMethod
  fun setNavigationBarLightGlyphs(light: Boolean) {
    val activity = currentActivity ?: return
    // Window flags must be touched on the UI thread; a JS call arrives on the
    // native modules thread.
    activity.runOnUiThread {
      // The activity can finish between the check above and this running.
      if (!activity.isFinishing && !activity.isDestroyed) {
        val window = activity.window
        WindowCompat.getInsetsController(window, window.decorView)
            .isAppearanceLightNavigationBars = light
      }
    }
  }

  /**
   * Puts the window back edge-to-edge after React Native's StatusBar has shown
   * the status bar. On Android 11+ showing it calls
   * `setDecorFitsSystemWindows(true)` and resets the cutout mode, so a screen
   * that mounts a StatusBar padded itself above both system bars and lost its
   * safe-area insets until the next focus change (see MainActivity).
   */
  @ReactMethod
  fun restoreEdgeToEdge() {
    val activity = currentActivity ?: return
    activity.runOnUiThread {
      if (!activity.isFinishing && !activity.isDestroyed) {
        val window = activity.window
        WindowCompat.setDecorFitsSystemWindows(window, false)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
          val params = window.attributes
          params.layoutInDisplayCutoutMode =
              WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
          window.attributes = params
        }
      }
    }
  }
}
