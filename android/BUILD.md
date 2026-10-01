# Сборка TailGram для Android (APK)

Приложение — это `MainActivity` с WebView, внутри которого лежат те же
`index.html` / `app.js` / `desktop.js` и логотип. Интерфейс специально
оптимизирован под телефон (см. раздел «Оптимизации»).

Gradle **не нужен** — есть готовый скрипт `build.ps1`, который собирает APK
вручную (aapt2 → javac → d8 → zipalign → apksigner).

## Нужно

| Компонент | Путь в системе |
|:--|:--|
| Android SDK Platform 34 | `%LOCALAPPDATA%\Android\Sdk\platforms\android-34` |
| Build-Tools 34.0.0 | `%LOCALAPPDATA%\Android\Sdk\build-tools\34.0.0` |
| JDK 17+ | `C:\Program Files\Android\Android Studio\jbr` |
| d8 (R8 9.x) | `C:\Program Files\Android\Android Studio\plugins\android\lib\r8.jar` |

Всё это ставится вместе с **Android Studio**.

> Важно: `d8.bat` из build-tools 34.0.0 (R8 8.2.2) падает на вложенных
> анонимных классах. Скрипт использует более новый D8 из Android Studio.

## Сборка

```powershell
powershell -ExecutionPolicy Bypass -File build.ps1
```

Результат: `../TailGram.apk`

## Подпись

Ключ лежит в `keys/tailgram.keystore`:

```
storepass: tailgram
keypass:   tailgram
alias:     tailgram
```

> Ключ в репозиторий не коммитится (см. `.gitignore`). **Сохраните его копию:**
> обновить уже установленное приложение можно только тем же ключом.
> Если ключ потерян — придётся удалять старую версию с телефона и ставить заново.

Параметры `--v2-signing-enabled` / `--v3-signing-enabled` включены, этого
достаточно для Android 7.0+.

## Структура

```
android/
  AndroidManifest.xml      разрешения: интернет, микрофон, камера, вибрация
  java/.../MainActivity.java  WebView, WebRTC-разрешения, кнопка «Назад», мост в JS
  assets/                  index.html, app.js, desktop.js, logo.png
  res/                     иконка приложения (адаптивная, из логотипа) и тема
  build.ps1                сборка APK
  keys/tailgram.keystore   ключ подписи
```

## Оптимизации под телефон

В `assets/index.html` и `assets/app.js` (только для Android-версии):

- отключены зум двойным тапом, pull-to-refresh, выделение текста и картинок
- размер шрифта в полях ввода 16px — система не увеличивает страницу
- учтены вырезы экрана (`viewport-fit=cover`, `env(safe-area-inset-*)`)
- десктопный тайтбар скрыт, окно во весь экран, тёмные статус-бар и фон
- кнопка «Назад»: закрывает чат → закрывает окно/меню → сворачивает приложение
- нативная вибрация через JS-мост `window.AndroidNative.vibrate()`
- при сворачивании приложения освобождаются камера и микрофон
- окно не гаснет во время записи голосового сообщения

## Что нужно мессенджеру

- **Интернет** — обязателен: сообщения идут по P2P (PeerJS/WebRTC), PeerJS
  подключается к облачному сигнальному серверу и STUN-серверам.
- Доступ к CDN `unpkg.com` при первом запуске — оттуда грузится `peerjs.min.js`.
- Разрешения микрофона и камеры запрашиваются при первом запуске.