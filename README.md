<div align="center">

<img src="assets/logo.png" width="128" alt="TailGram logo">

# 🐶 TailGram — Ультра Мессенджер

**Мессенджер, который работает без сервера: переписка, звонки, истории и группы напрямую между устройствами (P2P).**
Есть версии для **Windows** и **Android**.

[![Windows](https://img.shields.io/badge/Windows-x64-0078D4?style=flat-square&logo=windows&logoColor=white)](https://github.com/dimacultasov6-star/TailGram/releases/latest)
[![Android](https://img.shields.io/badge/Android-7.0%2B-3DDC84?style=flat-square&logo=android&logoColor=white)](https://github.com/dimacultasov6-star/TailGram/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## ⬇️ Скачать

<div align="center">

| Платформа | Файл | Размер | Что нужно |
|:---------:|:-----|-------:|:----------|
| 🪟 **Windows** | [`TailGram-Windows-x64.zip`](https://github.com/dimacultasov6-star/TailGram/releases/latest/download/TailGram-Windows-x64.zip) | 465 КБ | Windows 10/11 x64 |
| 🤖 **Android** | [`TailGram.apk`](https://github.com/dimacultasov6-star/TailGram/releases/latest/download/TailGram.apk) | 149 КБ | Android 7.0+ |

</div>

**Прямые ссылки на последнюю версию:**

```
https://github.com/dimacultasov6-star/TailGram/releases/latest/download/TailGram-Windows-x64.zip
https://github.com/dimacultasov6-star/TailGram/releases/latest/download/TailGram.apk
```

🌐 **Сайт с загрузками:** <https://dimacultasov6-star.github.io/TailGram/>

### Установка на Windows
1. Скачайте `TailGram-Windows-x64.zip` и распакуйте в любую папку.
2. Запустите `TailGram.exe` — всё.
3. Если в системе нет WebView2 Runtime, TailGram установит его сам при первом запуске.

> Не вытаскивайте `TailGram.exe` из архива отдельно: рядом нужны три DLL-файла (они в архиве).

### Установка на Android
1. Скачайте `TailGram.apk` на телефон.
2. Разрешите установку из этого источника в настройках Android.
3. При первом запуске приложение попросит доступ к микрофону и камере.

---

## ✨ Возможности

| | |
|:--|:--|
| 💬 Переписка | текст, голосовые, кружки, фото, файлы |
| 📞 Звонки | аудио и видео (WebRTC) |
| ✏️ Редактирование | правка своих сообщений с пометкой «изменено» |
| 📬 Офлайн-доставка | сообщения уходят, когда собеседник снова в сети |
| 🟢 Статусы | «в сети» и «печатает…» |
| 👥 Группы | группы и каналы, роли администраторов |
| 📖 Истории | stories на 24 часа с просмотрами |
| 🎁 Подарки | звёзды, подарки, колесо бонусов |
| 😊 Реакции | эмодзи-реакции на любые сообщения |
| 🎮 Игры | крестики-нолики прямо в чате |
| 📌 Закреп | закреплённое сообщение в чате |
| 🔊 Озвучка | озвучивание текста сообщений |

---

## 🔐 Приватность

- Сообщения идут **напрямую между устройствами** (P2P/WebRTC), не через сервер хранения.
- История, контакты и настройки хранятся **только локально** на вашем устройстве.
- Удаление программы удаляет и переписку.

## 🧱 Как это сделано

| Часть | Стек |
|:--|:--|
| Интерфейс | HTML + CSS + JavaScript (без фреймворков) |
| Сеть | PeerJS (WebRTC) + STUN-серверы |
| Windows-обёртка | C# / WinForms / WebView2, всё вшито в один `.exe` |
| Android-обёртка | Java / WebView, всё внутри `.apk` |

Исходники сборки лежат в папках [`windows/`](windows) и [`android/`](android): специальный компилятор не нужен — хватает .NET Framework и Android SDK.

## 📄 Лицензия

[MIT](LICENSE) © 2026 dimacultasov6-star