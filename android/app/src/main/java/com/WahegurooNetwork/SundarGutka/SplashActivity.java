package com.WahegurooNetwork.SundarGutka;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

public class SplashActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // The platform paints an opaque scrim behind the three-button
        // navigation bar unless a window opts out, and the setting is
        // PER WINDOW. This activity is the launcher, so its window is the
        // first one on screen — MainActivity's own opt-out comes too late to
        // cover it. Set in code here rather than in this activity's theme,
        // which is shared with the rest of the app; the splash Dialog that
        // follows takes the same setting from values-v29/styles.xml.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
        }

        Intent intent = new Intent(this, MainActivity.class);
        startActivity(intent);
        finish();
    }
}
