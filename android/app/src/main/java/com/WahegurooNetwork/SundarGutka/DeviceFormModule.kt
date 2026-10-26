package com.WahegurooNetwork.SundarGutka

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

/**
 * Hands [DeviceForm]'s answer to the JS side.
 *
 * Exported as a constant rather than a method so the answer is there on the
 * first render. It does not change while the app runs.
 */
class DeviceFormModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "DeviceForm"

  override fun getConstants(): Map<String, Any> =
      mapOf("isFoldable" to DeviceForm.isFoldable(reactApplicationContext))
}
