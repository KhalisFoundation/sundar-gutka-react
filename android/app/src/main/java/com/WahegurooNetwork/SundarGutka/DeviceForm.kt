package com.WahegurooNetwork.SundarGutka

import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorManager
import android.os.Build

/**
 * Whether this phone folds.
 *
 * Android's own guidance is that a device with a hinge sensor supports folding:
 * `hasSystemFeature(FEATURE_SENSOR_HINGE_ANGLE)`. The sensor itself is checked
 * as well, because a device can ship the sensor without declaring the feature,
 * and either one is enough.
 *
 * Both only exist from Android 11 (API 30), which every hinge-sensor foldable
 * runs. Anything older is answered "no".
 *
 * It is a fact about the hardware, so it is worked out once per process. Both
 * the JS side (DeviceFormModule) and MainActivity read it, and they must agree:
 * the activity keeps itself alive across a fold only where the JS lays itself
 * out for one.
 */
object DeviceForm {
  @Volatile private var cached: Boolean? = null

  fun isFoldable(context: Context): Boolean {
    cached?.let { return it }
    val answer = detect(context.applicationContext)
    cached = answer
    return answer
  }

  private fun detect(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return false
    return try {
      val declared =
          context.packageManager.hasSystemFeature(PackageManager.FEATURE_SENSOR_HINGE_ANGLE)
      val sensors = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
      declared || sensors?.getDefaultSensor(Sensor.TYPE_HINGE_ANGLE) != null
    } catch (t: Throwable) {
      false
    }
  }
}
