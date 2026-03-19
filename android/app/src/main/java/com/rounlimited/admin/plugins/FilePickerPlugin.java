package com.rounlimited.admin.plugins;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

@CapacitorPlugin(name = "FilePicker")
public class FilePickerPlugin extends Plugin {

    @PluginMethod()
    public void pickFiles(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.setType("*/*");
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        startActivityForResult(call, intent, "pickFilesResult");
    }

    @ActivityCallback
    private void pickFilesResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.resolve(new JSObject().put("files", new org.json.JSONArray()));
            return;
        }

        Intent data = result.getData();
        org.json.JSONArray filesArray = new org.json.JSONArray();

        try {
            if (data.getClipData() != null) {
                // Multiple files
                for (int i = 0; i < data.getClipData().getItemCount(); i++) {
                    Uri uri = data.getClipData().getItemAt(i).getUri();
                    JSObject fileObj = readFile(uri);
                    if (fileObj != null) filesArray.put(fileObj);
                }
            } else if (data.getData() != null) {
                // Single file
                Uri uri = data.getData();
                JSObject fileObj = readFile(uri);
                if (fileObj != null) filesArray.put(fileObj);
            }
        } catch (Exception e) {
            call.reject("Error reading files: " + e.getMessage());
            return;
        }

        JSObject ret = new JSObject();
        ret.put("files", filesArray);
        call.resolve(ret);
    }

    private JSObject readFile(Uri uri) {
        try {
            Activity activity = getActivity();

            // Get file name and size
            String fileName = "unknown";
            long fileSize = 0;
            String mimeType = activity.getContentResolver().getType(uri);

            Cursor cursor = activity.getContentResolver().query(uri, null, null, null, null);
            if (cursor != null && cursor.moveToFirst()) {
                int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                int sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
                if (nameIndex >= 0) fileName = cursor.getString(nameIndex);
                if (sizeIndex >= 0) fileSize = cursor.getLong(sizeIndex);
                cursor.close();
            }

            // Read file as base64
            InputStream inputStream = activity.getContentResolver().openInputStream(uri);
            if (inputStream == null) return null;

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(chunk)) != -1) {
                buffer.write(chunk, 0, bytesRead);
            }
            inputStream.close();

            String base64Data = Base64.encodeToString(buffer.toByteArray(), Base64.NO_WRAP);

            JSObject fileObj = new JSObject();
            fileObj.put("name", fileName);
            fileObj.put("size", fileSize);
            fileObj.put("mimeType", mimeType != null ? mimeType : "application/octet-stream");
            fileObj.put("data", base64Data);
            return fileObj;
        } catch (Exception e) {
            return null;
        }
    }
}
