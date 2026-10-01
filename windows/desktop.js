/* TailGram — Desktop bridge & UI enhancements */
(function () {
    "use strict";

    var isDesktop = !!(window.chrome && window.chrome.webview && window.chrome.webview.postMessage);
    if (isDesktop) document.body.classList.add("is-desktop");

    function post(msg) {
        try { if (isDesktop) window.chrome.webview.postMessage(JSON.stringify(msg)); } catch (e) {}
    }

    /* ---------- Forward JS errors to the native host log ---------- */
    window.addEventListener("error", function (ev) {
        post({ type: "error", message: (ev.message || "error") + " @" + (ev.filename || "") + ":" + (ev.lineno || 0) });
    });
    window.addEventListener("unhandledrejection", function (ev) {
        var r = ev.reason;
        post({ type: "error", message: "promise: " + (r && r.message ? r.message : String(r)) });
    });

    /* ---------- Window controls ---------- */
    var btnMin = document.getElementById("winMin");
    var btnMax = document.getElementById("winMax");
    var btnClose = document.getElementById("winClose");
    if (btnMin) btnMin.addEventListener("click", function () { post({ type: "min" }); });
    if (btnMax) btnMax.addEventListener("click", function () { post({ type: "max" }); });
    if (btnClose) btnClose.addEventListener("click", function () { post({ type: "close" }); });

    var titlebar = document.getElementById("desktopTitlebar");
    if (titlebar) {
        titlebar.addEventListener("mousedown", function (e) {
            if (e.target.closest(".tb-controls")) return;
            if (e.button !== 0) return;
            post({ type: "drag" });
        });
        titlebar.addEventListener("dblclick", function (e) {
            if (e.target.closest(".tb-controls")) return;
            post({ type: "max" });
        });
    }

    if (isDesktop) {
        var dl = document.getElementById("downloadExeLink");
        if (dl) dl.style.display = "none";
    }

    /* ---------- Splash ---------- */
    var splashStart = Date.now();
    function hideSplash() {
        var el = document.getElementById("splashScreen");
        if (!el || el.classList.contains("hidden")) return;
        el.classList.add("hidden");
        setTimeout(function () { el.style.display = "none"; }, 600);
    }
    setTimeout(hideSplash, 1100);
    window.addEventListener("load", function () {
        setTimeout(hideSplash, Math.max(0, 900 - (Date.now() - splashStart)));
    });

    /* ---------- Welcome / first-run onboarding ---------- */
    var welcome = document.getElementById("welcomeScreen");
    var welcomeInput = document.getElementById("welcomeNickInput");
    var welcomeBtn = document.getElementById("welcomeBtn");
    var welcomeTitle = document.getElementById("welcomeTitle");
    var welcomeSubtitle = document.getElementById("welcomeSubtitle");
    var welcomeHint = document.getElementById("welcomeHint");
    var welcomeError = document.getElementById("welcomeError");

    function updateWelcomeHint() {
        if (!welcomeHint || !welcomeInput) return;
        var raw = welcomeInput.value.trim();
        if (!raw) { welcomeHint.textContent = ""; return; }
        var safe = toSafeId(raw);
        welcomeHint.textContent = safe ? ("Ваш ID: @" + safe) : "";
    }

    function showWelcome(isFirstRun, preset) {
        if (!welcome) return;
        if (welcomeTitle) welcomeTitle.textContent = isFirstRun ? "Добро пожаловать" : "Изменение профиля";
        if (welcomeSubtitle) welcomeSubtitle.textContent = isFirstRun
            ? "Придумайте никнейм — на его основе будет создан ваш уникальный ID для связи с друзьями."
            : "Введите новый никнейм. Ваш ID и контакты сохранятся.";
        if (welcomeInput) welcomeInput.value = preset || "";
        if (welcomeError) welcomeError.textContent = "";
        updateWelcomeHint();
        welcome.classList.add("open");
        setTimeout(function () { if (welcomeInput) welcomeInput.focus(); }, 260);
    }

    function submitWelcome() {
        if (!welcomeInput) return;
        var raw = welcomeInput.value.trim();
        if (!raw) {
            if (welcomeError) welcomeError.textContent = "Введите никнейм, чтобы продолжить.";
            return;
        }
        var safe = toSafeId(raw);
        if (!safe) {
            if (welcomeError) welcomeError.textContent = "Используйте буквы, цифры и символ _ -";
            return;
        }
        AppManager.db.profile.nick = raw;
        AppManager.db.profile.peerId = safe;
        AppManager.saveStorage();
        if (welcome) welcome.classList.remove("open");
        AppManager.initPeerNetwork();
        AppManager.render();
        AppManager.showToast("Добро пожаловать, " + raw + "! 🚀");
    }

    if (welcomeInput) {
        welcomeInput.addEventListener("input", updateWelcomeHint);
        welcomeInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") submitWelcome();
        });
    }
    if (welcomeBtn) welcomeBtn.addEventListener("click", submitWelcome);

    // Replace the plain browser prompt with a polished onboarding screen
    AppManager.editNick = function (suggested) {
        var isFirstRun = !this.db.profile.nick;
        try { this.ui.closeModal("settingsModal"); } catch (e) {}
        showWelcome(isFirstRun, suggested || this.db.profile.nick || "");
    };

    // If a profile already exists, make sure the welcome overlay is hidden
    window.addEventListener("DOMContentLoaded", function () {
        if (AppManager.db.profile && AppManager.db.profile.nick && welcome) {
            welcome.classList.remove("open");
        }
    });

    /* ---------- Extra UX polish ---------- */
    function focusComposer() {
        var box = document.getElementById("msgInputBox");
        if (box) box.focus();
    }
    var origOpenChat = AppManager.openChat.bind(AppManager);
    AppManager.openChat = function (peerId, title) {
        origOpenChat(peerId, title);
        setTimeout(focusComposer, 340);
    };

    AppManager.openSecondTab = function () {
        if (isDesktop) {
            post({ type: "newWindow", url: location.href.split("?")[0] + "?user=2" });
        } else {
            var u = new URL(window.location.href);
            u.searchParams.set("user", "2");
            window.open(u.toString(), "_blank");
        }
    };

    document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        document.querySelectorAll(".modal-overlay.open").forEach(function (m) { m.classList.remove("open"); });
        document.querySelectorAll(".modal-overlay").forEach(function (m) { if (m.style.display === "flex") m.style.display = "none"; });
        document.querySelectorAll(".emoji-panel.active, .attach-menu.active").forEach(function (p) { p.classList.remove("active"); });
    });

    /* ---------- Ripple animation on primary buttons ---------- */
    var rippleStyle = document.createElement("style");
    rippleStyle.textContent = ".ag-ripple{position:absolute;border-radius:50%;transform:scale(0);animation:agRipple .6s ease-out;background:rgba(255,255,255,.32);pointer-events:none;}@keyframes agRipple{to{transform:scale(3.2);opacity:0;}}";
    document.head.appendChild(rippleStyle);

    function attachRipple(el) {
        if (el.dataset.rippleReady) return;
        el.dataset.rippleReady = "1";
        var cs = getComputedStyle(el);
        if (cs.position === "static") el.style.position = "relative";
        el.style.overflow = "hidden";
        el.addEventListener("pointerdown", function (e) {
            var rect = el.getBoundingClientRect();
            var size = Math.max(rect.width, rect.height);
            var span = document.createElement("span");
            span.className = "ag-ripple";
            span.style.width = span.style.height = size + "px";
            span.style.left = (e.clientX - rect.left - size / 2) + "px";
            span.style.top = (e.clientY - rect.top - size / 2) + "px";
            el.appendChild(span);
            setTimeout(function () { span.remove(); }, 620);
        });
    }

    function wireRipples() {
        document.querySelectorAll(".send-main-btn, .action-btn").forEach(attachRipple);
    }
    wireRipples();
    window.addEventListener("DOMContentLoaded", wireRipples);
})();
