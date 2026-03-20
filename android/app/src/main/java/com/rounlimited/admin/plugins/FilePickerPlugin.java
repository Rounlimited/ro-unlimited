package com.rounlimited.admin.plugins;

import android.content.Intent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.rounlimited.admin.UploadActivity;

@CapacitorPlugin(name = "FilePicker")
public class FilePickerPlugin extends Plugin {

    @PluginMethod()
    public void pickAndUpload(PluginCall call) {
        String userEmail = call.getString("userEmail", "");
        String folder = call.getString("folder", "/");

        Intent intent = new Intent(getActivity(), UploadActivity.class);
        intent.putExtra("userEmail", userEmail);
        intent.putExtra("folder", folder);
        startActivityForResult(call, intent, "uploadResult");
    }

    @ActivityCallback
    private void uploadResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject ret = new JSObject();
        ret.put("uploaded", result.getResultCode() == android.app.Activity.RESULT_OK ? 1 : 0);
        call.resolve(ret);
    }
}
