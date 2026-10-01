package com.tailgram.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/**
 * Уведомления в стиле Telegram: отдельный канал для сообщений (с звуком и вибрацией)
 * и отдельный канал для служебного уведомления активного соединения.
 */
public final class Notifier {

    static final String CH_MSG = "tg_messages";
    static final String CH_CONN = "tg_connection";
    static final int SERVICE_ID = 4711;
    static final int MSG_ID_BASE = 1000;

    private Notifier() { }

    static void ensureChannels(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        NotificationChannel msgs = new NotificationChannel(CH_MSG, "Сообщения", NotificationManager.IMPORTANCE_HIGH);
        msgs.setDescription("Новые сообщения и звонки");
        msgs.enableVibration(true);
        msgs.enableLights(true);
        msgs.setShowBadge(true);
        NotificationChannel conn = new NotificationChannel(CH_CONN, "Соединение", NotificationManager.IMPORTANCE_MIN);
        conn.setDescription("Держит мессенджер подключённым в фоне");
        conn.setShowBadge(false);
        nm.createNotificationChannel(msgs);
        nm.createNotificationChannel(conn);
    }

    static int iconRes(Context ctx) {
        try {
            int id = ctx.getResources().getIdentifier("ic_launcher", "mipmap", ctx.getPackageName());
            if (id != 0) return id;
            id = ctx.getResources().getIdentifier("ic_launcher_fg", "drawable", ctx.getPackageName());
            if (id != 0) return id;
        } catch (Exception ignored) { }
        return android.R.drawable.ic_dialog_info;
    }

    static Notification.Builder build(Context ctx, String channel, String title, String text, String peerId) {
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) b = new Notification.Builder(ctx, channel);
        else b = new Notification.Builder(ctx);
        b.setSmallIcon(iconRes(ctx))
                .setContentTitle(title == null ? "TailGram" : title)
                .setContentText(text == null ? "" : text)
                .setWhen(System.currentTimeMillis())
                .setShowWhen(true)
                .setAutoCancel(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            b.setPriority(Notification.PRIORITY_HIGH);
            b.setColor(0xFF2AABEE);
        }
        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (peerId != null) open.putExtra(MainActivity.EXTRA_PEER_ID, peerId);
        int flags = 0;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        }
        try {
            b.setContentIntent(PendingIntent.getActivity(ctx, notifId(peerId), open, flags));
        } catch (Exception ignored) { }
        return b;
    }

    static int notifId(String peerId) {
        int h = (peerId == null) ? 0 : peerId.hashCode();
        return MSG_ID_BASE + Math.abs(h % 800);
    }

    /** Уведомление о новом сообщении. */
    static void showMessage(Context ctx, String peerId, String title, String text) {
        try {
            ensureChannels(ctx);
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            Notification.Builder b = build(ctx, CH_MSG, title, text, peerId);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                b.setDefaults(Notification.DEFAULT_ALL);
            }
            nm.notify(notifId(peerId), b.build());
        } catch (Exception ignored) { }
    }

    /** Служебное уведомление активного соединения + счётчик непрочитанных. */
    static void showConnection(Context ctx, int unread) {
        try {
            ensureChannels(ctx);
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            String text;
            if (unread <= 0) text = "Мессенджер подключён — уведомления включены";
            else if (unread == 1) text = "1 новое сообщение";
            else if (unread < 5) text = unread + " новых сообщения";
            else text = unread + " новых сообщений";
            Notification.Builder b = build(ctx, CH_CONN, "TailGram", text, null);
            b.setOngoing(true);
            b.setOnlyAlertOnce(true);
            b.setAutoCancel(false);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                b.setPriority(Notification.PRIORITY_MIN);
                b.setOngoing(true);
            }
            nm.notify(SERVICE_ID, b.build());
        } catch (Exception ignored) { }
    }

    /** Убирает все уведомления о сообщениях (пользователь открыл приложение). */
    static void clearMessages(Context ctx) {
        try {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            for (int i = 0; i < 800; i++) nm.cancel(MSG_ID_BASE + i);
        } catch (Exception ignored) { }
    }
}