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
        // cover it. There is no theme attribute for this: the underlying
        // `enforceNavigationBarContrast` is @hide and not in public.xml, so
        // the Java API is the only supported way to set it.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
        }

        Intent intent = new Intent(this, MainActivity.class);
        startActivity(intent);
        finish();
    }
}
