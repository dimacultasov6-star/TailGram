# Сборка TailGram для Windows

Всё внутри одного `TailGram.exe`: `index.html`, `app.js`, `desktop.js`, иконка и логотип
вшиты в exe как ресурсы. Рядом с exe нужны только три DLL-библиотеки WebView2.

## Нужно

1. .NET Framework 4.x — есть в любой Windows 10/11 из коробки
   (используется компилятор `csc.exe`, входит в состав .NET Framework).
2. Microsoft Edge WebView2 Runtime — ставится автоматически при первом запуске
   (или заранее: <https://go.microsoft.com/fwlink/p/?LinkId=2124703>)

Сторонних библиотек, NuGet и специальных IDE не нужно.

## Файлы

| Файл | Назначение |
|:--|:--|
| `TailGram.cs` | исходник оболочки (WinForms + WebView2 + локальный HTTP-сервер) |
| `index.html` | интерфейс (шаблоны, стили) |
| `app.js` | логика мессенджера: PeerJS, чаты, сообщения, звонки |
| `desktop.js` | мост в native-оболочку (окно, лог ошибок) |
| `logo.png`, `app.ico` | логотип и иконка |

## Сборка

```powershell
cd windows

csc /nologo /optimize+ /codepage:65001 /target:winexe `
    /out:TailGram.exe /win32icon:app.ico `
    /r:System.dll /r:System.Core.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll `
    /r:Microsoft.Web.WebView2.Core.dll /r:Microsoft.Web.WebView2.WinForms.dll `
    /res:index.html /res:app.js /res:desktop.js /res:logo.png /res:app.ico `
    TailGram.cs
```

Полный путь к компилятору: `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe`

DLL-библиотеки WebView2 берутся из папки сборки проекта
(`Microsoft.Web.WebView2.Core.dll`, `Microsoft.Web.WebView2.WinForms.dll`, `WebView2Loader.dll`).

## Что внутри exe

- окно без рамки со своим заголовком, сворачиванием и перетаскиванием
- локальный HTTP-сервер на `localhost:8080`, который отдаёт встроенные ресурсы
- автоматическая установка WebView2 Runtime при первом запуске
- приём сообщений от интерфейса: свернуть / развернуть / закрыть / новое окно
- запись ошибок JavaScript в `%LOCALAPPDATA%\TailGram\error.log`

## Как это работает

Интерфейс — обычные HTML/CSS/JS, поэтому всё содержимое вшивается в exe как ресурсы
(`/res:`). При запуске оболочка поднимает локальный сервер и открывает в WebView2
`http://localhost:8080/`. Связь между пользователями идёт напрямую через PeerJS (WebRTC),
сервер хранения сообщений не используется.