package com.tailgram.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {

    private static final int REQ_PERMS = 1001;
    private static final int REQ_WEB_PERMS = 1002;

    private WebView web;
    private ValueCallback<Uri[]> filePathCallback;
    private static final int REQ_FILE = 1003;

    private static final String[] NEEDED = {
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CAMERA
    };

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(Color.parseColor("#0B1220")));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            getWindow().setStatusBarColor(Color.parseColor("#0B1220"));
            getWindow().setNavigationBarColor(Color.parseColor("#0B1220"));
        }
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#0B1220"));
        root.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0B1220"));
        web.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.addView(web);
        setContentView(root);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setLoadsImagesAutomatically(true);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        web.setInitialScale(100);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        s.setGeolocationEnabled(true);
        s.setUserAgentString(s.getUserAgentString() + " TailGramAndroid/3.0");

        WebView.setWebContentsDebuggingEnabled(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
                    if (url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1")) {
                        return false;
                    }
                    try {
                        startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW, Uri.parse(url)));
                    } catch (Exception ignored) { }
                    return true;
                }
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                injectNativeBridge();
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        request.grant(request.getResources());
                    }
                });
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;
                try {
                    android.content.Intent i = new android.content.Intent();
                    i.addCategory(android.content.Intent.CATEGORY_OPENABLE);
                    i.setType("*/*");
                    startActivityForResult(android.content.Intent.createChooser(i, "Р’С‹Р±РµСЂРёС‚Рµ С„Р°Р№Р»"), REQ_FILE);
                    return true;
                } catch (Exception e) {
                    if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                    filePathCallback = null;
                    return false;
                }
            }
        });

        web.addJavascriptInterface(new NativeBridge(), "AndroidNative");

        requestRuntimePermissions();
        web.loadUrl("file:///android_asset/index.html");
    }

    private void injectNativeBridge() {
        try {
            web.evaluateJavascript(
                "(function(){try{"
                + "window.AETHER_DESKTOP=false;"
                + "window.TAILGRAM_ANDROID=true;"
                + "document.documentElement.classList.add('android-app');"
                + "if(window.AndroidNative){window.AndroidNative.ready();}"
                + "}catch(e){}})();", null);
        } catch (Exception ignored) { }
    }

    private void requestRuntimePermissions() {
        ArrayList<String> missing = new ArrayList<String>();
        for (String p : NEEDED) {
            if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) {
                missing.add(p);
            }
        }
        if (!missing.isEmpty()) {
            requestPermissions(missing.toArray(new String[0]), REQ_PERMS);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_PERMS) {
            boolean audioOk = true;
            for (int i = 0; i < permissions.length; i++) {
                if (permissions[i].equals(Manifest.permission.RECORD_AUDIO)
                        && grantResults[i] != PackageManager.PERMISSION_GRANTED) {
                    audioOk = false;
                }
            }
            if (!audioOk) {
                Toast.makeText(this, "Р Р°Р·СЂРµС€РµРЅРёРµ РЅР° РјРёРєСЂРѕС„РѕРЅ РЅРµ РІС‹РґР°РЅРѕ вЂ” РіРѕР»РѕСЃРѕРІС‹Рµ Рё Р·РІРѕРЅРєРё РЅРµРґРѕСЃС‚СѓРїРЅС‹", Toast.LENGTH_LONG).show();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, android.content.Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_FILE) {
            if (filePathCallback == null) return;
            Uri[] result = null;
            if (resultCode == Activity.RESULT_OK && data != null && data.getData() != null) {
                result = new Uri[]{ data.getData() };
            }
            filePathCallback.onReceiveValue(result);
            filePathCallback = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (web == null) {
            super.onBackPressed();
            return;
        }
        String js = "(function(){try{"
                + "if(window.AppManager && AppManager.activeChat){AppManager.closeChat();return 'closed';}"
                + "if(document.querySelector('.modal-overlay.active')){"
                + "var m=document.querySelector('.modal-overlay.active');if(AppManager&&AppManager.ui){AppManager.ui.closeModal(m.id);return 'modal';}m.classList.remove('active');return 'modal';}"
                + "if(document.getElementById('attachMenu')&&document.getElementById('attachMenu').classList.contains('active')){document.getElementById('attachMenu').classList.remove('active');return 'menu';}"
                + "if(document.getElementById('emojiPanel')&&document.getElementById('emojiPanel').classList.contains('active')){document.getElementById('emojiPanel').classList.remove('active');return 'menu';}"
                + "return 'exit';"
                + "}catch(e){return 'exit';}})();";
        web.evaluateJavascript(js, new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String value) {
                if (value != null && value.contains("exit")) {
                    moveTaskToBack(true);
                }
            }
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) {
            try { web.evaluateJavascript("try{window.AppManager&&AppManager.pauseAll&&AppManager.pauseAll();}catch(e){}", null); }
            catch (Exception ignored) { }
            web.onPause();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    public class NativeBridge {
        @JavascriptInterface
        public void ready() { }

        @JavascriptInterface
        public void toast(final String msg) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void vibrate(final int ms) {
            try {
                android.os.Vibrator v = (android.os.Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (v != null && v.hasVibrator()) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        v.vibrate(android.os.VibrationEffect.createOneShot(ms, android.os.VibrationEffect.DEFAULT_AMPLITUDE));
                    } else {
                        v.vibrate(ms);
                    }
                }
            } catch (Exception ignored) { }
        }

        @JavascriptInterface
        public void keepAwake(final boolean on) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (on) {
                        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    } else {
                        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    }
                }
            });
        }

        @JavascriptInterface
        public String platform() {
            return "android";
        }
    }
}