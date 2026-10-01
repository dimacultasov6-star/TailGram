# История изменений

Все значимые изменения проекта будут в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
проект версионируется по [Semantic Versioning](https://semver.org/lang/ru/).

## [2.9] -- 2026-10-01

### Fixed
- **Android: right-hand cropping.** Panels now fit the *visual* viewport, so the UI scales
  to whatever is actually visible even if the WebView ignores the viewport meta.
- setInitialScale(0) -> setInitialScale(100); a zero initial scale broke the starting
  zoom on some WebView versions.
- Dialog list width capped at min(372px, 100%) so it cannot exceed the screen.

## [2.8] -- 2026-10-01

### Fixed
- **Android: root cause of the cropped UI.** The viewport meta had minimum-scale=1.0, which
  forbade the WebView from scaling the page down, so any screen narrower than 412 px lost
  the right-hand part of the interface. Now width=device-width: the layout matches the real
  screen width, nothing is cut off and nothing is shrunk.
- Adaptive root font size clamp(15px, 4vw, 16px); verified at 360 / 390 / 412 px.

## [2.7] -- 2026-10-01

### Changed
- **Android: layout built for the phone instead of patched.** Input field widened from 186 to 272 px
  (removed speech-to-text and video-circle buttons), compact paddings/avatars/headers,
  truncated long names, long messages wrap by word.
- **Removed all temporary debug UI:** startup diagnostics overlay, build badge and the
  in-app zoom buttons. Nothing appears or disappears on its own now.

## [2.6] -- 2026-10-01

### Changed
- **Android: text size back to normal** (layout width 412 px, font 16 px) -- 2.5 was too small.
- Compact paddings, avatars, headers and buttons kept, so the UI fits the screen.
- **In-app zoom control:** - / + buttons (72-130%) next to the build badge; the value is remembered.

## [2.5] -- 2026-10-01

###  changed
- **Android: interface sized for phone.** Layout width 480 px instead of 412, base font 15 px,
  smaller avatars/stories/headers/bubbles/input panel, so everything fits on screen.
- Navigation (full-screen chat + back arrow) unchanged.

## [2.4] — 2026-10-01

### Исправлено
- 🎯 **Android: чат открывается поверх всего экрана.** Размеры панелей задаются прямо
  в стилях элементов, без опоры на CSS-возможности WebView; при открытии чата список
  принудительно скрывается (`visibility:hidden`, `opacity:0`, сдвиг за экран).
- 🏷️ В правом нижнем углу показывается номер сборки (`TG 2.4`) — видно, какая версия запущена.
- 📦 APK публикуется под именем с версией (`TailGram-2.4.apk`).
- 🔧 2.3: CSS `inset` заменён на отдельные `top/right/bottom/left` (старые WebView не поддерживают `inset`).

## [2.2] — 2026-10-01

### Исправлено
- 📐 **Android: ширина вёрстки задана явно (412 px)** и подгоняется под экран.
  На части телефонов WebView отдавал ширину больше экрана: интерфейс выглядел мелким,
  а список чатов и чат отображались одновременно. Теперь ширина вёрстки не зависит
  от поведения WebView.
- 📱 Однопанельный режим включается и по ширине, и по классу `android-app`
  (класс ставится по признаку UA, без зависимости от JS-моста).
- 🔎 Временная диагностика в Android-сборке: первые 15 секунд показывает параметры вьюпорта.
- 🛠 Скрипт сборки: сообщения на английском (иначе кодировка ломала парсер PowerShell),
  добавлена проверка viewport/CSS внутри собранного APK.

## [2.1] — 2026-10-01

### Исправлено
- 📱 **Android: чат открывается на весь экран.** Список чатов и чат больше не отображаются
  одновременно: однопанельный режим включается всегда, а не только по ширине экрана
  (WebView сообщал завышенную ширину, из-за чего медиазапрос не срабатывал).
- ↩️ **Android: стрелка «Назад» в углу** всегда видна и возвращает к списку чатов.
  Системная кнопка «Назад» работает так же.
- 🛠 Сборка APK: скрипт теперь проверяет каждый шаг и валидирует готовый APK
  (раньше при ошибке `javac` собирался APK без `classes.dex` — приложение бы не запустилось).

## [2.0] — 2026-10-01

### Добавлено
- ✏️ **Редактирование сообщений** — правка своих сообщений с пометкой «изменено»,
  синхронизация правки у собеседника и в группах.
- 📬 **Офлайн-доставка** — сообщения, отправленные офлайн, доставляются автоматически
  при подключении собеседника; очередь восстанавливается после перезапуска программы.
- 🟢 **Индикатор «печатает…»** — в шапке чата и в списке чатов.
- 🔄 Фоновая проверка соединений каждые 25 секунд вместо ручного обновления.
- 🇬🇧 **Версия для Android** (`TailGram.apk`).
- 🌐 Сайт с загрузками на GitHub Pages.

### Улучшено
- Статусы «в сети / офлайн» обновляются автоматически.
- Windows-сборка: WebView2 Runtime устанавливается автоматически, если его нет в системе.
- Windows-сборка: весь интерфейс вшит в один `.exe`, внешние HTML/JS-файлы не нужны.
- Оптимизация интерфейса под телефоны: отключены зум, pull-to-refresh и выделение текста,
  учтены вырезы экрана, нативная вибрация, освобождение камеры/микрофона в фоне.

### Примечание
- Минимальная версия Android — 7.0 (API 24).
- Требуется интернет: сообщения идут напрямую по P2P (WebRTC).