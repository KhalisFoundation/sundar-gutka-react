package com.WahegurooNetwork.SundarGutka

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import org.devio.rn.splashscreen.SplashScreen
import android.graphics.Color
import android.os.Bundle
import android.view.KeyEvent
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.os.Build
import androidx.activity.OnBackPressedCallback
import androidx.core.view.WindowCompat

class MainActivity : ReactActivity() {
 
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "SundarGutka"

  /**
   * Routes the system back gesture into React Native.
   *
   * ── Why this has to exist ─────────────────────────────────────────────────
   * React Native 0.78 handles back by overriding the DEPRECATED
   * Activity.onBackPressed(). Nothing in the React Native AAR registers an
   * OnBackPressedCallback.
   *
   * This app targets SDK 36, and from Android 16 the platform no longer calls
   * onBackPressed() — back is delivered through OnBackInvokedDispatcher, which
   * androidx forwards to onBackPressedDispatcher. With no callback registered
   * there, the dispatcher falls through to its default and FINISHES THE
   * ACTIVITY. The press never reached JavaScript, so every screen exited the app
   * instead of navigating back, and no amount of BackHandler work in JS could
   * have caught it — BackHandler was never being called.
   *
   * Registering here restores the delivery path. It is deliberately not gated on
   * an API level: on older devices the legacy onBackPressed() override inside
   * ReactActivity consumes the press before the dispatcher is ever consulted, so
   * this callback simply does not fire and behaviour is unchanged.
   */
  private val backPressedCallback = object : OnBackPressedCallback(true) {
      override fun handleOnBackPressed() {
          // Hands the press to JS exactly as ReactActivity.onBackPressed() did:
          // React Navigation, then any screen's BackHandler listener.
          if (!reactActivityDelegate.onBackPressed()) {
              // No React instance yet (very early startup) — act like the platform.
              isEnabled = false
              this@MainActivity.onBackPressedDispatcher.onBackPressed()
              isEnabled = true
          }
      }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
      SplashScreen.show(this)
      super.onCreate(null)
      // Lay out content edge-to-edge so the window draws behind system bars.
      WindowCompat.setDecorFitsSystemWindows(window, false)
      // Off from the very first frame, so the splash does not open with the
      // platform's black three-button strip that JS then has to remove. From
      // here the screens decide — see systemBars.js and SystemBarsModule.
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          window.isNavigationBarContrastEnforced = false
      }
      // Dark glyphs arrived in API 26 (APPEARANCE_LIGHT_NAVIGATION_BARS, and the
      // SYSTEM_UI flag it replaced). Below that they are permanently white, so a
      // transparent bar over a light screen — which the theme asks for from API
      // 24 — is white on white with no API able to fix it. Those two releases
      // keep an opaque bar instead, which is what Android 7 looks like anyway,
      // and the bottom inset still holds content clear of it.
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
          window.navigationBarColor = Color.BLACK
      }
      onBackPressedDispatcher.addCallback(this, backPressedCallback)
      lastConfiguration = Configuration(resources.configuration)
  }

  /**
   * Keeps a foldable's screen in place across a fold or unfold.
   *
   * Folding changes `smallestScreenSize` and `screenLayout`. Undeclared, either
   * one makes Android destroy and recreate this activity, and React Native
   * remounts the app from its first screen — so unfolding mid-bani lost the
   * user's place. The manifest now declares both, so the change arrives here
   * instead and React Native simply re-lays the app out at the new size.
   *
   * Only a foldable gets that. On every other device the two changes (entering
   * split-screen, for instance) must behave exactly as they did before the
   * manifest declared them, so this recreates the activity itself —
   * `recreate()` is the same destroy-and-create flow Android runs for an
   * undeclared change.
   *
   * `super` is still called, because Activity requires it, but React Native is
   * not told about a change that is about to recreate the activity (see the
   * delegate below). Before the manifest declared these, it never heard of one
   * — the activity was simply replaced — and it must not start re-laying the
   * app out on an activity that is on its way out.
   */
  override fun onConfigurationChanged(newConfig: Configuration) {
      val previous = lastConfiguration
      lastConfiguration = Configuration(newConfig)
      recreatePending = previous != null &&
          (previous.diff(newConfig) and FOLD_CONFIG_CHANGES) != 0 &&
          !DeviceForm.isFoldable(this)
      super.onConfigurationChanged(newConfig)
      if (recreatePending) recreate()
  }

  private var lastConfiguration: Configuration? = null

  /** Set once this instance has decided to recreate itself; it never resets. */
  private var recreatePending = false

  private companion object {
      /** The two changes the manifest declares for foldables' sake alone. */
      const val FOLD_CONFIG_CHANGES =
          ActivityInfo.CONFIG_SCREEN_LAYOUT or ActivityInfo.CONFIG_SMALLEST_SCREEN_SIZE
  }

  /**
   * Called by React Native when NO JavaScript listener consumed the press — i.e.
   * there is nothing left to go back to.
   *
   * The inherited implementation calls super.onBackPressed(), which now routes
   * through OnBackPressedDispatcher and straight back into the callback above,
   * round and round forever. Disabling the callback for the duration lets the
   * dispatcher fall through to the platform default instead, which is exactly
   * what leaving the app used to mean.
   */
  override fun invokeDefaultOnBackPressed() {
      backPressedCallback.isEnabled = false
      onBackPressedDispatcher.onBackPressed()
      backPressedCallback.isEnabled = true
  }

  /**
   * Called every time the window regains/loses focus. The edge-to-edge flag is
   * re-applied here so it survives notification shade pulls, lock/unlock cycles,
   * and — see below — React Native's own status bar handling.
   */
  override fun onWindowFocusChanged(hasFocus: Boolean) {
      super.onWindowFocusChanged(hasFocus)
      if (hasFocus) {
          applyEdgeToEdge()
      }
  }

  /**
   * Lays the window out edge-to-edge, and NOTHING else. In particular it hides
   * no system bar: whatever the device is set to — three buttons or a gesture
   * pill — stays on screen, and the status bar belongs to the app's own Hide
   * Status Bar setting.
   *
   * This method used to hide `Type.systemBars()` and then, briefly,
   * `Type.navigationBars()`. Both were wrong, for different reasons.
   *
   * Hiding `systemBars()` took the status bar with it, which is what made the
   * Hide Status Bar setting look broken: React Native's StatusBar showed the
   * bar as the user asked and the next focus change hid it again a moment
   * later.
   *
   * Hiding `navigationBars()` alone fixed that but kept the worse half. There
   * is one inset type for the navigation bar whichever way the device draws it,
   * so hiding it took the BUTTONS from anyone on three-button navigation — back,
   * home and recents gone, reachable only by swiping up first, and re-hidden on
   * every focus change. A gesture user lost a cosmetic pill; a button user lost
   * the ability to leave the app. There was no setting for it either way.
   *
   * Nothing in the app has to change to accommodate the bar. Its own chrome is
   * already written against the bottom inset — `BottomNavigation` wraps itself
   * in a bottom-edge `SafeArea`, and the Reader lifts the audio player and its
   * progress track by `insets.bottom` — and that code has simply been resolving
   * to zero for as long as the bar was hidden. Edge-to-edge stays on, so those
   * are still the things deciding where the app's own bars sit; they now sit
   * above a bar that is really there.
   *
   * Re-applied on focus rather than set once in `onCreate` because React
   * Native's StatusBar owns the status bar: showing it runs
   * `Window.statusBarShow()`, which calls `setDecorFitsSystemWindows(TRUE)` and
   * resets the cutout mode, quietly taking the window out of edge-to-edge the
   * first time anyone turns Hide Status Bar off.
   */
  private fun applyEdgeToEdge() {
      WindowCompat.setDecorFitsSystemWindows(window, false)
  }
 
  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        // Withheld only when this activity is about to be recreated — see
        // onConfigurationChanged. Every other change reaches React Native as
        // it always has.
        override fun onConfigurationChanged(newConfig: Configuration) {
          if (!recreatePending) super.onConfigurationChanged(newConfig)
        }
      }

  /**
   * Safely handle system dialog operations to prevent SecurityException
   */
  private fun safeCloseSystemDialogs() {
    try {
      // Check if we have the permission and are on a compatible API level
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P && 
          checkSelfPermission("android.permission.BROADCAST_CLOSE_SYSTEM_DIALOGS") == PackageManager.PERMISSION_GRANTED) {
        val closeDialogIntent = Intent(Intent.ACTION_CLOSE_SYSTEM_DIALOGS)
        sendBroadcast(closeDialogIntent)
      }
    } catch (e: SecurityException) {
      // Log the exception but don't crash
      e.printStackTrace()
    } catch (e: Exception) {
      // Handle any other exceptions
      e.printStackTrace()
    }
  }

  /**
   * Override onKeyDown to safely handle system dialog operations
   */
  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    try {
      return super.onKeyDown(keyCode, event)
    } catch (e: SecurityException) {
      // If we get a SecurityException, try to handle it gracefully
      if (e.message?.contains("BROADCAST_CLOSE_SYSTEM_DIALOGS") == true) {
        // Log the issue but don't crash
        e.printStackTrace()
        return true // Consume the event
      }
      throw e // Re-throw if it's not related to our permission
    }
  }
}