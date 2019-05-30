package com.WahegurooNetwork.SundarGutka;

import android.app.Application;

import com.apsl.versionnumber.RNVersionNumberPackage;
import com.corbt.keepawake.KCKeepAwakePackage;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.oblador.vectoricons.VectorIconsPackage;
import com.react.rnspinkit.RNSpinkitPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.zmxv.RNSound.RNSoundPackage;

import org.devio.rn.splashscreen.SplashScreenReactPackage;
import org.pgsqlite.SQLitePluginPackage;

import java.util.Arrays;
import java.util.List;

import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.analytics.RNFirebaseAnalyticsPackage;
import io.invertase.firebase.fabric.crashlytics.RNFirebaseCrashlyticsPackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
              new MainReactPackage(),
            new RNSoundPackage(),
            new RNVersionNumberPackage(),
            new VectorIconsPackage(),
            new SplashScreenReactPackage(),
            new RNSpinkitPackage(),
            new KCKeepAwakePackage(),
            new RNFirebasePackage(),
              new RNFirebaseCrashlyticsPackage(),
            new RNGestureHandlerPackage(),
              new RNFirebaseAnalyticsPackage(),
              new RNFirebaseMessagingPackage(),
              new RNFirebaseNotificationsPackage(),
              new SQLitePluginPackage() // register SQLite Plugin here
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
