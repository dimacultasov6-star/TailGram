using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace TailGramApp
{
    internal static class Program
    {
        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);
        [DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [STAThread]
        private static void Main(string[] args)
        {
            bool createdNew = false;
            Mutex mutex = new Mutex(true, "TailGram_SingleInstance_v1", out createdNew);
            if (!createdNew)
            {
                FocusExisting();
                return;
            }

            EnsureRuntime();

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string startUrl = null;
            if (args != null && args.Length > 0 && args[0].StartsWith("http")) startUrl = args[0];

            try
            {
                Application.Run(new MainForm(startUrl));
            }
            catch (Exception ex)
            {
                LogError(ex);
            }
            finally
            {
                try { mutex.ReleaseMutex(); } catch { }
            }
        }

        private static void FocusExisting()
        {
            try
            {
                IntPtr h = FindWindow(null, "TailGram");
                if (h != IntPtr.Zero)
                {
                    ShowWindow(h, 9);
                    SetForegroundWindow(h);
                }
            }
            catch { }
        }

        internal static void LogError(Exception ex)
        {
            try
            {
                string dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "TailGram");
                Directory.CreateDirectory(dir);
                File.AppendAllText(Path.Combine(dir, "error.log"),
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + Environment.NewLine + ex.ToString() + Environment.NewLine);
            }
            catch { }
        }

        private static void LogInfo(string msg)
        {
            try
            {
                string dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "TailGram");
                Directory.CreateDirectory(dir);
                File.AppendAllText(Path.Combine(dir, "error.log"),
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + " [info] " + msg + Environment.NewLine);
            }
            catch { }
        }

        private static bool IsRuntimeAvailable()
        {
            try
            {
                string v = CoreWebView2Environment.GetAvailableBrowserVersionString();
                return !string.IsNullOrEmpty(v);
            }
            catch
            {
                return false;
            }
        }

        private static void EnsureRuntime()
        {
            try
            {
                if (IsRuntimeAvailable()) return;
                LogInfo("WebView2 Runtime не найден. Пробую установить автоматически...");
                TryInstallWebView2();
                if (!IsRuntimeAvailable())
                {
                    TryInstallWebView2Elevated();
                    LogInfo("Повторная проверка: " + (IsRuntimeAvailable() ? "установлен" : "нет"));
                }
            }
            catch (Exception ex)
            {
                LogError(ex);
            }
        }

        private static void TryInstallWebView2()
        {
            try
            {
                string setup = Path.Combine(Path.GetTempPath(), "TailGram-WebView2Setup.exe");
                LogInfo("Скачиваю установщик...");
                using (WebClient wc = new WebClient())
                {
                    wc.DownloadFile("https://go.microsoft.com/fwlink/p/?LinkId=2124703", setup);
                }
                LogInfo("Запускаю установку (тихо)...");
                ProcessStartInfo psi = new ProcessStartInfo(setup, "/silent /install");
                psi.UseShellExecute = false;
                Process p = Process.Start(psi);
                if (p != null) p.WaitForExit(240000);
            }
            catch (Exception ex)
            {
                LogError(ex);
            }
        }

        private static void TryInstallWebView2Elevated()
        {
            try
            {
                string setup = Path.Combine(Path.GetTempPath(), "TailGram-WebView2Setup.exe");
                if (!File.Exists(setup)) return;
                LogInfo("Пробую установку с правами администратора...");
                ProcessStartInfo psi = new ProcessStartInfo(setup, "/silent /install");
                psi.UseShellExecute = true;
                psi.Verb = "runas";
                Process p = Process.Start(psi);
                if (p != null) p.WaitForExit(240000);
            }
            catch (Exception ex)
            {
                LogError(ex);
            }
        }
    }

    internal sealed class MainForm : Form
    {
        private const int WM_NCHITTEST = 0x0084;
        private const int WM_NCLBUTTONDOWN = 0x00A1;
        private const int HTCLIENT = 1;
        private const int HTCAPTION = 2;
        private const int HTLEFT = 10;
        private const int HTRIGHT = 11;
        private const int HTTOP = 12;
        private const int HTTOPLEFT = 13;
        private const int HTTOPRIGHT = 14;
        private const int HTBOTTOM = 15;
        private const int HTBOTTOMLEFT = 16;
        private const int HTBOTTOMRIGHT = 17;
        private const int RESIZE_GRIP = 7;

        [DllImport("user32.dll")]
        private static extern bool ReleaseCapture();
        [DllImport("user32.dll")]
        private static extern IntPtr SendMessage(IntPtr hWnd, int Msg, IntPtr wParam, IntPtr lParam);
        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

        private readonly string startUrl;
        private WebView2 web;
        private readonly LocalServer server;
        private bool maximized;
        private Rectangle restoreBounds;

        public MainForm(string startUrl)
        {
            this.startUrl = startUrl;

            this.FormBorderStyle = FormBorderStyle.None;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.MinimumSize = new Size(380, 560);
            this.Size = LoadWindowSize();
            this.BackColor = Color.FromArgb(5, 7, 13);
            this.Text = "TailGram";
            this.Icon = LoadAppIcon();
            this.Padding = new Padding(1);
            this.DoubleBuffered = true;
            this.KeyPreview = true;

            web = new WebView2();
            web.Dock = DockStyle.Fill;
            web.DefaultBackgroundColor = Color.FromArgb(5, 7, 13);
            this.Controls.Add(web);

            this.Load += OnLoaded;
            this.FormClosing += OnFormClosing;

            server = new LocalServer();
        }

        private static Icon LoadAppIcon()
        {
            try
            {
                Assembly asm = Assembly.GetExecutingAssembly();
                foreach (string name in asm.GetManifestResourceNames())
                {
                    if (name.EndsWith("app.ico", StringComparison.OrdinalIgnoreCase))
                    {
                        using (Stream s = asm.GetManifestResourceStream(name))
                        {
                            if (s != null) return new Icon(s);
                        }
                    }
                }
            }
            catch { }
            return null;
        }

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            try
            {
                int pref = 2; // DWMWCP_ROUND
                DwmSetWindowAttribute(this.Handle, 33, ref pref, sizeof(int));
            }
            catch { }
        }

        private async void OnLoaded(object sender, EventArgs e)
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            if (string.IsNullOrEmpty(appDir)) appDir = Environment.CurrentDirectory;

            if (!server.Start(appDir, 8080))
            {
                MessageBox.Show("Не удалось запустить локальный сервер TailGram.", "TailGram",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            await InitWebViewAsync();
        }

        private async Task InitWebViewAsync()
        {
            try
            {
                string userData = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "TailGram", "WebView2");
                Directory.CreateDirectory(userData);

                CoreWebView2Environment env = await CoreWebView2Environment.CreateAsync(null, userData, null);
                await web.EnsureCoreWebView2Async(env);

                CoreWebView2Settings st = web.CoreWebView2.Settings;
                st.IsStatusBarEnabled = false;
                st.AreDefaultContextMenusEnabled = false;
                st.AreDevToolsEnabled = false;
                st.IsZoomControlEnabled = false;
                st.AreBrowserAcceleratorKeysEnabled = false;
                st.IsPasswordAutosaveEnabled = false;
                st.IsGeneralAutofillEnabled = false;
                st.IsSwipeNavigationEnabled = false;

                web.CoreWebView2.PermissionRequested += (s, ev) =>
                {
                    ev.State = CoreWebView2PermissionState.Allow;
                };

                web.CoreWebView2.NewWindowRequested += OnNewWindowRequested;
                web.CoreWebView2.NavigationStarting += OnNavigationStarting;
                web.CoreWebView2.WebMessageReceived += OnWebMessageReceived;

                await web.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(
                    "window.AETHER_DESKTOP = true; document.documentElement.classList.add('native-app');");

                string url = startUrl;
                if (string.IsNullOrEmpty(url))
                    url = "http://localhost:" + server.Port + "/";
                web.CoreWebView2.Navigate(url);
            }
            catch (Exception ex)
            {
                Program.LogError(ex);
                MessageBox.Show(
                    "Для работы TailGram требуется компонент Microsoft Edge WebView2 Runtime.\n\n" +
                    "Скачайте его: https://go.microsoft.com/fwlink/p/?LinkId=2124703",
                    "TailGram", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private void OnNewWindowRequested(object sender, CoreWebView2NewWindowRequestedEventArgs e)
        {
            e.Handled = true;
            Uri u;
            if (Uri.TryCreate(e.Uri, UriKind.Absolute, out u))
            {
                if (u.Host == "localhost" || u.Host == "127.0.0.1")
                {
                    try { new MainForm(e.Uri).Show(); }
                    catch (Exception ex) { Program.LogError(ex); }
                }
                else
                {
                    try { Process.Start(e.Uri); } catch { }
                }
            }
        }

        private void OnNavigationStarting(object sender, CoreWebView2NavigationStartingEventArgs e)
        {
            Uri u;
            if (Uri.TryCreate(e.Uri, UriKind.Absolute, out u))
            {
                if (u.Scheme == "http" || u.Scheme == "https")
                {
                    if (u.Host != "localhost" && u.Host != "127.0.0.1")
                    {
                        e.Cancel = true;
                        try { Process.Start(e.Uri); } catch { }
                    }
                }
            }
        }

        private void OnWebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            string raw = null;
            try { raw = e.TryGetWebMessageAsString(); } catch { }
            if (string.IsNullOrEmpty(raw)) return;

            if (raw.IndexOf("\"error\"", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                string msg = ExtractJsonValue(raw, "message");
                try
                {
                    string dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "TailGram");
                    Directory.CreateDirectory(dir);
                    File.AppendAllText(Path.Combine(dir, "js.log"), DateTime.Now.ToString("HH:mm:ss") + " " + msg + Environment.NewLine);
                }
                catch { }
            }
            else if (raw.IndexOf("\"drag\"", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                ReleaseCapture();
                SendMessage(this.Handle, WM_NCLBUTTONDOWN, (IntPtr)HTCAPTION, IntPtr.Zero);
            }
            else if (raw.IndexOf("\"min\"", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                this.WindowState = FormWindowState.Minimized;
            }
            else if (raw.IndexOf("\"max\"", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                ToggleMaximize();
            }
            else if (raw.IndexOf("\"close\"", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                this.Close();
            }
            else if (raw.IndexOf("\"newWindow\"", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                string url = ExtractJsonValue(raw, "url");
                if (!string.IsNullOrEmpty(url))
                {
                    try { new MainForm(url).Show(); }
                    catch (Exception ex) { Program.LogError(ex); }
                }
            }
        }

        private static string ExtractJsonValue(string json, string key)
        {
            try
            {
                string needle = "\"" + key + "\":\"";
                int i = json.IndexOf(needle, StringComparison.OrdinalIgnoreCase);
                if (i < 0) return null;
                i += needle.Length;
                int j = json.IndexOf('"', i);
                if (j < 0) return null;
                return json.Substring(i, j - i);
            }
            catch { return null; }
        }

        private void ToggleMaximize()
        {
            if (maximized)
            {
                this.Bounds = restoreBounds;
                maximized = false;
            }
            else
            {
                restoreBounds = this.Bounds;
                this.Bounds = Screen.FromControl(this).WorkingArea;
                maximized = true;
            }
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == WM_NCHITTEST)
            {
                base.WndProc(ref m);
                if ((int)m.Result == HTCLIENT)
                {
                    int lp = m.LParam.ToInt32();
                    Point p = this.PointToClient(new Point(lp & 0xFFFF, (lp >> 16) & 0xFFFF));
                    int w = this.ClientSize.Width;
                    int h = this.ClientSize.Height;
                    bool left = p.X <= RESIZE_GRIP;
                    bool right = p.X >= w - RESIZE_GRIP;
                    bool top = p.Y <= RESIZE_GRIP;
                    bool bottom = p.Y >= h - RESIZE_GRIP;

                    if (top && left) m.Result = (IntPtr)HTTOPLEFT;
                    else if (top && right) m.Result = (IntPtr)HTTOPRIGHT;
                    else if (bottom && left) m.Result = (IntPtr)HTBOTTOMLEFT;
                    else if (bottom && right) m.Result = (IntPtr)HTBOTTOMRIGHT;
                    else if (left) m.Result = (IntPtr)HTLEFT;
                    else if (right) m.Result = (IntPtr)HTRIGHT;
                    else if (top) m.Result = (IntPtr)HTTOP;
                    else if (bottom) m.Result = (IntPtr)HTBOTTOM;
                }
                return;
            }
            base.WndProc(ref m);
        }

        private void OnFormClosing(object sender, FormClosingEventArgs e)
        {
            try { SaveWindowSize(this.Bounds.Size); } catch { }
            try { server.Stop(); } catch { }
        }

        private static string SettingsFile()
        {
            string dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "TailGram");
            Directory.CreateDirectory(dir);
            return Path.Combine(dir, "window.ini");
        }

        private static Size LoadWindowSize()
        {
            Size def = new Size(1120, 780);
            if (def.Width > Screen.PrimaryScreen.WorkingArea.Width) def.Width = Screen.PrimaryScreen.WorkingArea.Width;
            if (def.Height > Screen.PrimaryScreen.WorkingArea.Height) def.Height = Screen.PrimaryScreen.WorkingArea.Height;
            try
            {
                string[] parts = File.ReadAllText(SettingsFile()).Split(new char[] { ';' });
                int w = int.Parse(parts[0]);
                int h = int.Parse(parts[1]);
                if (w >= 380 && h >= 560) return new Size(w, h);
            }
            catch { }
            return def;
        }

        private static void SaveWindowSize(Size s)
        {
            try { File.WriteAllText(SettingsFile(), s.Width + ";" + s.Height); } catch { }
        }
    }

    internal sealed class LocalServer
    {
        private HttpListener listener;
        private Thread thread;
        private volatile bool running;
        private string appDir;
        private int port;

        private static readonly Dictionary<string, string> Mime = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { ".html", "text/html; charset=utf-8" },
            { ".htm",  "text/html; charset=utf-8" },
            { ".css",  "text/css; charset=utf-8" },
            { ".js",   "application/javascript; charset=utf-8" },
            { ".json", "application/json; charset=utf-8" },
            { ".png",  "image/png" },
            { ".jpg",  "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".gif",  "image/gif" },
            { ".svg",  "image/svg+xml" },
            { ".ico",  "image/x-icon" },
            { ".exe",  "application/vnd.microsoft.portable-executable" },
            { ".mp3",  "audio/mpeg" },
            { ".mp4",  "video/mp4" },
            { ".webm", "video/webm" },
            { ".ogg",  "audio/ogg" },
            { ".wav",  "audio/wav" },
            { ".woff", "font/woff" },
            { ".woff2", "font/woff2" }
        };

        public int Port
        {
            get { return port; }
        }

        public bool Start(string dir, int preferredPort)
        {
            appDir = dir;
            int[] tries = new int[] { preferredPort, preferredPort + 89 };
            foreach (int p in tries)
            {
                try
                {
                    listener = new HttpListener();
                    listener.Prefixes.Add("http://localhost:" + p + "/");
                    listener.Prefixes.Add("http://127.0.0.1:" + p + "/");
                    listener.Start();
                    port = p;
                    running = true;
                    thread = new Thread(Loop);
                    thread.IsBackground = true;
                    thread.Start();
                    return true;
                }
                catch
                {
                    try { if (listener != null) listener.Close(); } catch { }
                    listener = null;
                }
            }
            return false;
        }

        public void Stop()
        {
            running = false;
            try
            {
                if (listener != null && listener.IsListening) listener.Stop();
            }
            catch { }
        }

        private void Loop()
        {
            while (running && listener != null && listener.IsListening)
            {
                HttpListenerContext ctx;
                try { ctx = listener.GetContext(); }
                catch { if (!running) break; continue; }

                ThreadPool.QueueUserWorkItem(delegate (object state)
                {
                    HttpListenerContext c = (HttpListenerContext)state;
                    try
                    {
                        string rawPath = c.Request.Url.AbsolutePath;
                        if (string.IsNullOrEmpty(rawPath) || rawPath == "/") rawPath = "/index.html";
                        string rel = rawPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);

                        string contentType;
                        byte[] data = GetContent(rel, out contentType);
                        if (data != null)
                        {
                            c.Response.StatusCode = 200;
                            c.Response.ContentType = contentType;
                            c.Response.ContentLength64 = data.Length;
                            c.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                            c.Response.Headers.Add("Cache-Control", "no-cache");
                            c.Response.OutputStream.Write(data, 0, data.Length);
                        }
                        else
                        {
                            c.Response.StatusCode = 404;
                            byte[] err = Encoding.UTF8.GetBytes("404 Not Found");
                            c.Response.ContentType = "text/plain; charset=utf-8";
                            c.Response.ContentLength64 = err.Length;
                            c.Response.OutputStream.Write(err, 0, err.Length);
                        }
                    }
                    catch { }
                    finally
                    {
                        try { c.Response.Close(); } catch { }
                    }
                }, ctx);
            }
        }

        private byte[] GetContent(string rel, out string contentType)
        {
            try
            {
                string fileName = Path.GetFileName(rel);
                if (string.IsNullOrEmpty(fileName)) fileName = "index.html";
                Assembly asm = Assembly.GetExecutingAssembly();
                foreach (string res in asm.GetManifestResourceNames())
                {
                    if (res.EndsWith(fileName, StringComparison.OrdinalIgnoreCase))
                    {
                        using (Stream s = asm.GetManifestResourceStream(res))
                        {
                            if (s != null)
                            {
                                byte[] buf = new byte[s.Length];
                                int read = 0, r;
                                while ((r = s.Read(buf, read, buf.Length - read)) > 0) read += r;
                                string ext = Path.GetExtension(fileName);
                                contentType = Mime.ContainsKey(ext) ? Mime[ext] : "application/octet-stream";
                                return buf;
                            }
                        }
                    }
                }
            }
            catch { }

            try
            {
                string filePath = Path.Combine(appDir, rel);
                if (File.Exists(filePath))
                {
                    string ext = Path.GetExtension(filePath);
                    contentType = Mime.ContainsKey(ext) ? Mime[ext] : "application/octet-stream";
                    return File.ReadAllBytes(filePath);
                }
            }
            catch { }

            contentType = "text/plain";
            return null;
        }
    }
}
