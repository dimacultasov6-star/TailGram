package com.tailgram.app;

import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

/**
 * Foreground-сервис: держит процесс приложения живым, пока мессенджер подключён к сети.
 * Без него Android выгружает WebView с P2P-соединением из памяти, и сообщения не приходят.
 */
public class TailGramService extends Service {

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Notifier.showConnection(this, MainActivity.unreadCount());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try { startForeground(Notifier.SERVICE_ID, Notifier.build(this, Notifier.CH_CONN, "TailGram", "Мессенджер подключён — уведомления включены", null).build()); }
            catch (Exception ignored) { }
        }
        Notifier.showConnection(this, MainActivity.unreadCount());
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }
}