import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
// Background download support (@kesha-antonov/react-native-background-downloader).
// The pod's Swift module is named after the package, with the npm scope dropped.
import react_native_background_downloader
 
@main
class AppDelegate: RCTAppDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {

    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }
    self.moduleName = "SundarGutka"
    self.dependencyProvider = RCTAppDependencyProvider()
 
    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]
 
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Reconnect the background URLSession so downloads that completed while the
  // app was suspended or terminated can finish flushing to disk.
  override func application(
    _ application: UIApplication,
    handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
  ) {
    RNBackgroundDownloader.setCompletionHandlerWithIdentifier(identifier, completionHandler: completionHandler)
  }
 
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }
 
  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}