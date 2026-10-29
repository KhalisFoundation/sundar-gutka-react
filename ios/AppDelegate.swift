import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
 
@main
class AppDelegate: RCTAppDelegate {
  /// Kept for SceneDelegate, which creates the React Native root view.
  var appLaunchOptions: [UIApplication.LaunchOptionsKey: Any]?

  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {

    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }
    self.moduleName = "SundarGutka"
    self.dependencyProvider = RCTAppDependencyProvider()

    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]

    // The window is created by SceneDelegate, not here: an app built with the
    // iOS 27 SDK that creates its window without a scene is refused at launch
    // on iOS 27 (Apple TN3187). React Native itself still starts below.
    self.automaticallyLoadReactNativeWindow = false
    self.appLaunchOptions = launchOptions

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
 
  // Delivers custom-scheme opens (sundargutka://) to React Native's Linking
  // module. Without this the JS `url` event never fires on iOS, so the SSO
  // return redirect would be dropped.
  override func application(_ app: UIApplication, open url: URL,
                            options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    return RCTLinkingManager.application(app, open: url, options: options)
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

/// Owns the app's window.
///
/// UIKit calls this after AppDelegate's didFinishLaunching, so React Native is
/// already initialised; this only attaches its root view to a window that
/// belongs to the scene. Three things RCTAppDelegate used to do for the window
/// it built are carried over, because nothing else does them under scenes:
/// the launch URL, the window-size notification, and the app delegate's
/// window reference.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let moduleName = appDelegate.moduleName
    else { return }

    // Linking.getInitialURL() reads the URL from the launch options the root
    // view is created with. Under scenes a link that cold-starts the app is
    // delivered here instead of in the app's launch options, so it is copied
    // across. Keyed by the raw string, which is what the native side looks up.
    var launchOptions: [AnyHashable: Any] = [:]
    appDelegate.appLaunchOptions?.forEach { launchOptions[$0.key.rawValue] = $0.value }
    if let url = connectionOptions.urlContexts.first?.url {
      launchOptions[UIApplication.LaunchOptionsKey.url.rawValue] = url
    }

    let rootView = appDelegate.rootViewFactory().view(
      withModuleName: moduleName,
      initialProperties: appDelegate.initialProps,
      launchOptions: launchOptions
    )
    let rootViewController = appDelegate.createRootViewController()
    appDelegate.setRootView(rootView, toRootViewController: rootViewController)

    let window = UIWindow(windowScene: windowScene)
    window.rootViewController = rootViewController
    self.window = window
    // Libraries that present their own UI find the window through the app
    // delegate, so it has to point at this one.
    appDelegate.window = window
    window.makeKeyAndVisible()
  }

  // Rotation, an iPad window being resized, or a folding iPhone opening. This
  // notification is what React Native turns into a Dimensions change; without
  // it useWindowDimensions would stay at the size the app launched with.
  func windowScene(
    _ windowScene: UIWindowScene,
    didUpdate previousCoordinateSpace: UICoordinateSpace,
    interfaceOrientation previousInterfaceOrientation: UIInterfaceOrientation,
    traitCollection previousTraitCollection: UITraitCollection
  ) {
    NotificationCenter.default.post(
      name: NSNotification.Name("RCTWindowFrameDidChangeNotification"),
      object: self
    )
  }

  // A link opened while the app is already running. Under scenes this replaces
  // AppDelegate's application(_:open:options:), which UIKit no longer calls, so
  // the SSO return redirect (sundargutka://) arrives here.
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else { return }
    _ = RCTLinkingManager.application(UIApplication.shared, open: url, options: [:])
  }
}