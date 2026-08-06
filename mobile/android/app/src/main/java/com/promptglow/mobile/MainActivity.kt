package com.promptglow.mobile

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "PromptGlow"

  /**
   * We use DefaultReactActivityDelegate with fabricEnabled=false (Old Architecture).
   * This disables TurboModules/Fabric and prevents loading libreact_featureflagsjni.so
   * which is only present in New Architecture builds.
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, false)
}
