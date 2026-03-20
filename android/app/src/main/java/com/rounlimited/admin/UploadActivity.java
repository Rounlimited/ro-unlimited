package com.rounlimited.admin;

import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ClipData;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;

import androidx.core.app.NotificationCompat;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.UUID;

public class UploadActivity extends Activity {

    private static final String BOT_TOKEN = "8749047502:AAGIy6qsa_6R81FW88XX1REn3MBTc8NJ7dc";
    private static final String CHAT_ID = "8195603202";
    private static final String UPLOAD_URL = "https://upload.rounlimited.com";
    private static final String API_URL = "https://rounlimited.com/api/admin/drive";
    private static final int PICK_FILES = 1001;

    private String userEmail = "";
    private String folder = "/";
    private ArrayList<Uri> selectedUris = new ArrayList<>();
    private ArrayList<String> fileNames = new ArrayList<>();
    private ArrayList<Long> fileSizes = new ArrayList<>();

    private LinearLayout fileListLayout;
    private Button uploadButton;
    private Button pickMoreButton;
    private TextView statusText;
    private TextView headerText;
    private ProgressBar progressBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        userEmail = getIntent().getStringExtra("userEmail");
        folder = getIntent().getStringExtra("folder");
        if (userEmail == null) userEmail = "";
        if (folder == null) folder = "/";

        // Build UI programmatically (no XML needed)
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(0xFF0A0A0A);
        root.setPadding(dp(20), dp(48), dp(20), dp(20));

        // Header
        headerText = new TextView(this);
        headerText.setText("Upload to RO Drive");
        headerText.setTextColor(0xFFFFFFFF);
        headerText.setTextSize(22);
        root.addView(headerText);

        // Folder path
        TextView folderText = new TextView(this);
        folderText.setText("Folder: " + folder);
        folderText.setTextColor(0xFF3B8DD4);
        folderText.setTextSize(14);
        folderText.setPadding(0, dp(4), 0, dp(16));
        root.addView(folderText);

        // Scrollable file list
        ScrollView scroll = new ScrollView(this);
        scroll.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1.0f));

        fileListLayout = new LinearLayout(this);
        fileListLayout.setOrientation(LinearLayout.VERTICAL);
        scroll.addView(fileListLayout);
        root.addView(scroll);

        // Progress
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setVisibility(View.GONE);
        progressBar.setIndeterminate(false);
        progressBar.setMax(100);
        progressBar.setPadding(0, dp(8), 0, dp(4));
        root.addView(progressBar);

        // Status
        statusText = new TextView(this);
        statusText.setTextColor(0xFF3B8DD4);
        statusText.setTextSize(14);
        statusText.setPadding(0, 0, 0, dp(12));
        root.addView(statusText);

        // Buttons row
        LinearLayout buttons = new LinearLayout(this);
        buttons.setOrientation(LinearLayout.HORIZONTAL);

        // Cancel button
        Button cancelButton = new Button(this);
        cancelButton.setText("Cancel");
        cancelButton.setTextColor(0x99FFFFFF);
        cancelButton.setBackgroundColor(0xFF1A1A1A);
        cancelButton.setPadding(dp(20), dp(14), dp(20), dp(14));
        cancelButton.setOnClickListener(v -> finish());
        LinearLayout.LayoutParams cancelParams = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1);
        cancelParams.setMargins(0, 0, dp(8), 0);
        buttons.addView(cancelButton, cancelParams);

        // Pick more button
        pickMoreButton = new Button(this);
        pickMoreButton.setText("+ Add Files");
        pickMoreButton.setTextColor(0xFF3B8DD4);
        pickMoreButton.setBackgroundColor(0xFF1A1A1A);
        pickMoreButton.setPadding(dp(20), dp(14), dp(20), dp(14));
        pickMoreButton.setOnClickListener(v -> openFilePicker());
        LinearLayout.LayoutParams moreParams = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1);
        moreParams.setMargins(0, 0, dp(8), 0);
        buttons.addView(pickMoreButton, moreParams);

        // Upload button
        uploadButton = new Button(this);
        uploadButton.setText("Upload");
        uploadButton.setTextColor(0xFFFFFFFF);
        uploadButton.setBackgroundColor(0xFF3B8DD4);
        uploadButton.setPadding(dp(20), dp(14), dp(20), dp(14));
        uploadButton.setOnClickListener(v -> startUpload());
        uploadButton.setEnabled(false);
        LinearLayout.LayoutParams uploadParams = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1);
        buttons.addView(uploadButton, uploadParams);

        root.addView(buttons);
        setContentView(root);

        // Open file picker immediately
        openFilePicker();
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density);
    }

    private void openFilePicker() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.setType("*/*");
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        startActivityForResult(intent, PICK_FILES);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode != PICK_FILES) return;

        if (resultCode != RESULT_OK || data == null) {
            if (selectedUris.isEmpty()) finish();
            return;
        }

        // Add selected files
        if (data.getClipData() != null) {
            ClipData clipData = data.getClipData();
            for (int i = 0; i < clipData.getItemCount(); i++) {
                addFile(clipData.getItemAt(i).getUri());
            }
        } else if (data.getData() != null) {
            addFile(data.getData());
        }

        updateFileList();
    }

    private void addFile(Uri uri) {
        // Take persistent permission
        try {
            getContentResolver().takePersistableUriPermission(uri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (Exception ignored) {}

        String name = "file";
        long size = 0;

        Cursor cursor = getContentResolver().query(uri, null, null, null, null);
        if (cursor != null && cursor.moveToFirst()) {
            int nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
            int sizeIdx = cursor.getColumnIndex(OpenableColumns.SIZE);
            if (nameIdx >= 0) name = cursor.getString(nameIdx);
            if (sizeIdx >= 0) size = cursor.getLong(sizeIdx);
            cursor.close();
        }

        selectedUris.add(uri);
        fileNames.add(name);
        fileSizes.add(size);
    }

    private void updateFileList() {
        fileListLayout.removeAllViews();

        for (int i = 0; i < fileNames.size(); i++) {
            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setPadding(dp(12), dp(12), dp(12), dp(12));
            row.setBackgroundColor(0xFF141414);

            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            rowParams.setMargins(0, 0, 0, dp(4));

            // File icon placeholder
            TextView icon = new TextView(this);
            icon.setText("📄");
            icon.setTextSize(20);
            icon.setPadding(0, 0, dp(12), 0);
            row.addView(icon);

            // File info
            LinearLayout info = new LinearLayout(this);
            info.setOrientation(LinearLayout.VERTICAL);
            info.setLayoutParams(new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));

            TextView nameView = new TextView(this);
            nameView.setText(fileNames.get(i));
            nameView.setTextColor(0xFFFFFFFF);
            nameView.setTextSize(15);
            nameView.setSingleLine(true);
            info.addView(nameView);

            TextView sizeView = new TextView(this);
            long bytes = fileSizes.get(i);
            String sizeStr = bytes < 1024 * 1024
                ? String.format("%.1f KB", bytes / 1024.0)
                : String.format("%.1f MB", bytes / (1024.0 * 1024));
            sizeView.setText(sizeStr);
            sizeView.setTextColor(0x66FFFFFF);
            sizeView.setTextSize(12);
            info.addView(sizeView);

            row.addView(info);

            // Remove button
            final int idx = i;
            TextView remove = new TextView(this);
            remove.setText("✕");
            remove.setTextColor(0x66FFFFFF);
            remove.setTextSize(18);
            remove.setPadding(dp(12), 0, 0, 0);
            remove.setOnClickListener(v -> {
                selectedUris.remove(idx);
                fileNames.remove(idx);
                fileSizes.remove(idx);
                updateFileList();
            });
            row.addView(remove);

            fileListLayout.addView(row, rowParams);
        }

        uploadButton.setEnabled(!selectedUris.isEmpty());
        uploadButton.setText("Upload " + selectedUris.size() + " file" + (selectedUris.size() != 1 ? "s" : ""));
        headerText.setText(selectedUris.size() + " file" + (selectedUris.size() != 1 ? "s" : "") + " selected");
    }

    private void startUpload() {
        uploadButton.setEnabled(false);
        pickMoreButton.setEnabled(false);
        progressBar.setVisibility(View.VISIBLE);
        progressBar.setProgress(0);

        new Thread(() -> {
            int uploaded = 0;
            int total = selectedUris.size();

            for (int i = 0; i < total; i++) {
                final int idx = i;
                final String name = fileNames.get(i);
                runOnUiThread(() -> {
                    statusText.setText("Uploading " + name + " (" + (idx + 1) + "/" + total + ")");
                    progressBar.setProgress((idx * 100) / total);
                });

                if (uploadFile(selectedUris.get(i), name, fileSizes.get(i))) {
                    uploaded++;
                }
            }

            final int count = uploaded;
            runOnUiThread(() -> {
                progressBar.setProgress(100);
                statusText.setText(count + " file" + (count != 1 ? "s" : "") + " uploaded successfully!");
                headerText.setText("Upload Complete");
                uploadButton.setText("Done");
                uploadButton.setEnabled(true);
                uploadButton.setOnClickListener(v -> {
                    setResult(RESULT_OK);
                    finish();
                });
            });
        }).start();
    }

    private boolean uploadFile(Uri uri, String fileName, long fileSize) {
        try {
            String mimeType = getContentResolver().getType(uri);
            if (mimeType == null) mimeType = "application/octet-stream";

            String boundary = UUID.randomUUID().toString();
            URL url = new URL(UPLOAD_URL + "/bot" + BOT_TOKEN + "/sendDocument");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(300000);
            conn.setChunkedStreamingMode(8192);

            OutputStream os = conn.getOutputStream();
            writeField(os, boundary, "chat_id", CHAT_ID);
            writeField(os, boundary, "caption", userEmail + " | " + folder + " | " + fileName);

            os.write(("--" + boundary + "\r\n").getBytes());
            os.write(("Content-Disposition: form-data; name=\"document\"; filename=\"" + fileName + "\"\r\n").getBytes());
            os.write(("Content-Type: " + mimeType + "\r\n\r\n").getBytes());

            InputStream is = getContentResolver().openInputStream(uri);
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                os.write(buffer, 0, bytesRead);
            }
            is.close();
            os.write(("\r\n--" + boundary + "--\r\n").getBytes());
            os.flush();
            os.close();

            int responseCode = conn.getResponseCode();
            InputStream rs = responseCode >= 200 && responseCode < 300 ? conn.getInputStream() : conn.getErrorStream();
            ByteArrayOutputStream rb = new ByteArrayOutputStream();
            while ((bytesRead = rs.read(buffer)) != -1) rb.write(buffer, 0, bytesRead);
            String response = rb.toString("UTF-8");
            conn.disconnect();

            if (responseCode != 200) return false;

            org.json.JSONObject tgResult = new org.json.JSONObject(response);
            if (!tgResult.getBoolean("ok")) return false;

            org.json.JSONObject doc = tgResult.getJSONObject("result").getJSONObject("document");

            // Save metadata
            URL metaUrl = new URL(API_URL);
            HttpURLConnection mc = (HttpURLConnection) metaUrl.openConnection();
            mc.setRequestMethod("POST");
            mc.setDoOutput(true);
            mc.setRequestProperty("Content-Type", "application/json");

            org.json.JSONObject meta = new org.json.JSONObject();
            meta.put("action", "save_metadata");
            meta.put("user_email", userEmail);
            meta.put("filename", doc.optString("file_name", fileName));
            meta.put("original_filename", fileName);
            meta.put("mime_type", doc.optString("mime_type", mimeType));
            meta.put("file_size", doc.optLong("file_size", fileSize));
            meta.put("telegram_file_id", doc.getString("file_id"));
            meta.put("folder", folder);

            OutputStream mos = mc.getOutputStream();
            mos.write(meta.toString().getBytes("UTF-8"));
            mos.close();
            mc.getResponseCode();
            mc.disconnect();

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void writeField(OutputStream os, String boundary, String name, String value) throws Exception {
        os.write(("--" + boundary + "\r\n").getBytes());
        os.write(("Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n").getBytes());
        os.write((value + "\r\n").getBytes());
    }
}
