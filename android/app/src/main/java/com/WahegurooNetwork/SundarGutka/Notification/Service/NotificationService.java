package com.WahegurooNetwork.SundarGutka.Notification.Service;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import javax.annotation.Nullable;
//creating the service class
public class NotificationService extends HeadlessJsTaskService {
    @Nullable
    protected HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        Log.d("HeadLess","Headless is running");
        Bundle extras = intent.getExtras();
        return new HeadlessJsTaskConfig(
          "NotificationHandler", //JS function to call
          extras != null ? Arguments.fromBundle(extras) : null,
          5000,
          true);
    }
}