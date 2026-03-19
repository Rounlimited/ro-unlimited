package com.rounlimited.admin;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.rounlimited.admin.plugins.FilePickerPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FilePickerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
