// --- CROSS-BROWSER MIME TYPE DETECTOR (iOS + Android) ---
    function getSupportedAudioMimeType() {
        const types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/aac'];
        for (let t of types) {
            if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
        }
        return '';
    }

    function getSupportedVideoMimeType() {
        const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm'];
        for (let t of types) {
            if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
        }
        return '';
    }

    // --- SOUND ENGINE (Web Audio API) ---
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.enabled = true;
        }

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        }

        playSend() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(650, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.11);
        }

        playReceive() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [523, 659].forEach((f, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, now + i * 0.08);
                gain.gain.setValueAtTime(0.18, now + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + i * 0.08);
                osc.stop(now + i * 0.08 + 0.16);
            });
        }

        playGift() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            [440, 554, 659, 880].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);
                gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.06 + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + idx * 0.06);
                osc.stop(this.ctx.currentTime + idx * 0.06 + 0.26);
            });
        }
    }

    // --- CONFETTI CANNON ---
    class ConfettiCannon {
        constructor() {
            this.canvas = document.getElementById('confettiCanvas');
            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.animating = false;
            window.addEventListener('resize', () => this.resize());
            this.resize();
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        fire() {
            this.resize();
            const colors = ['#f59e0b', '#38bdf8', '#ef4444', '#10b981', '#a855f7', '#ec4899', '#facc15'];
            for (let i = 0; i < 80; i++) {
                this.particles.push({
                    x: window.innerWidth / 2, y: window.innerHeight / 2,
                    vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.8) * 15,
                    size: Math.random() * 7 + 4, color: colors[Math.floor(Math.random() * colors.length)],
                    rotation: Math.random() * 360, vRot: (Math.random() - 0.5) * 12, life: 1
                });
            }
            if (!this.animating) {
                this.animating = true;
                this.loop();
            }
        }

        loop() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.particles.forEach((p) => {
                p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.rotation += p.vRot; p.life -= 0.014;
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate((p.rotation * Math.PI) / 180);
                this.ctx.globalAlpha = Math.max(0, p.life);
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                this.ctx.restore();
            });
            this.particles = this.particles.filter(p => p.life > 0);
            if (this.particles.length > 0) requestAnimationFrame(() => this.loop());
            else { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); this.animating = false; }
        }
    }

    function transliterate(text) {
        if (!text) return '';
        const map = {
            'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y',
            'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
            'х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
        };
        return text.split('').map(c => map[c.toLowerCase()] !== undefined ? map[c.toLowerCase()] : c).join('');
    }

    function toSafeId(input) {
        if (!input) return '';
        return transliterate(input.trim().toLowerCase())
            .replace(/[^a-z0-9_-]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    class UIManager {
        openModal(id) { document.getElementById(id).style.display = 'flex'; }
        closeModal(id) { document.getElementById(id).style.display = 'none'; }
    }

    // --- ENTERPRISE MESSENGER ENGINE ---
    class EnterpriseMessenger {
        constructor() {
            this.peer = null;
            this.myPeerId = '';
            this.connections = {};
            this.pendingQueue = {};
            this.activeChat = null;
            this.typing = {};
            this.lastTypingSent = {};
            this.typingTimers = {};
            this.replyingTo = null;
            this.currentFolder = 'all';

            // Stories
            this.storyViewer = null;
            this.storyTimer = null;
            this.storyComposerImage = '';
            this.storiesCleanupTimer = null;

            this.sound = new SoundEngine();
            this.confetti = new ConfettiCannon();
            this.ui = new UIManager();

            // Mobile Media
            this.circleFacingMode = 'user';
            this.callFacingMode = 'user';
            this.circleStream = null;
            this.mediaRecorder = null;
            this.recordedChunks = [];
            this.recordSeconds = 0;

            // Live mic analyser
            this.audioCtx = null;
            this.analyser = null;
            this.analyserInterval = null;

            // Calls
            this.localStream = null;
            this.currentCall = null;
            this.incomingCallObj = null;
            this.callTimerInterval = null;
            this.callSeconds = 0;

            // Tic-Tac-Toe
            this.gameBoard = Array(9).fill(null);
            this.gameActive = false;

            // Storage
            const urlParams = new URLSearchParams(window.location.search);
            this.sessionKey = urlParams.get('user') || urlParams.get('session') || '';
            this.storageKey = this.sessionKey ? `tg_db_${this.sessionKey}` : 'tg_enterprise_ultra_v2_db';

            this.db = {
                profile: { nick: '', peerId: '', avatar: '', stars: 200, theme: 'puppy', sound: true },
                contacts: {},
                history: {},
                pinned: {},
                groups: {},
                stories: {},
                banned: {}
            };
        }

        init() {
            this.loadStorage();
            this.setTheme(this.db.profile.theme || 'puppy');
            this.sound.enabled = this.db.profile.sound !== false;
            document.getElementById('soundToggle').checked = this.sound.enabled;
            this.updateStarsDisplay();
            this.initEmojiPicker();
            this.ensureDefaultChats();
            this.initTouchGestures();
            this.initMobileViewport();

            // Unlock audio on mobile touch
            window.addEventListener('touchstart', () => this.sound.init(), { once: true });

            // Close message context menu on outside click / escape / scroll
            window.addEventListener('mousedown', (ev) => {
                const menu = document.querySelector('.message-context-menu');
                if (menu && (!ev.target || !ev.target.closest || !ev.target.closest('.message-context-menu'))) this.hideMessageContextMenu();
            });
            window.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') this.hideMessageContextMenu(); });
            window.addEventListener('blur', () => this.hideMessageContextMenu());
            window.addEventListener('scroll', () => this.hideMessageContextMenu(), true);

            if (!this.db.profile.nick) {
                const defaultNick = this.sessionKey ? `User_${this.sessionKey}` : '';
                this.editNick(defaultNick);
            } else {
                this.initPeerNetwork();
            }
            this.db.stories = this.db.stories || {};
            this.cleanupStories();
            this.renderStories();
            this.startStoriesCleanupTimer();
            this.render();
            this.onInputBoxChange();

            setInterval(() => this.connectContacts(), 25000);
        }

        initMobileViewport() {
            if (window.visualViewport) {
                const handleViewport = () => {
                    const h = window.visualViewport.height;
                    const root = document.getElementById('appRoot');
                    if (root) {
                        root.style.height = `${h}px`;
                    }
                    if (this.activeChat) {
                        const area = document.getElementById('messagesArea');
                        if (area) area.scrollTop = area.scrollHeight;
                    }
                };
                window.visualViewport.addEventListener('resize', handleViewport);
                window.visualViewport.addEventListener('scroll', handleViewport);
            }
        }

        initTouchGestures() {
            // Touch swipe to go back from chat on phones (iOS style)
            let startX = 0;
            const dialog = document.getElementById('dialogView');
            dialog.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
            }, { passive: true });

            dialog.addEventListener('touchend', (e) => {
                const diffX = e.changedTouches[0].clientX - startX;
                if (startX < 50 && diffX > 80) {
                    this.closeChat();
                }
            }, { passive: true });
        }

        ensureDefaultChats() {
            if (!this.db.contacts['ai_bot']) {
                this.db.contacts['ai_bot'] = {
                    nick: '🤖 ИИ Ассистент',
                    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
                    isBot: true
                };
                this.db.history['ai_bot'] = [{
                    id: 'init_ai', sender: 'ai_bot',
                    text: '👋 Привет! Я ваш персональный ИИ-ассистент TailGram. Могу написать код, ответить на вопрос или предложить креативную идею!',
                    time: this.formatTime()
                }];
            }
            if (!this.db.contacts['saved_notes']) {
                this.db.contacts['saved_notes'] = {
                    nick: '⭐ Избранное', avatar: '', isSaved: true
                };
                this.db.history['saved_notes'] = [{
                    id: 'init_saved', sender: 'my',
                    text: '📌 Облако личных заметок и файлов.',
                    time: this.formatTime()
                }];
            }
            this.saveStorage();
        }

        loadStorage() {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    this.db = Object.assign(this.db, parsed);
                    this.db.profile = this.db.profile || {};
                    if (!this.db.profile.theme || this.db.profile.theme === 'dark') {
                        this.db.profile.theme = 'puppy';
                    }
                } catch(e) {}
            }
        }

        saveStorage() {
            try { localStorage.setItem(this.storageKey, JSON.stringify(this.db)); } catch(e) {}
        }

        setTheme(theme) {
            this.db.profile.theme = theme;
            document.body.setAttribute('data-theme', theme);
            this.saveStorage();
        }

        toggleSound(enabled) {
            this.sound.enabled = enabled;
            this.db.profile.sound = enabled;
            this.saveStorage();
        }

        updateStarsDisplay() {
            document.getElementById('myStarsVal').textContent = this.db.profile.stars;
            document.getElementById('modalStarsVal').textContent = this.db.profile.stars;
        }

        spinWheelBonus() {
            const prize = [50, 75, 100, 150][Math.floor(Math.random() * 4)];
            this.db.profile.stars += prize;
            this.saveStorage();
            this.updateStarsDisplay();
            this.sound.playGift();
            this.confetti.fire();
            this.showToast(`🎉 +${prize} ⭐ начислено!`);
        }

        editNick(suggested = "") {
            const current = suggested || this.db.profile.nick || "";
            const nick = prompt("Введите никнейм:", current);
            if (nick && nick.trim()) {
                const cleanNick = nick.trim();
                let cleanId = toSafeId(cleanNick) || ('user_' + Math.floor(1000 + Math.random() * 9000));
                this.db.profile.nick = cleanNick;
                this.db.profile.peerId = cleanId;
                this.saveStorage();
                this.initPeerNetwork();
                this.render();
            } else if (!this.db.profile.nick) {
                const fallbackId = 'user_' + Math.floor(1000 + Math.random() * 9000);
                this.db.profile.nick = fallbackId;
                this.db.profile.peerId = fallbackId;
                this.saveStorage();
                this.initPeerNetwork();
                this.render();
            }
        }

        initPeerNetwork() {
            let pid = this.db.profile.peerId || toSafeId(this.db.profile.nick);
            if (!pid) pid = 'user_' + Math.floor(1000 + Math.random() * 9000);
            this.myPeerId = pid;
            this.db.profile.peerId = pid;
            this.saveStorage();

            document.getElementById('myNickLabel').textContent = this.db.profile.nick || pid;
            document.getElementById('myPeerIdLabel').textContent = pid;
            document.getElementById('settingsIdVal').textContent = pid;
            if (this.db.profile.avatar) {
                document.getElementById('myAvatarBox').innerHTML = `<img src="${this.db.profile.avatar}">`;
            }

            this.renderStories();

            if (this.peer) {
                try { this.peer.destroy(); } catch(e) {}
            }

            this.setNetworkStatus('connecting');

            this.peer = new Peer(this.myPeerId, {
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            this.peer.on('open', (id) => {
                this.myPeerId = id;
                this.db.profile.peerId = id;
                this.saveStorage();
                document.getElementById('myPeerIdLabel').textContent = id;
                document.getElementById('settingsIdVal').textContent = id;
                this.setNetworkStatus('online');
                this.updateAdminUI();
                this.connectContacts();
            });

            this.peer.on('connection', (conn) => this.setupConnection(conn));

            this.peer.on('call', (call) => {
                this.incomingCallObj = call;
                const contactNick = this.db.contacts[call.peer]?.nick || call.peer;
                document.getElementById('incomingCallerText').textContent = `@${contactNick} вызывает вас...`;
                this.sound.playReceive();
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                this.ui.openModal('incomingCallModal');
            });

            this.peer.on('disconnected', () => {
                this.setNetworkStatus('offline');
                try { this.peer.reconnect(); } catch(e) {}
            });

            this.peer.on('error', (err) => {
                if (err.type === 'unavailable-id') {
                    const rnd = Math.floor(100 + Math.random() * 900);
                    const newId = `${toSafeId(this.db.profile.nick)}_${rnd}`;
                    this.db.profile.peerId = newId;
                    this.saveStorage();
                    setTimeout(() => this.initPeerNetwork(), 500);
                } else if (err.type === 'peer-unavailable') {
                    if (this.activeChat) this.updateChatHeaderStatus(false);
                }
            });
        }

        setNetworkStatus(status) {
            const dot = document.getElementById('myStatusDot');
            if (!dot) return;
            if (status === 'online') dot.style.background = '#22c55e';
            else if (status === 'connecting') dot.style.background = '#eab308';
            else dot.style.background = '#ef4444';
        }

        connectContacts() {
            Object.keys(this.db.contacts).forEach(id => {
                const c = this.db.contacts[id] || {};
                if (id !== 'ai_bot' && id !== 'saved_notes' && !c.isGroup && !c.isChannel) {
                    if (this.isBannedPeer(id)) return;
                    if (!this.connections[id] || !this.connections[id].open) {
                        this.connectToPeer(id);
                    }
                }
            });
        }

        connectToPeer(targetPeerId) {
            if (!this.peer || this.peer.destroyed || targetPeerId === this.myPeerId) return;
            if (this.isBannedPeer(targetPeerId)) return;
            if (this.connections[targetPeerId] && this.connections[targetPeerId].open) return;
            try {
                const conn = this.peer.connect(targetPeerId, { reliable: true });
                this.setupConnection(conn);
            } catch(e) {}
        }

        setupConnection(conn) {
            const peerId = conn.peer;

            const onConnectionOpen = () => {
                if (this.isBannedPeer(peerId)) {
                    try { conn.send({ type: 'ban', nick: this.db.profile.nick }); } catch(e) {}
                    try { conn.close(); } catch(e) {}
                    return;
                }
                this.connections[peerId] = conn;
                if (!this.db.contacts[peerId]) this.db.contacts[peerId] = { nick: peerId, avatar: '' };
                if (!this.db.history[peerId]) this.db.history[peerId] = [];
                this.saveStorage();
                this.renderChats();

                if (this.activeChat === peerId) this.updateChatHeaderStatus(true);
                try {
                    conn.send({ type: 'sync', nick: this.db.profile.nick, avatar: this.db.profile.avatar });
                } catch(e) {}

                this.requeueUndelivered(peerId);
                this.flushQueue(peerId);
                this.sendMyStoriesTo(peerId);
            };

            if (conn.open) onConnectionOpen();
            else conn.on('open', onConnectionOpen);

            conn.on('data', (data) => this.handleData(peerId, data));
            conn.on('close', () => { this.clearTypingState(peerId); delete this.connections[peerId]; if (this.activeChat === peerId) this.updateChatHeaderStatus(false); this.renderChats(); });
            conn.on('error', () => { this.clearTypingState(peerId); delete this.connections[peerId]; if (this.activeChat === peerId) this.updateChatHeaderStatus(false); this.renderChats(); });
        }

        handleData(sender, data) {
            if (!data) return;

            if (data.type === 'ban') {
                this.showToast('⛔ Администратор заблокировал вас');
                try { if (this.connections[sender]) this.connections[sender].close(); } catch(e) {}
                return;
            }
            if (data.type === 'admin-ban') {
                const bid = data.id;
                if (bid && bid !== this.myPeerId) {
                    if (!this.db.banned) this.db.banned = {};
                    this.db.banned[bid] = { nick: data.nick || bid, time: Date.now(), by: data.admin || '' };
                    if (this.db.contacts[bid]) this.db.contacts[bid].banned = true;
                    this.saveStorage();
                    if (this.connections[bid]) { try { this.connections[bid].close(); } catch(e) {} delete this.connections[bid]; }
                    if (this.activeChat === bid) this.closeChat();
                    this.renderChats();
                    this.updateAdminUI();
                    this.showToast('⛔ @' + (data.nick || bid) + ' заблокирован администратором');
                }
                return;
            }
            if (this.isBannedPeer(sender)) return;

            if (data.type === 'sync') {
                if (!this.db.contacts[sender]) this.db.contacts[sender] = { nick: data.nick || sender, avatar: '' };
                if (data.nick) this.db.contacts[sender].nick = data.nick;
                if (data.avatar) this.db.contacts[sender].avatar = data.avatar;
                this.saveStorage();
                this.renderChats();
                if (this.activeChat === sender) this.updateActiveChatInfo();
            } else if (data.type === 'msg') {
                if (!this.db.history[sender]) this.db.history[sender] = [];
                if (!this.db.history[sender].some(m => m.id === data.id)) {
                    this.db.history[sender].push(data.payload);
                    this.saveStorage();
                    this.sound.playReceive();
                    if (navigator.vibrate) navigator.vibrate(60);
                    this.pushNotify(sender, data.payload);
                    if (data.payload.gift) {
                        this.confetti.fire();
                        this.sound.playGift();
                    }
                    if (this.activeChat === sender) this.renderMessages();
                    this.renderChats();

                    if (this.connections[sender] && this.connections[sender].open) {
                        try { this.connections[sender].send({ type: 'ack', id: data.id }); } catch(e) {}
                    }
                }
            } else if (data.type === 'ack') {
                const hist = this.db.history[sender] || [];
                const m = hist.find(item => item.id === data.id);
                if (m) {
                    m.delivered = true;
                    this.saveStorage();
                    this.renderChats();
                    if (this.activeChat === sender) this.renderMessages();
                }
            } else if (data.type === 'typing') {
                this.handlePeerTyping(sender, data.on);
            } else if (data.type === 'msg-edit') {
                const histE = this.db.history[sender] || [];
                const me = histE.find(x => x.id === data.id);
                if (me && data.text) {
                    me.text = data.text;
                    me.edited = true;
                    this.saveStorage();
                    if (this.activeChat === sender) this.renderMessages();
                    this.renderChats();
                }
            } else if (data.type === 'group-msg-edit') {
                const histGE = this.db.history[data.groupId] || [];
                const mge = histGE.find(x => x.id === data.id);
                if (mge && data.text) {
                    mge.text = data.text;
                    mge.edited = true;
                    this.saveStorage();
                    if (this.activeChat === data.groupId) this.renderMessages();
                    this.renderChats();
                }
            } else if (data.type === 'msg-delete') {
                const hist = this.db.history[sender] || [];
                const idx = hist.findIndex(item => item.id === data.id);
                if (idx !== -1) {
                    hist.splice(idx, 1);
                    this.saveStorage();
                    if (this.activeChat === sender) this.renderMessages();
                    this.renderChats();
                }
            } else if (data.type === 'group-msg-delete') {
                const hist = this.db.history[data.groupId] || [];
                const idx = hist.findIndex(item => item.id === data.id);
                if (idx !== -1) {
                    hist.splice(idx, 1);
                    this.saveStorage();
                    if (this.activeChat === data.groupId) this.renderMessages();
                    this.renderChats();
                }
            } else if (data.type === 'reaction') {
                const hist = this.db.history[sender] || [];
                const m = hist.find(item => item.id === data.msgId);
                if (m) {
                    if (!m.reactions) m.reactions = {};
                    m.reactions[data.emoji] = (m.reactions[data.emoji] || 0) + 1;
                    this.saveStorage();
                    if (this.activeChat === sender) this.renderMessages();
                }
            } else if (data.type === 'story') {
                const st = data.story || {};
                if (!st || !st.id || st.owner === this.myPeerId) return;
                if (st.owner !== sender) return;
                if (!this.hasCommunicated(sender)) return;
                if (!this.db.stories) this.db.stories = {};
                if (!st.expiresAt) st.expiresAt = (st.time || Date.now()) + 24 * 60 * 60 * 1000;
                if (st.expiresAt <= Date.now()) return;
                if (!this.db.stories[st.id]) {
                    st.mine = false;
                    st.read = false;
                    this.db.stories[st.id] = st;
                    this.db.contacts[st.owner] = this.db.contacts[st.owner] || { nick: st.owner, avatar: '' };
                    if (st.ownerNick) this.db.contacts[st.owner].nick = st.ownerNick;
                    if (st.ownerAvatar) this.db.contacts[st.owner].avatar = st.ownerAvatar;
                    this.saveStorage();
                    this.renderStories();
                    this.sound.playReceive();
                }
            } else if (data.type === 'story-view') {
                const st = (this.db.stories || {})[data.storyId];
                if (st && st.owner === this.myPeerId && data.by) {
                    if (!st.views) st.views = {};
                    st.views[data.by] = Date.now();
                    this.saveStorage();
                    if (this.storyViewer) {
                        const cur = this.storyViewer.list[this.storyViewer.index];
                        if (cur && cur.id === st.id) this.updateStoryViewerMeta(cur);
                    }
                }
            } else if (data.type === 'story-delete') {
                const st = (this.db.stories || {})[data.id];
                if (st && st.owner === sender) {
                    delete this.db.stories[data.id];
                    this.saveStorage();
                    this.renderStories();
                    const v = this.storyViewer;
                    if (v) {
                        v.list = v.list.filter(s => s.id !== data.id);
                        if (!v.list.length) { this.closeStoryViewer(); }
                        else { if (v.index >= v.list.length) v.index = v.list.length - 1; this.renderStoryViewer(); }
                    }
                }
            } else if (data.type === 'group-msg') {
                const msg = data.payload;
                if (!data.groupId || !msg) return;
                if (!this.db.groups[data.groupId]) {
                    this.db.groups[data.groupId] = {
                        id: data.groupId,
                        name: data.groupName || data.groupId,
                        type: data.groupType || 'group',
                        members: [],
                        admins: [],
                        avatar: data.groupAvatar || ''
                    };
                    this.db.contacts[data.groupId] = {
                        nick: this.db.groups[data.groupId].name,
                        avatar: data.groupAvatar || '',
                        isGroup: true,
                        isChannel: data.groupType === 'channel'
                    };
                }
                if (!this.db.history[data.groupId]) this.db.history[data.groupId] = [];
                if (!this.db.history[data.groupId].some(m => m.id === data.id)) {
                    this.db.history[data.groupId].push(msg);
                    this.saveStorage();
                    this.sound.playReceive();
                    if (navigator.vibrate) navigator.vibrate(60);
                    if (this.activeChat === data.groupId) this.renderMessages();
                    this.renderChats();
                }
            } else if (data.type === 'group-invite') {
                const g = data.group || {};
                if (!g.id || !g.name) return;
                const existing = this.db.groups[g.id];
                if (existing) {
                    existing.members = Array.from(new Set([...(existing.members || []), ...(g.members || [])]));
                    existing.admins = Array.from(new Set([...(existing.admins || []), ...(g.admins || [])]));
                    if (g.owner) existing.owner = g.owner;
                    if (g.avatar) existing.avatar = g.avatar;
                    if (g.desc) existing.desc = g.desc;
                } else {
                    this.db.groups[g.id] = g;
                }
                this.db.contacts[g.id] = { nick: g.name, avatar: g.avatar, isGroup: true, isChannel: g.type === 'channel' };
                if (!this.db.history[g.id]) this.db.history[g.id] = [];
                this.saveStorage();
                this.renderChats();
                this.showToast(`Вас добавили в «${g.name}» ${g.type === 'channel' ? '📣' : '👥'}`);
            }
        }

        queueMessage(peerId, msgObj) {
            if (!this.pendingQueue[peerId]) this.pendingQueue[peerId] = [];
            this.pendingQueue[peerId].push(msgObj);
        }

        flushQueue(peerId) {
            const queue = this.pendingQueue[peerId];
            if (queue && queue.length > 0) {
                const conn = this.connections[peerId];
                if (conn && conn.open) {
                    while (queue.length > 0) {
                        const msg = queue.shift();
                        try { conn.send(msg); } catch(e) {}
                    }
                }
            }
        }

        requeueUndelivered(peerId) {
            const contact = this.db.contacts[peerId] || {};
            if (contact.isGroup || contact.isChannel) return;
            if (peerId === 'ai_bot' || peerId === 'saved_notes') return;
            const hist = this.db.history[peerId] || [];
            hist.forEach(m => {
                const isMy = m.sender === 'my' || m.sender === this.myPeerId;
                if (!isMy || m.delivered) return;
                this.queueMessage(peerId, { type: 'msg', id: m.id, payload: m });
            });
        }

        reportTyping(isTyping) {
            const chatId = this.activeChat;
            if (!chatId || chatId === 'ai_bot' || chatId === 'saved_notes') return;
            const contact = this.db.contacts[chatId] || {};
            if (contact.isGroup || contact.isChannel) return;
            const conn = this.connections[chatId];
            if (!conn || !conn.open) return;
            const now = Date.now();
            if (isTyping) {
                if (now - (this.lastTypingSent[chatId] || 0) < 2000) return;
                this.lastTypingSent[chatId] = now;
                try { conn.send({ type: 'typing', on: true }); } catch(e) {}
            } else {
                try { conn.send({ type: 'typing', on: false }); } catch(e) {}
            }
        }

        handlePeerTyping(peerId, on) {
            if (!this.typing) this.typing = {};
            if (this.typingTimers && this.typingTimers[peerId]) clearTimeout(this.typingTimers[peerId]);
            if (on) {
                this.typing[peerId] = Date.now();
                this.typingTimers[peerId] = setTimeout(() => {
                    this.typing[peerId] = 0;
                    if (this.activeChat === peerId) this.updateChatHeaderStatus(!!(this.connections[peerId] && this.connections[peerId].open));
                    this.renderChats();
                }, 3000);
            } else {
                this.typing[peerId] = 0;
            }
            if (this.activeChat === peerId) this.updateChatHeaderStatus(!!(this.connections[peerId] && this.connections[peerId].open));
            this.renderChats();
        }

        clearTypingState(peerId) {
            if (!this.typing) this.typing = {};
            this.typing[peerId] = 0;
            if (this.typingTimers) { clearTimeout(this.typingTimers[peerId]); this.typingTimers[peerId] = null; }
        }

        dispatchMessagePayload(payload) {
            if (!this.activeChat) return;

            const contact = this.db.contacts[this.activeChat] || {};
            if (contact.isGroup || contact.isChannel) {
                this.dispatchGroupPayload(payload);
                return;
            }

            if (!this.db.history[this.activeChat]) this.db.history[this.activeChat] = [];
            this.db.history[this.activeChat].push(payload);
            this.saveStorage();
            this.renderMessages();
            this.renderChats();
            this.sound.playSend();
            if (navigator.vibrate) navigator.vibrate(30);

            if (this.activeChat === 'ai_bot') {
                this.handleAiResponse(payload);
                return;
            }
            if (this.activeChat === 'saved_notes') return;

            const conn = this.connections[this.activeChat];
            const wireMsg = { type: 'msg', id: payload.id, payload };

            if (conn && conn.open) {
                try { conn.send(wireMsg); } catch(e) {
                    this.queueMessage(this.activeChat, wireMsg);
                    this.connectToPeer(this.activeChat);
                }
            } else {
                this.queueMessage(this.activeChat, wireMsg);
                this.connectToPeer(this.activeChat);
                this.showToast('Сообщение сохранено. Доставится при связи ✓');
            }
        }

        sendText() {
            const box = document.getElementById('msgInputBox');
            const text = box.value.trim();
            if (!text || !this.activeChat) return;

            const payload = {
                id: 'm_' + Date.now(),
                sender: 'my',
                text,
                replyTo: this.replyingTo,
                time: this.formatTime(),
                delivered: false
            };

            this.dispatchMessagePayload(payload);
            box.value = '';
            this.onInputBoxChange();
            this.cancelReply();
        }

        onInputBoxChange() {
            const box = document.getElementById('msgInputBox');
            const panel = document.querySelector('.input-panel');
            if (!box || !panel) return;
            if (box.value.trim().length > 0) {
                panel.classList.add('has-text');
            } else {
                panel.classList.remove('has-text');
            }
            this.reportTyping(box.value.trim().length > 0);
        }

        sendImage(e) {
            const file = e.target.files[0];
            if (!file || !this.activeChat) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                const payload = {
                    id: 'm_' + Date.now(),
                    sender: 'my',
                    img: evt.target.result,
                    replyTo: this.replyingTo,
                    time: this.formatTime(),
                    delivered: false
                };
                this.dispatchMessagePayload(payload);
                this.cancelReply();
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }

        sendDocument(e) {
            const file = e.target.files[0];
            if (!file || !this.activeChat) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                const payload = {
                    id: 'm_' + Date.now(),
                    sender: 'my',
                    doc: {
                        name: file.name,
                        size: (file.size / 1024).toFixed(1) + ' KB',
                        data: evt.target.result
                    },
                    replyTo: this.replyingTo,
                    time: this.formatTime(),
                    delivered: false
                };
                this.dispatchMessagePayload(payload);
                this.cancelReply();
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }

        sendDice(emoji = '🎲') {
            if (!this.activeChat) return;
            const roll = Math.floor(Math.random() * 6) + 1;
            const payload = {
                id: 'm_' + Date.now(),
                sender: 'my',
                text: `${emoji} Выпало: ${roll}!`,
                time: this.formatTime(),
                delivered: false
            };
            this.dispatchMessagePayload(payload);
        }

        sendGift(icon, name, price) {
            if (!this.activeChat) return;
            if (this.db.profile.stars < price) return alert(`Требуется ${price} ⭐ звезд.`);
            this.db.profile.stars -= price;
            this.saveStorage();
            this.updateStarsDisplay();
            this.ui.closeModal('giftsModal');

            const payload = {
                id: 'm_' + Date.now(),
                sender: 'my',
                gift: { icon, name, price },
                text: `🎁 Подарок: ${icon} ${name}!`,
                time: this.formatTime(),
                delivered: false
            };
            this.confetti.fire();
            this.sound.playGift();
            this.dispatchMessagePayload(payload);
        }

        // --- MOBILE VOICE RECORDING WITH LIVE ANALYSER ---
        async startVoiceRecord() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mimeType = getSupportedAudioMimeType();
                this.recordedChunks = [];
                this.mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
                this.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) this.recordedChunks.push(e.data); };
                this.mediaRecorder.start(100);

                if (navigator.vibrate) navigator.vibrate(50);
                document.getElementById('recordingBar').classList.add('active');
                this.recordSeconds = 0;
                document.getElementById('recordTimerLabel').textContent = '00:00';
                clearInterval(this.recordTimerInterval);
                this.recordTimerInterval = setInterval(() => {
                    this.recordSeconds++;
                    const m = String(Math.floor(this.recordSeconds / 60)).padStart(2, '0');
                    const s = String(this.recordSeconds % 60).padStart(2, '0');
                    document.getElementById('recordTimerLabel').textContent = `${m}:${s}`;
                }, 1000);

                // Start live waveform visualizer
                this.startLiveMicWave(stream);
            } catch(e) {
                alert('Не удалось получить доступ к микрофону. Проверьте настройки разрешений в браузере.');
            }
        }

        startLiveMicWave(stream) {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                this.audioCtx = new AudioCtx();
                const source = this.audioCtx.createMediaStreamSource(stream);
                this.analyser = this.audioCtx.createAnalyser();
                this.analyser.fftSize = 32;
                source.connect(this.analyser);
                const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                const bars = document.querySelectorAll('.live-mic-bar');

                clearInterval(this.analyserInterval);
                this.analyserInterval = setInterval(() => {
                    if (!this.analyser) return;
                    this.analyser.getByteFrequencyData(dataArray);
                    bars.forEach((bar, i) => {
                        const val = dataArray[i * 2] || 0;
                        const h = Math.max(4, Math.min(20, Math.floor(val / 12)));
                        bar.style.height = `${h}px`;
                    });
                }, 80);
            } catch(e) {}
        }

        cancelVoiceRecord() {
            this.cleanupVoiceRecorder();
            document.getElementById('recordingBar').classList.remove('active');
        }

        stopAndSendVoice() {
            if (!this.mediaRecorder) return;
            const duration = this.recordSeconds || 1;
            this.mediaRecorder.onstop = () => {
                const mime = this.mediaRecorder.mimeType || 'audio/mp4';
                const blob = new Blob(this.recordedChunks, { type: mime });
                const reader = new FileReader();
                reader.onload = () => {
                    const payload = {
                        id: 'm_' + Date.now(),
                        sender: 'my',
                        voice: { audio: reader.result, duration },
                        time: this.formatTime(),
                        delivered: false
                    };
                    this.dispatchMessagePayload(payload);
                };
                reader.readAsDataURL(blob);
                this.cleanupVoiceRecorder();
            };
            this.mediaRecorder.stop();
            document.getElementById('recordingBar').classList.remove('active');
        }

        cleanupVoiceRecorder() {
            if (this.mediaRecorder) {
                this.mediaRecorder.stream?.getTracks().forEach(t => t.stop());
                this.mediaRecorder = null;
            }
            clearInterval(this.recordTimerInterval);
            clearInterval(this.analyserInterval);
            if (this.audioCtx) {
                try { this.audioCtx.close(); } catch(e) {}
                this.audioCtx = null;
            }
        }

        // --- MOBILE VIDEO CIRCLE (КРУЖОЧКИ С ПЕРЕКЛЮЧЕНИЕМ КАМЕРЫ) ---
        async startVideoCircleRecord() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: this.circleFacingMode },
                    audio: true
                });
                this.circleStream = stream;
                const videoEl = document.getElementById('circleRecordPreview');
                videoEl.srcObject = stream;
                videoEl.style.transform = this.circleFacingMode === 'user' ? 'scaleX(-1)' : 'none';

                const mimeType = getSupportedVideoMimeType();
                this.recordedCircleChunks = [];
                this.circleRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
                this.circleRecorder.ondataavailable = (e) => { if (e.data.size > 0) this.recordedCircleChunks.push(e.data); };
                this.circleRecorder.start(100);

                if (navigator.vibrate) navigator.vibrate(60);
                this.ui.openModal('videoCircleModal');
                this.circleSeconds = 0;
                document.getElementById('circleRecordTimer').textContent = '00:00 / 01:00';
                clearInterval(this.circleTimerInterval);
                this.circleTimerInterval = setInterval(() => {
                    this.circleSeconds++;
                    const s = String(this.circleSeconds).padStart(2, '0');
                    document.getElementById('circleRecordTimer').textContent = `00:${s} / 01:00`;
                    if (this.circleSeconds >= 60) this.stopAndSendCircle();
                }, 1000);
            } catch(e) {
                alert('Не удалось запустить камеру для кружочка.');
            }
        }

        async flipCircleCamera() {
            this.circleFacingMode = this.circleFacingMode === 'user' ? 'environment' : 'user';
            if (this.circleStream) this.circleStream.getTracks().forEach(t => t.stop());
            clearInterval(this.circleTimerInterval);
            this.startVideoCircleRecord();
        }

        cancelCircleRecord() {
            if (this.circleStream) this.circleStream.getTracks().forEach(t => t.stop());
            clearInterval(this.circleTimerInterval);
            this.ui.closeModal('videoCircleModal');
        }

        stopAndSendCircle() {
            if (!this.circleRecorder) return;
            this.circleRecorder.onstop = () => {
                const mime = this.circleRecorder.mimeType || 'video/mp4';
                const blob = new Blob(this.recordedCircleChunks, { type: mime });
                const reader = new FileReader();
                reader.onload = () => {
                    const payload = {
                        id: 'm_' + Date.now(),
                        sender: 'my',
                        circle: reader.result,
                        time: this.formatTime(),
                        delivered: false
                    };
                    this.dispatchMessagePayload(payload);
                };
                reader.readAsDataURL(blob);
                if (this.circleStream) this.circleStream.getTracks().forEach(t => t.stop());
            };
            this.circleRecorder.stop();
            clearInterval(this.circleTimerInterval);
            this.ui.closeModal('videoCircleModal');
        }

        // --- SPEED TOGGLE (1x -> 1.5x -> 2x) ---
        toggleCirclePlayback(wrapper) {
            const video = wrapper.querySelector('video');
            const badge = wrapper.querySelector('.speed-badge');
            if (video.paused) {
                video.play().catch(() => {});
                wrapper.classList.add('playing');
            } else {
                // Change speed
                if (video.playbackRate === 1.0) {
                    video.playbackRate = 1.5;
                    badge.textContent = '1.5x';
                } else if (video.playbackRate === 1.5) {
                    video.playbackRate = 2.0;
                    badge.textContent = '2.0x';
                } else {
                    video.pause();
                    video.playbackRate = 1.0;
                    badge.textContent = '1.0x';
                    wrapper.classList.remove('playing');
                }
            }
        }

        toggleVoiceAudio(id, audioSrc) {
            const playerEl = document.getElementById('voice_' + id);
            const btn = playerEl.querySelector('.voice-play-btn');
            if (playerEl.audioObj && !playerEl.audioObj.paused) {
                playerEl.audioObj.pause();
                btn.textContent = '▶';
                playerEl.classList.remove('playing');
            } else {
                playerEl.audioObj = new Audio(audioSrc);
                playerEl.audioObj.play().catch(() => {});
                btn.textContent = '⏸';
                playerEl.classList.add('playing');
                playerEl.audioObj.onended = () => {
                    btn.textContent = '▶';
                    playerEl.classList.remove('playing');
                };
            }
        }

        // --- AI RESPONSES ---
        handleAiResponse(userPayload) {
            const sub = document.getElementById('activeSubtitleBox');
            if (sub) sub.textContent = '🤖 печатает...';

            setTimeout(() => {
                const text = userPayload.text || '';
                let reply = '✨ Принято! Чем ещё могу помочь вам в Telegram Ultra?';
                const low = text.toLowerCase();
                if (low.includes('привет') || low.includes('здравствуй')) reply = 'Приветствую! 👋 Рад видеть вас в Telegram Ultra 2026. Чем могу помочь?';
                else if (low.includes('иде')) reply = '💡 Вот 3 топовые мобильные идеи:\n1. Голосовой переводчик на базе локального ИИ в кружочках.\n2. Трекер привычек с игровыми наградами в Telegram Stars.\n3. Мобильный видеоредактор с мгновенным P2P-экспортом!';
                else if (low.includes('скрипт') || low.includes('js')) reply = '💻 Вот код для адаптивного свайпа на смартфонах:\n```javascript\ndialog.ontouchend = (e) => {\n  if (e.changedTouches[0].clientX > 100) goBack();\n};\n```';
                else if (low.includes('загадк')) reply = '🎲 Загадка: Что можно разбить, даже не прикасаясь к нему?\n\n(Ответ: Обещание или сердце! 💔)';
                else if (low.includes('как дела')) reply = '⚡ На 100% готов к работе! Всё оптимизировано под ваш смартфон.';

                const aiPayload = {
                    id: 'm_' + Date.now(),
                    sender: 'ai_bot',
                    text: reply,
                    time: this.formatTime()
                };
                this.db.history['ai_bot'].push(aiPayload);
                this.saveStorage();
                this.sound.playReceive();
                if (this.activeChat === 'ai_bot') {
                    this.renderMessages();
                    if (sub) sub.textContent = '● в сети';
                }
                this.renderChats();
            }, 600 + Math.random() * 400);
        }

        sendAiPreset(text) {
            document.getElementById('msgInputBox').value = text;
            this.sendText();
        }

        // --- CALLS ---
        async startCall(isVideo = false) {
            if (!this.activeChat) return alert('Выберите контакт.');
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: isVideo ? { facingMode: this.callFacingMode } : false
                });
                const call = this.peer.call(this.activeChat, this.localStream);
                this.setupCallEvents(call);

                const callerName = this.db.contacts[this.activeChat]?.nick || this.activeChat;
                document.getElementById('callModalTitle').textContent = (isVideo ? '📹 Видеозвонок: @' : '📞 Звонок: @') + callerName;
                document.getElementById('callVideoBox').style.display = isVideo ? 'flex' : 'none';
                if (isVideo) document.getElementById('localVideo').srcObject = this.localStream;
                this.ui.openModal('callModal');
                this.startTimer();
            } catch(e) {
                alert('Ошибка доступа к камере/микрофону.');
            }
        }

        async acceptCall() {
            this.ui.closeModal('incomingCallModal');
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                this.incomingCallObj.answer(this.localStream);
                this.setupCallEvents(this.incomingCallObj);
                const callerName = this.db.contacts[this.incomingCallObj.peer]?.nick || this.incomingCallObj.peer;
                document.getElementById('callModalTitle').textContent = `Разговор: @${callerName}`;
                document.getElementById('callVideoBox').style.display = 'flex';
                document.getElementById('localVideo').srcObject = this.localStream;
                this.ui.openModal('callModal');
                this.startTimer();
            } catch(e) {}
        }

        rejectCall() {
            if (this.incomingCallObj) this.incomingCallObj.close();
            this.ui.closeModal('incomingCallModal');
        }

        setupCallEvents(call) {
            this.currentCall = call;
            call.on('stream', (remoteStream) => {
                const a = document.getElementById('remoteAudio');
                a.srcObject = remoteStream;
                a.play().catch(() => {});
                const v = document.getElementById('remoteVideo');
                if (v) v.srcObject = remoteStream;
            });
            call.on('close', () => this.cleanupCall());
            call.on('error', () => this.cleanupCall());
        }

        async flipCallCamera() {
            if (!this.localStream) return;
            this.callFacingMode = this.callFacingMode === 'user' ? 'environment' : 'user';
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: this.callFacingMode }, audio: true
            });
            const newVideoTrack = newStream.getVideoTracks()[0];
            const sender = this.currentCall?.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(newVideoTrack);
            document.getElementById('localVideo').srcObject = newStream;
        }

        toggleMuteAudio() {
            if (!this.localStream) return;
            const t = this.localStream.getAudioTracks()[0];
            if (t) {
                t.enabled = !t.enabled;
                document.getElementById('callMuteAudioBtn').textContent = t.enabled ? '🎤 Микрофон' : '🔇 Выкл';
            }
        }

        toggleMuteVideo() {
            if (!this.localStream) return;
            const t = this.localStream.getVideoTracks()[0];
            if (t) {
                t.enabled = !t.enabled;
                document.getElementById('callMuteVideoBtn').textContent = t.enabled ? '📹 Камера' : '🚫 Выкл';
            }
        }

        endCall() {
            if (this.currentCall) this.currentCall.close();
            this.cleanupCall();
        }

        cleanupCall() {
            if (this.localStream) {
                this.localStream.getTracks().forEach(t => t.stop());
                this.localStream = null;
            }
            this.currentCall = null;
            this.incomingCallObj = null;
            clearInterval(this.callTimerInterval);
            this.ui.closeModal('callModal');
        }

        startTimer() {
            this.callSeconds = 0;
            clearInterval(this.callTimerInterval);
            this.callTimerInterval = setInterval(() => {
                this.callSeconds++;
                const m = String(Math.floor(this.callSeconds / 60)).padStart(2, '0');
                const s = String(this.callSeconds % 60).padStart(2, '0');
                document.getElementById('callModalTimer').textContent = `${m}:${s}`;
            }, 1000);
        }

        // --- SPEECH RECOGNITION (STT) & TTS ---
        toggleSpeechToText() {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) return alert('Голосовой ввод не поддерживается на этом устройстве.');
            const rec = new SpeechRec();
            rec.lang = 'ru-RU';
            rec.onstart = () => {
                document.getElementById('sttBtn').style.color = '#ef4444';
                this.showToast('Слушаю...');
            };
            rec.onresult = (e) => {
                document.getElementById('msgInputBox').value = e.results[0][0].transcript;
            };
            rec.onend = () => { document.getElementById('sttBtn').style.color = 'var(--tg-text-muted)'; };
            rec.start();
        }

        speakText(text) {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const utt = new SpeechSynthesisUtterance(text);
            utt.lang = 'ru-RU';
            window.speechSynthesis.speak(utt);
        }

        // --- STORIES (24H, VISIBLE ONLY TO PEOPLE YOU TALKED TO) ---
        isRealContact(peerId) {
            if (!peerId) return false;
            const c = this.db.contacts[peerId] || {};
            return !c.isBot && !c.isSaved && !c.isGroup && !c.isChannel;
        }

        hasCommunicated(peerId) {
            if (!peerId || peerId === this.myPeerId) return false;
            if (!this.isRealContact(peerId)) return false;
            const hist = this.db.history[peerId] || [];
            return hist.some(m => m && (m.sender === 'my' || m.sender === peerId));
        }

        communicatedPeers() {
            return Object.keys(this.db.contacts).filter(id => this.hasCommunicated(id));
        }

        activeStories() {
            const now = Date.now();
            return Object.values(this.db.stories || {}).filter(st => st && st.expiresAt && st.expiresAt > now);
        }

        myActiveStories() {
            return this.activeStories()
                .filter(st => st.owner === this.myPeerId)
                .sort((a, b) => (a.time || 0) - (b.time || 0));
        }

        storiesOf(ownerId) {
            return this.activeStories()
                .filter(st => st.owner === ownerId)
                .sort((a, b) => (a.time || 0) - (b.time || 0));
        }

        cleanupStories() {
            const now = Date.now();
            let changed = false;
            Object.keys(this.db.stories || {}).forEach(id => {
                const st = this.db.stories[id];
                if (!st || !st.expiresAt || st.expiresAt <= now) { delete this.db.stories[id]; changed = true; }
            });
            if (changed) this.saveStorage();
            return changed;
        }

        startStoriesCleanupTimer() {
            if (this.storiesCleanupTimer) return;
            this.storiesCleanupTimer = setInterval(() => {
                if (this.cleanupStories()) this.renderStories();
                const v = this.storyViewer;
                if (v) {
                    v.list = v.list.filter(st => st.expiresAt > Date.now());
                    if (!v.list.length) { this.closeStoryViewer(); }
                    else { if (v.index >= v.list.length) v.index = v.list.length - 1; this.renderStoryViewer(); }
                }
            }, 60000);
        }

        renderStories() {
            const bar = document.getElementById('storiesBar');
            if (!bar) return;
            bar.innerHTML = '';

            const mineStories = this.myActiveStories();
            const myItem = document.createElement('div');
            myItem.className = 'story-item';
            const myRing = document.createElement('div');
            myRing.className = 'story-ring' + (mineStories.length ? '' : ' story-ring-add');
            const myAv = document.createElement('div');
            myAv.className = 'story-avatar';
            const myAvVal = this.db.profile.avatar;
            if (myAvVal && /^https?:|^data:/i.test(myAvVal)) {
                const im = document.createElement('img'); im.src = myAvVal; myAv.appendChild(im);
            } else {
                myAv.textContent = (this.db.profile.nick ? [this.db.profile.nick][0][0] : '🙂').toUpperCase();
            }
            myRing.appendChild(myAv);
            if (!mineStories.length) {
                const badge = document.createElement('div');
                badge.className = 'story-add-badge';
                badge.textContent = '+';
                myRing.appendChild(badge);
            }
            myItem.appendChild(myRing);
            const myNm = document.createElement('div');
            myNm.className = 'story-name';
            myNm.textContent = 'Моя история';
            myItem.appendChild(myNm);
            myItem.onclick = () => { mineStories.length ? this.openStoryViewer(this.myPeerId) : this.openStoryComposer(); };
            bar.appendChild(myItem);

            const byOwner = {};
            this.activeStories().forEach(st => {
                if (st.owner === this.myPeerId) return;
                if (!this.hasCommunicated(st.owner)) return;
                (byOwner[st.owner] = byOwner[st.owner] || []).push(st);
            });

            Object.keys(byOwner).sort((a, b) => {
                const ua = byOwner[a].some(s => !s.read) ? 0 : 1;
                const ub = byOwner[b].some(s => !s.read) ? 0 : 1;
                if (ua !== ub) return ua - ub;
                return Math.max(...byOwner[b].map(s => s.time || 0)) - Math.max(...byOwner[a].map(s => s.time || 0));
            }).forEach(ownerId => {
                const stories = byOwner[ownerId].sort((a, b) => (a.time || 0) - (b.time || 0));
                const unread = stories.some(s => !s.read);
                const c = this.db.contacts[ownerId] || {};
                const name = c.nick || stories[0].ownerNick || ownerId;

                const item = document.createElement('div');
                item.className = 'story-item';
                const ring = document.createElement('div');
                ring.className = 'story-ring' + (unread ? '' : ' seen');
                const av = document.createElement('div');
                av.className = 'story-avatar';
                const avatarVal = c.avatar || stories[0].ownerAvatar || '';
                if (avatarVal && /^https?:|^data:/i.test(avatarVal)) {
                    const img = document.createElement('img'); img.src = avatarVal; av.appendChild(img);
                } else if (avatarVal) {
                    av.textContent = avatarVal;
                } else {
                    av.textContent = (name[0] || '?').toUpperCase();
                }
                ring.appendChild(av);
                item.appendChild(ring);
                const nm = document.createElement('div');
                nm.className = 'story-name';
                nm.textContent = name;
                item.appendChild(nm);
                item.onclick = () => this.openStoryViewer(ownerId);
                bar.appendChild(item);
            });
        }

        openStoryComposer() {
            this.storyComposerImage = '';
            const prev = document.getElementById('storyComposerPreview');
            if (prev) prev.innerHTML = '<span style="color:var(--tg-text-muted); font-size:.82rem;">Добавьте фото или напишите текст</span>';
            const cap = document.getElementById('storyCaptionInput');
            if (cap) cap.value = '';
            const picker = document.getElementById('storyImagePicker');
            if (picker) picker.value = '';
            this.ui.openModal('storyComposerModal');
        }

        closeStoryComposer() {
            this.storyComposerImage = '';
            this.ui.closeModal('storyComposerModal');
        }

        onStoryImagePicked(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                this.storyComposerImage = evt.target.result;
                const prev = document.getElementById('storyComposerPreview');
                if (prev) prev.innerHTML = `<img src="${this.storyComposerImage}">`;
            };
            reader.readAsDataURL(file);
        }

        clearStoryImage() {
            this.storyComposerImage = '';
            const prev = document.getElementById('storyComposerPreview');
            if (prev) prev.innerHTML = '<span style="color:var(--tg-text-muted); font-size:.82rem;">Добавьте фото или напишите текст</span>';
            const picker = document.getElementById('storyImagePicker');
            if (picker) picker.value = '';
        }

        postStory() {
            if (!this.myPeerId) { this.showToast('Сначала задайте профиль'); return; }
            const capEl = document.getElementById('storyCaptionInput');
            const caption = capEl ? capEl.value.trim() : '';
            if (!this.storyComposerImage && !caption) {
                this.showToast('⚠️ Добавьте фото или текст');
                return;
            }
            const now = Date.now();
            if (!this.db.stories) this.db.stories = {};
            const st = {
                id: 'st_' + now + '_' + Math.floor(Math.random() * 1000),
                owner: this.myPeerId,
                ownerNick: this.db.profile.nick || this.myPeerId,
                ownerAvatar: this.db.profile.avatar || '',
                img: this.storyComposerImage || '',
                caption,
                time: now,
                expiresAt: now + 24 * 60 * 60 * 1000,
                mine: true,
                read: true,
                views: {}
            };
            this.db.stories[st.id] = st;
            this.saveStorage();
            this.closeStoryComposer();
            this.renderStories();
            this.sound.playSend();
            this.confetti.fire();
            this.broadcastStory(st);
            const peers = this.communicatedPeers().length;
            this.showToast(peers ? 'История опубликована ✨ (видна ' + peers + ' собеседникам)' : 'История опубликована на 24 часа ✨');
        }

        broadcastStory(st) {
            this.communicatedPeers().forEach(pid => {
                const conn = this.connections[pid];
                if (conn && conn.open) {
                    try { conn.send({ type: 'story', story: st }); } catch (e) {}
                }
            });
        }

        sendMyStoriesTo(peerId) {
            if (!this.hasCommunicated(peerId)) return;
            const conn = this.connections[peerId];
            if (!conn || !conn.open) return;
            this.myActiveStories().forEach(st => {
                try { conn.send({ type: 'story', story: st }); } catch (e) {}
            });
        }

        broadcastStoryDelete(id) {
            const payload = { type: 'story-delete', id, owner: this.myPeerId };
            Object.keys(this.connections).forEach(pid => {
                const conn = this.connections[pid];
                if (conn && conn.open) { try { conn.send(payload); } catch (e) {} }
            });
        }

        openStoryViewer(ownerId, storyId) {
            if (ownerId !== this.myPeerId && !this.hasCommunicated(ownerId)) {
                this.showToast('🔒 Истории видны только собеседникам');
                return;
            }
            const list = this.storiesOf(ownerId);
            if (!list.length) {
                if (ownerId === this.myPeerId) this.openStoryComposer();
                else this.showToast('История уже недоступна');
                return;
            }
            let idx = 0;
            if (storyId) {
                const found = list.findIndex(s => s.id === storyId);
                if (found >= 0) idx = found;
            }
            this.storyViewer = { ownerId, list, index: idx };
            this.ui.openModal('storyViewerModal');
            this.renderStoryViewer();
        }

        closeStoryViewer() {
            clearTimeout(this.storyTimer);
            this.storyViewer = null;
            this.ui.closeModal('storyViewerModal');
        }

        storyViewerNext() {
            const v = this.storyViewer;
            if (!v) return;
            if (v.index < v.list.length - 1) { v.index++; this.renderStoryViewer(); }
            else { this.closeStoryViewer(); }
        }

        storyViewerPrev() {
            const v = this.storyViewer;
            if (!v) return;
            if (v.index > 0) { v.index--; this.renderStoryViewer(); }
            else { this.renderStoryViewer(); }
        }

        storyDuration(st) {
            if (st.img) return 5000;
            const len = (st.caption || '').length;
            return Math.max(4000, Math.min(9000, 1500 + len * 80));
        }

        relativeTime(ts) {
            const diff = Math.max(0, Date.now() - (ts || Date.now()));
            const m = Math.floor(diff / 60000);
            if (m < 1) return 'только что';
            if (m < 60) return m + ' мин назад';
            const h = Math.floor(m / 60);
            if (h < 24) return h + ' ч назад';
            return 'давно';
        }

        updateStoryViewerMeta(st) {
            const meta = document.getElementById('storyViewerMeta');
            if (!meta) return;
            if (st.owner === this.myPeerId) {
                meta.textContent = '👁 ' + Object.keys(st.views || {}).length;
            } else {
                meta.textContent = '';
            }
        }

        renderStoryViewer() {
            const v = this.storyViewer;
            if (!v) return;
            const st = v.list[v.index];
            if (!st) { this.closeStoryViewer(); return; }
            const isMine = st.owner === this.myPeerId;
            const contact = this.db.contacts[st.owner] || {};
            const name = contact.nick || st.ownerNick || st.owner;

            document.getElementById('storyViewerName').textContent = name;
            document.getElementById('storyViewerTime').textContent = this.relativeTime(st.time);
            this.setChatAvatar(document.getElementById('storyViewerAvatar'), contact.avatar ? contact : { avatar: st.ownerAvatar }, name);

            const row = document.getElementById('storyProgressRow');
            row.innerHTML = '';
            v.list.forEach((s, i) => {
                const track = document.createElement('div');
                track.className = 'story-progress-track';
                const fill = document.createElement('div');
                fill.className = 'story-progress-fill';
                if (i < v.index) fill.classList.add('done');
                else if (i === v.index) {
                    fill.classList.add('active');
                    fill.style.animationDuration = this.storyDuration(s) + 'ms';
                }
                track.appendChild(fill);
                row.appendChild(track);
            });

            const slide = document.getElementById('storyViewerSlide');
            if (st.img) {
                slide.className = 'story-slide';
                slide.innerHTML = `<img src="${st.img}" alt="">` +
                    (st.caption ? `<div class="story-viewer-caption">${this.escapeHtml(st.caption)}</div>` : '');
            } else {
                slide.className = 'story-slide text-mode';
                slide.innerHTML = `<div class="story-viewer-text">${this.escapeHtml(st.caption || '...')}</div>`;
            }

            const delBtn = document.getElementById('storyDeleteBtn');
            if (delBtn) delBtn.style.display = isMine ? 'inline-flex' : 'none';
            this.updateStoryViewerMeta(st);

            if (!isMine) {
                if (!st.read) { st.read = true; this.saveStorage(); this.renderStories(); }
                this.sendStoryView(st);
            }

            clearTimeout(this.storyTimer);
            this.storyTimer = setTimeout(() => this.storyViewerNext(), this.storyDuration(st));
        }

        sendStoryView(st) {
            const conn = this.connections[st.owner];
            if (conn && conn.open) {
                try { conn.send({ type: 'story-view', storyId: st.id, by: this.myPeerId }); } catch (e) {}
            }
        }

        deleteCurrentStory() {
            const v = this.storyViewer;
            if (!v) return;
            const st = v.list[v.index];
            if (!st || st.owner !== this.myPeerId) return;
            this.deleteStory(st.id);
        }

        deleteStory(id) {
            const st = (this.db.stories || {})[id];
            if (!st) return;
            delete this.db.stories[id];
            this.saveStorage();
            this.broadcastStoryDelete(id);
            const v = this.storyViewer;
            if (v) {
                v.list = v.list.filter(s => s.id !== id);
                if (!v.list.length) { this.closeStoryViewer(); this.renderStories(); this.showToast('История удалена'); return; }
                if (v.index >= v.list.length) v.index = v.list.length - 1;
                this.renderStoryViewer();
            }
            this.renderStories();
            this.showToast('История удалена');
        }

        showStory(author, imgUrl, caption) {
            document.getElementById('storyAuthorLabel').textContent = author;
            document.getElementById('storyImage').src = imgUrl;
            document.getElementById('storyCaption').textContent = caption;
            this.ui.openModal('storyModal');
        }

        switchFolder(folder, tabEl) {
            this.currentFolder = folder;
            document.querySelectorAll('.folder-tab').forEach(t => t.classList.remove('active'));
            tabEl.classList.add('active');
            this.renderChats();
        }

        // --- TIC-TAC-TOE ---
        startTicTacToe() {
            this.ui.openModal('gameModal');
            this.initTicTacToe();
        }

        initTicTacToe() {
            this.gameBoard = Array(9).fill(null);
            this.gameActive = true;
            document.getElementById('gameStatusText').textContent = 'Ваш ход (X)';
            const grid = document.getElementById('gameGrid');
            grid.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                const cell = document.createElement('div');
                cell.style.cssText = 'height:70px; background:var(--tg-dialog-bg); border:2px solid var(--tg-border); border-radius:12px; font-size:1.8rem; font-weight:800; display:flex; align-items:center; justify-content:center; cursor:pointer;';
                cell.onclick = () => this.playTicTacToe(i);
                grid.appendChild(cell);
            }
        }

        playTicTacToe(i) {
            if (!this.gameActive || this.gameBoard[i]) return;
            this.gameBoard[i] = 'X';
            this.updateTicTacToeGrid();

            if (this.checkWin('X')) {
                document.getElementById('gameStatusText').textContent = '🎉 ВЫ ПОБЕДИЛИ!';
                this.confetti.fire();
                this.gameActive = false;
                return;
            }
            if (!this.gameBoard.includes(null)) {
                document.getElementById('gameStatusText').textContent = '🤝 Ничья!';
                this.gameActive = false;
                return;
            }

            // AI Move
            setTimeout(() => {
                const empty = this.gameBoard.map((v, idx) => v === null ? idx : null).filter(v => v !== null);
                if (empty.length > 0) {
                    this.gameBoard[empty[Math.floor(Math.random() * empty.length)]] = 'O';
                    this.updateTicTacToeGrid();
                    if (this.checkWin('O')) {
                        document.getElementById('gameStatusText').textContent = '🤖 ИИ выиграл раунд!';
                        this.gameActive = false;
                    }
                }
            }, 300);
        }

        updateTicTacToeGrid() {
            const cells = document.querySelectorAll('#gameGrid > div');
            cells.forEach((c, idx) => {
                c.textContent = this.gameBoard[idx] || '';
                c.style.color = this.gameBoard[idx] === 'X' ? 'var(--tg-accent)' : '#f43f5e';
            });
        }

        checkWin(p) {
            const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            return wins.some(([a,b,c]) => this.gameBoard[a] === p && this.gameBoard[b] === p && this.gameBoard[c] === p);
        }

        // --- REPLIES, REACTIONS, PINNING ---
        setReply(msgId, textSnippet) {
            this.replyingTo = { id: msgId, text: textSnippet };
            document.getElementById('replyPreviewText').textContent = textSnippet;
            document.getElementById('replyBar').classList.add('active');
            document.getElementById('msgInputBox').focus();
        }

        cancelReply() {
            this.replyingTo = null;
            document.getElementById('replyBar').classList.remove('active');
        }

        reactToMessage(msgId, emoji) {
            const hist = this.db.history[this.activeChat] || [];
            const m = hist.find(item => item.id === msgId);
            if (m) {
                if (!m.reactions) m.reactions = {};
                m.reactions[emoji] = (m.reactions[emoji] || 0) + 1;
                this.saveStorage();
                this.renderMessages();
                if (navigator.vibrate) navigator.vibrate(30);

                if (this.connections[this.activeChat]?.open) {
                    try { this.connections[this.activeChat].send({ type: 'reaction', msgId, emoji }); } catch(e) {}
                }
            }
        }

        pinMessage(text) {
            this.db.pinned[this.activeChat] = text;
            this.saveStorage();
            this.updatePinnedBanner();
            this.showToast('Сообщение закреплено 📌');
        }

        unpinMessage() {
            delete this.db.pinned[this.activeChat];
            this.saveStorage();
            this.updatePinnedBanner();
        }

        updatePinnedBanner() {
            const bar = document.getElementById('pinnedBar');
            const pinText = this.db.pinned[this.activeChat];
            if (pinText) {
                bar.style.display = 'flex';
                document.getElementById('pinnedText').textContent = pinText;
            } else {
                bar.style.display = 'none';
            }
        }

        // --- EMOJI & ATTACH PANELS ---
        initEmojiPicker() {
            const emojis = ['😀','😂','🔥','❤️','👍','👏','🎉','🚀','💩','✨','😍','😎','🤔','🥳','💯','🍕','🎮','🏆','⭐','💎','🎁'];
            const grid = document.getElementById('emojiGrid');
            grid.innerHTML = '';
            emojis.forEach(e => {
                const btn = document.createElement('button');
                btn.className = 'emoji-btn';
                btn.textContent = e;
                btn.onclick = () => {
                    document.getElementById('msgInputBox').value += e;
                    this.toggleEmojiPanel();
                };
                grid.appendChild(btn);
            });
        }

        toggleEmojiPanel() {
            document.getElementById('emojiPanel').classList.toggle('active');
            document.getElementById('attachMenu').classList.remove('active');
        }

        toggleAttachMenu() {
            document.getElementById('attachMenu').classList.toggle('active');
            document.getElementById('emojiPanel').classList.remove('active');
        }

        // --- NAVIGATION & RENDERING ---
        /** Уведомление Android о новом сообщении (как в Telegram). */
        pushNotify(sender, payload) {
            try {
                if (!window.AndroidNative || !window.AndroidNative.notifyMessage) return;
                if (window.TAILGRAM_ANDROID === false) return;
                const p = payload || {};
                const contact = this.db.contacts[sender] || {};
                const nick = contact.nick || sender;
                let body = '';
                if (p.gift) body = '🎁 Подарок';
                else if (p.voice) body = '🎤 Голосовое сообщение';
                else if (p.video || p.circle) body = '🎥 Видеосообщение';
                else if (p.image) body = '🖼 Изображение';
                else if (p.doc || p.file) body = '📎 Файл';
                else body = p.text || '';
                body = String(body).replace(/\s+/g, ' ').trim().slice(0, 140);
                if (p.text && (p.voice || p.video || p.circle)) {
                    body = String(p.text).replace(/\s+/g, ' ').trim().slice(0, 140);
                }
                if (!body) body = 'Новое сообщение';
                const title = contact.nick ? contact.nick : sender;
                window.AndroidNative.notifyMessage(sender, title, body);
            } catch (e) { }
        }

        openChat(peerId, title) {
            this.activeChat = peerId;
            try { if (window.AndroidNative && window.AndroidNative.clearUnread) window.AndroidNative.clearUnread(); } catch (e) { }
            document.getElementById('appRoot').classList.add('chat-active');
            this.updateActiveChatInfo();
            this.updatePinnedBanner();
            this.renderMessages();

            document.getElementById('aiPromptsRow').style.display = (peerId === 'ai_bot') ? 'flex' : 'none';

            const c = this.db.contacts[peerId] || {};
            const inp = document.querySelector('.input-panel');
            const notice = document.getElementById('channelNotice');
            if (c.isChannel && !this.isChannelAdmin(peerId)) {
                if (inp) inp.style.display = 'none';
                if (notice) notice.style.display = 'block';
            } else {
                if (inp) inp.style.display = '';
                if (notice) notice.style.display = 'none';
            }

            if (peerId !== 'ai_bot' && peerId !== 'saved_notes' && !c.isGroup && !c.isChannel) {
                if (!this.connections[peerId] || !this.connections[peerId].open) {
                    this.connectToPeer(peerId);
                }
            }
        }

        closeChat() {
            document.getElementById('appRoot').classList.remove('chat-active');
            this.activeChat = null;
            this.cancelReply();
            const inp = document.querySelector('.input-panel');
            if (inp) inp.style.display = '';
            const notice = document.getElementById('channelNotice');
            if (notice) notice.style.display = 'none';
            this.renderChats();
        }

        updateActiveChatInfo() {
            if (!this.activeChat) return;
            const contact = this.db.contacts[this.activeChat] || {};
            const displayName = contact.nick || this.activeChat;
            const g = this.db.groups[this.activeChat];
            const sub = document.getElementById('activeSubtitleBox');
            if (g) {
                sub.textContent = g.type === 'channel' ? `канал • ${(g.members || []).length} подписчиков` : `группа • ${(g.members || []).length} участников`;
                sub.style.color = 'var(--tg-text-muted)';
            } else {
                const isOnline = (this.activeChat === 'ai_bot' || this.activeChat === 'saved_notes') || !!(this.connections[this.activeChat] && this.connections[this.activeChat].open);
                this.updateChatHeaderStatus(isOnline);
            }

            document.getElementById('activeTitleBox').textContent = displayName;
            const avatarBox = document.getElementById('activeAvatarBox');
            this.setChatAvatar(avatarBox, contact, displayName);
        }

        updateChatHeaderStatus(isOnline) {
            const sub = document.getElementById('activeSubtitleBox');
            if (!sub) return;
            const chatId = this.activeChat;
            if (chatId && this.typing && this.typing[chatId]) {
                sub.textContent = 'печатает...';
                sub.style.color = 'var(--tg-text-muted)';
                return;
            }
            if (isOnline) { sub.textContent = '● в сети'; sub.style.color = '#22c55e'; }
            else { sub.textContent = 'офлайн'; sub.style.color = 'var(--tg-text-muted)'; }
        }

        reconnectActiveChat() {
            if (!this.activeChat) return;
            const c = this.db.contacts[this.activeChat] || {};
            if (c.isGroup || c.isChannel) {
                this.updateActiveChatInfo();
                this.showToast('🔁 Группа обновлена');
                return;
            }
            this.showToast('Обновление...');
            this.connectToPeer(this.activeChat);
        }

        copyMyId() {
            if (!this.myPeerId) return;
            navigator.clipboard.writeText(this.myPeerId).then(() => {
                this.showToast(`ID @${this.myPeerId} скопирован!`);
            }).catch(() => {
                prompt('Ваш ID:', this.myPeerId);
            });
        }

        openAddContactModal() {
            const input = document.getElementById('newContactInput');
            if (input) input.value = '';
            const myIdLabel = document.getElementById('addContactMyId');
            if (myIdLabel) myIdLabel.textContent = this.myPeerId || '...';
            this.ui.openModal('addContactModal');
            setTimeout(() => { if (input) input.focus(); }, 150);
        }

        confirmAddContact() {
            const input = document.getElementById('newContactInput');
            if (!input) return;
            const rawVal = input.value.trim();
            if (!rawVal) {
                this.showToast('⚠️ Введите ID или имя контакта');
                return;
            }
            const cleanNick = rawVal.replace(/^@/, '').trim();
            const safePeerId = toSafeId(cleanNick);
            if (!safePeerId) {
                this.showToast('⚠️ Некорректное имя или ID');
                return;
            }
            if (safePeerId === this.myPeerId) {
                this.showToast('Это ваш собственный ID!');
                return;
            }

            if (!this.db.contacts[safePeerId]) {
                this.db.contacts[safePeerId] = { nick: cleanNick, avatar: '' };
            }
            if (!this.db.history[safePeerId]) {
                this.db.history[safePeerId] = [];
            }
            this.saveStorage();
            this.renderChats();
            this.connectToPeer(safePeerId);
            this.ui.closeModal('addContactModal');
            this.openChat(safePeerId, cleanNick);
            this.showToast(`Контакт @${cleanNick} добавлен! 🎉`);
        }

        openSecondTab() {
            const u = new URL(window.location.href);
            u.searchParams.set('user', '2');
            window.open(u.toString(), '_blank');
        }

        showToast(text) {
            const toast = document.getElementById('toastNotice');
            if (!toast) return;
            toast.textContent = text;
            toast.classList.add('show');
            clearTimeout(this.toastTimer);
            this.toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
        }

        // --- MESSAGE CONTEXT MENU (right-click) ---
        showMessageContextMenu(e, msg, isMy) {
            e.preventDefault();
            e.stopPropagation();
            this.hideMessageContextMenu();

            const menu = document.createElement('div');
            menu.className = 'message-context-menu';
            const snippet = msg.text ? msg.text.substring(0, 30) : '[Медиа]';

            const addBtn = (label, fn, danger) => {
                const b = document.createElement('button');
                b.innerHTML = label;
                if (danger) b.classList.add('danger');
                b.onclick = (ev) => {
                    ev.stopPropagation();
                    this.hideMessageContextMenu();
                    fn();
                };
                menu.appendChild(b);
                return b;
            };

            addBtn('↩️ Ответить', () => this.setReply(msg.id, snippet));
            if (msg.text) addBtn('📋 Копировать', () => this.copyMessageText(msg.text));
            if (isMy && msg.text && !msg.gift) addBtn('✏️ Редактировать', () => this.editMessage(msg.id));
            addBtn('😊 Реакция', () => this.reactToMessage(msg.id, '❤️'));

            const sep = document.createElement('div');
            sep.className = 'menu-sep';
            menu.appendChild(sep);
            addBtn('🗑️ Удалить сообщение', () => this.deleteMessage(msg.id), true);

            document.body.appendChild(menu);

            const pad = 8;
            let x = e.clientX;
            let y = e.clientY;
            const r = menu.getBoundingClientRect();
            if (x + r.width > window.innerWidth - pad) x = window.innerWidth - r.width - pad;
            if (y + r.height > window.innerHeight - pad) y = window.innerHeight - r.height - pad;
            menu.style.left = Math.max(pad, x) + 'px';
            menu.style.top = Math.max(pad, y) + 'px';
        }

        hideMessageContextMenu() {
            const m = document.querySelector('.message-context-menu');
            if (m) m.remove();
        }

        copyMessageText(text) {
            const done = () => this.showToast('📋 Сообщение скопировано');
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done).catch(() => {});
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); done(); } catch(e) {}
                ta.remove();
            }
        }

        deleteMessage(msgId) {
            const chatId = this.activeChat;
            if (!chatId) return;
            const hist = this.db.history[chatId] || [];
            const idx = hist.findIndex(m => m.id === msgId);
            if (idx === -1) return;
            const msg = hist[idx];
            const isMy = msg.sender === 'my' || msg.sender === this.myPeerId;
            hist.splice(idx, 1);
            this.saveStorage();
            this.renderMessages();
            this.renderChats();
            this.showToast('Сообщение удалено 🗑️');

            const contact = this.db.contacts[chatId] || {};
            if (contact.isGroup || contact.isChannel) {
                const g = this.db.groups[chatId];
                if (g && isMy) {
                    (g.members || []).forEach(m => {
                        if (m === this.myPeerId) return;
                        const conn = this.connections[m];
                        if (conn && conn.open) {
                            try { conn.send({ type: 'group-msg-delete', groupId: chatId, id: msgId }); } catch(e) {}
                        }
                    });
                }
            } else if (isMy && chatId !== 'ai_bot' && chatId !== 'saved_notes') {
                const conn = this.connections[chatId];
                if (conn && conn.open) {
                    try { conn.send({ type: 'msg-delete', id: msgId }); } catch(e) {}
                }
            }
        }

        editMessage(msgId) {
            const chatId = this.activeChat;
            if (!chatId) return;
            const hist = this.db.history[chatId] || [];
            const m = hist.find(x => x.id === msgId);
            if (!m || !m.text) return;
            const isMy = m.sender === 'my' || m.sender === this.myPeerId;
            if (!isMy) return;
            const newText = prompt('Редактировать сообщение:', m.text);
            if (newText === null) return;
            const clean = newText.trim();
            if (!clean || clean === m.text) return;
            m.text = clean;
            m.edited = true;
            this.saveStorage();
            this.renderMessages();
            this.renderChats();
            this.sound.playSend();

            const contact = this.db.contacts[chatId] || {};
            if (contact.isGroup || contact.isChannel) {
                const g = this.db.groups[chatId];
                if (!g) return;
                (g.members || []).forEach(member => {
                    if (member === this.myPeerId) return;
                    const conn = this.connections[member];
                    if (conn && conn.open) {
                        try { conn.send({ type: 'group-msg-edit', groupId: chatId, id: msgId, text: clean }); } catch(e) {}
                    }
                });
            } else if (chatId !== 'ai_bot' && chatId !== 'saved_notes') {
                const conn = this.connections[chatId];
                const wireEdit = { type: 'msg-edit', id: msgId, text: clean };
                if (conn && conn.open) {
                    try { conn.send(wireEdit); } catch(e) { this.queueMessage(chatId, wireEdit); this.connectToPeer(chatId); }
                } else {
                    this.queueMessage(chatId, wireEdit);
                    this.connectToPeer(chatId);
                }
            }
        }

        // --- ADMIN PANEL (only for dima_947) ---
        isCurrentAdmin() {
            return this.myPeerId === 'dima_947' || (this.db.profile && this.db.profile.nick === 'dima_947');
        }

        updateAdminUI() {
            const admin = this.isCurrentAdmin();
            const headerBtn = document.getElementById('adminBtn');
            const settingsBtn = document.getElementById('settingsAdminBtn');
            if (headerBtn) headerBtn.style.display = admin ? '' : 'none';
            if (settingsBtn) settingsBtn.style.display = admin ? '' : 'none';
        }

        isBannedPeer(id) {
            if (!id || id === 'ai_bot' || id === 'saved_notes') return false;
            if (this.db.banned && this.db.banned[id]) return true;
            const c = this.db.contacts[id];
            return !!(c && c.banned);
        }

        openAdminPanel() {
            if (!this.isCurrentAdmin()) { this.showToast('⛔ Доступ только для администратора'); return; }
            this.ui.openModal('adminModal');
            this.renderAdminPanel();
        }

        renderAdminPanel() {
            const input = document.getElementById('adminBanInput');
            if (input) input.value = '';
            const memberBox = document.getElementById('adminMemberList');
            const bannedBox = document.getElementById('adminBannedList');
            if (memberBox) {
                memberBox.innerHTML = '<div style="font-size:.72rem; color:var(--tg-text-muted); font-weight:700; margin:6px 0 2px;">Пользователи</div>';
                const ids = Object.keys(this.db.contacts || {}).filter(id =>
                    id !== 'ai_bot' && id !== 'saved_notes' && id !== this.myPeerId && !this.isBannedPeer(id)
                );
                if (!ids.length) {
                    memberBox.innerHTML += '<div style="font-size:.75rem; color:var(--tg-text-muted); padding:4px 2px;">Пока нет контактов.</div>';
                }
                ids.forEach(id => {
                    const c = this.db.contacts[id] || {};
                    const nick = c.nick || id;
                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:8px; padding:7px 8px; border-radius:10px; background:var(--tg-bg); border:1px solid var(--tg-border);';
                    row.innerHTML = `<div style="min-width:0; overflow:hidden;">
                            <div style="font-size:.84rem; font-weight:600; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${this.escapeHtml(nick)}</div>
                            <div style="font-size:.68rem; color:var(--tg-text-muted);">@${this.escapeHtml(id)}</div>
                        </div>`;
                    const banBtn = document.createElement('button');
                    banBtn.className = 'action-btn';
                    banBtn.style.cssText = 'padding:5px 10px; font-size:.72rem; color:#f87171;';
                    banBtn.textContent = '🚫 Бан';
                    banBtn.onclick = () => this.banUser(id, nick);
                    row.appendChild(banBtn);
                    memberBox.appendChild(row);
                });
            }
            if (bannedBox) {
                bannedBox.innerHTML = '<div style="font-size:.72rem; color:var(--tg-text-muted); font-weight:700; margin:6px 0 2px;">Забаненные</div>';
                const keys = Object.keys(this.db.banned || {});
                if (!keys.length) {
                    bannedBox.innerHTML += '<div style="font-size:.75rem; color:var(--tg-text-muted); padding:4px 2px;">Никого нет.</div>';
                }
                keys.forEach(id => {
                    const b = this.db.banned[id] || {};
                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:8px; padding:7px 8px; border-radius:10px; background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.22);';
                    row.innerHTML = `<div style="min-width:0; overflow:hidden;">
                            <div style="font-size:.84rem; font-weight:600; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">⛔ ${this.escapeHtml(b.nick || id)}</div>
                            <div style="font-size:.68rem; color:var(--tg-text-muted);">@${this.escapeHtml(id)}</div>
                        </div>`;
                    const unbanBtn = document.createElement('button');
                    unbanBtn.className = 'action-btn';
                    unbanBtn.style.cssText = 'padding:5px 10px; font-size:.72rem; color:#4ade80;';
                    unbanBtn.textContent = '✓ Разбан';
                    unbanBtn.onclick = () => this.unbanUser(id);
                    row.appendChild(unbanBtn);
                    bannedBox.appendChild(row);
                });
            }
        }

        resolvePeerIdFromInput(raw) {
            const key = (raw || '').trim();
            if (!key) return null;
            if (this.db.contacts[key]) return { id: key, nick: this.db.contacts[key].nick || key };
            const lower = key.toLowerCase();
            const ids = Object.keys(this.db.contacts || {});
            for (let i = 0; i < ids.length; i++) {
                const c = this.db.contacts[ids[i]];
                if (c && c.nick && c.nick.toLowerCase() === lower) return { id: ids[i], nick: c.nick };
            }
            if (/^[a-z0-9_-]+$/i.test(key)) return { id: lower, nick: key };
            return null;
        }

        banUserFromInput() {
            const input = document.getElementById('adminBanInput');
            const raw = input ? input.value : '';
            const target = this.resolvePeerIdFromInput(raw);
            if (!target) { this.showToast('⚠️ Пользователь не найден — введите ник или ID'); return; }
            if (target.id === this.myPeerId) { this.showToast('Нельзя забанить себя 🙂'); return; }
            this.banUser(target.id, target.nick);
        }

        banUser(peerId, nick) {
            if (!this.isCurrentAdmin()) { this.showToast('⛔ Доступ только для администратора'); return; }
            if (peerId === this.myPeerId) { this.showToast('Нельзя забанить себя 🙂'); return; }
            if (peerId === 'ai_bot' || peerId === 'saved_notes') { this.showToast('Это служебный чат'); return; }

            if (!this.db.banned) this.db.banned = {};
            this.db.banned[peerId] = { nick: nick || peerId, time: Date.now(), by: this.myPeerId };
            const c = this.db.contacts[peerId];
            if (c) c.banned = true;
            if (this.connections[peerId]) {
                try { this.connections[peerId].close(); } catch(e) {}
                delete this.connections[peerId];
            }
            this.saveStorage();
            this.renderChats();
            this.renderAdminPanel();
            if (this.activeChat === peerId) this.closeChat();
            this.showToast('⛔ ' + (nick || peerId) + ' заблокирован');

            Object.keys(this.connections).forEach(id => {
                if (id === peerId) return;
                const conn = this.connections[id];
                if (conn && conn.open) {
                    try { conn.send({ type: 'admin-ban', id: peerId, nick: nick || peerId, admin: this.myPeerId }); } catch(e) {}
                }
            });
        }

        unbanUser(peerId) {
            if (!this.isCurrentAdmin()) return;
            delete this.db.banned[peerId];
            const c = this.db.contacts[peerId];
            if (c) delete c.banned;
            this.saveStorage();
            this.renderChats();
            this.renderAdminPanel();
            this.showToast('✓ ' + (c && c.nick ? c.nick : peerId) + ' разблокирован');
        }

        formatTime() {
            const d = new Date();
            return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
        }

        escapeHtml(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        render() {
            this.renderChats();
            this.updateAdminUI();
        }

        renderChats() {
            const list = document.getElementById('chatsListContainer');
            list.innerHTML = '';
            const query = document.getElementById('searchBox').value.trim().toLowerCase();
            const keys = Object.keys(this.db.contacts);

            keys.forEach(peerId => {
                const contact = this.db.contacts[peerId] || {};
                const displayName = contact.nick || peerId;

                // Folder filter
                if (this.currentFolder === 'personal' && (contact.isBot || contact.isSaved || contact.isGroup || contact.isChannel)) return;
                if (this.currentFolder === 'bots' && !contact.isBot) return;
                if (this.currentFolder === 'saved' && !contact.isSaved) return;
                if (this.currentFolder === 'groups' && !(contact.isGroup && !contact.isChannel)) return;
                if (this.currentFolder === 'channels' && !(contact.isChannel)) return;

                if (this.isBannedPeer(peerId)) return;

                if (query && !displayName.toLowerCase().includes(query) && !peerId.includes(query)) return;

                const isOnline = (peerId === 'ai_bot' || peerId === 'saved_notes') || !!(this.connections[peerId] && this.connections[peerId].open);
                const isGrp = !!(contact.isGroup || contact.isChannel);
                const typingNow = !isGrp && !!(this.typing && this.typing[peerId]);
                const grpData = this.db.groups[peerId] || {};
                const memberField = isGrp ? (contact.isChannel ? `📢 ${(grpData.members || []).length}` : `👥 ${(grpData.members || []).length}`) : (isOnline ? '●' : '○');
                const memberStyle = isGrp ? 'font-size:0.72rem; color:var(--tg-text-muted);' : `font-size:0.72rem; color:${isOnline ? '#22c55e' : '#64748b'};`;
                const avatarHtml = this.avatarHtmlOf(contact, displayName);
                const msgs = this.db.history[peerId] || [];
                const lastMsg = msgs[msgs.length - 1];
                let lastText = 'Нет сообщений';
                if (lastMsg) {
                    if (lastMsg.text) lastText = lastMsg.text;
                    else if (lastMsg.img) lastText = '📷 [Фото]';
                    else if (lastMsg.doc) lastText = '📁 ' + lastMsg.doc.name;
                    else if (lastMsg.voice) lastText = '🎙️ [Голосовое]';
                    else if (lastMsg.circle) lastText = '🎥 [Кружочек]';
                    else if (lastMsg.gift) lastText = '🎁 [Подарок] ' + lastMsg.gift.name;
                }

                const row = document.createElement('div');
                row.className = 'chat-row-item';
                row.onclick = () => this.openChat(peerId, displayName);
                row.innerHTML = `
                    <div class="avatar-view">${avatarHtml}</div>
                    <div class="chat-info-content">
                        <div class="chat-title-row">
                            <span>${this.escapeHtml(displayName)}</span>
                            <span style="${memberStyle}">${memberField}</span>
                        </div>
                        <div class="chat-preview-text">${typingNow ? '<span style="color:var(--tg-accent);">печатает...</span>' : this.escapeHtml(lastText)}</div>
                    </div>
                `;
                list.appendChild(row);
            });

            if (query && list.children.length === 0) {
                const addPrompt = document.createElement('div');
                addPrompt.className = 'chat-row-item';
                addPrompt.style.cursor = 'pointer';
                addPrompt.onclick = () => {
                    const inp = document.getElementById('newContactInput');
                    if (inp) inp.value = query;
                    this.confirmAddContact();
                };
                addPrompt.innerHTML = `
                    <div class="avatar-view" style="background:linear-gradient(135deg, var(--tg-accent), var(--tg-accent-hover)); color:#fff; font-size:1.3rem;">➕</div>
                    <div class="chat-info-content">
                        <div class="chat-title-row">
                            <span style="color:var(--tg-accent); font-weight:700;">Добавить в контакты</span>
                        </div>
                        <div class="chat-preview-text">Нажмите, чтобы создать чат с @${this.escapeHtml(query)}</div>
                    </div>
                `;
                list.appendChild(addPrompt);
            }
        }

        renderMessages() {
            const area = document.getElementById('messagesArea');
            area.innerHTML = '';
            const messages = this.db.history[this.activeChat] || [];

            if (messages.length === 0) {
                const empty = document.createElement('div');
                empty.style.textAlign = 'center';
                empty.style.color = 'var(--tg-text-muted)';
                empty.style.marginTop = '40px';
                empty.style.fontSize = '0.85rem';
                empty.innerHTML = '✨ Сообщений пока нет.<br>Напишите текст, отправьте кружочек или подарок!';
                area.appendChild(empty);
                return;
            }

            messages.forEach(m => {
                const contactInfo = this.db.contacts[this.activeChat] || {};
                const isMy = m.sender === 'my' || m.sender === this.myPeerId;
                const bubble = document.createElement('div');
                bubble.className = `message-bubble ${isMy ? 'my' : 'peer'}`;
                bubble.setAttribute('data-msg-id', m.id);
                bubble.oncontextmenu = (e) => this.showMessageContextMenu(e, m, isMy);

                let replyHtml = m.replyTo ? `<div class="message-reply-quote">↳ ${this.escapeHtml(m.replyTo.text)}</div>` : '';
                let textHtml = m.text ? `<div>${this.escapeHtml(m.text)}</div>` : '';
                let imgHtml = m.img ? `<img class="message-img" src="${m.img}" onclick="window.open('${m.img}')">` : '';

                let docHtml = '';
                if (m.doc) {
                    docHtml = `
                        <div style="display:flex; align-items:center; gap:8px; background:var(--tg-chip-bg); padding:8px; border-radius:10px; margin-top:4px;">
                            <span style="font-size:1.6rem;">📄</span>
                            <div style="flex:1; overflow:hidden;">
                                <div style="font-size:0.8rem; font-weight:600; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${this.escapeHtml(m.doc.name)}</div>
                                <div style="font-size:0.7rem; color:var(--tg-text-muted);">${m.doc.size}</div>
                            </div>
                            <a href="${m.doc.data}" download="${m.doc.name}" class="action-btn" style="padding:4px 8px; font-size:0.7rem; text-decoration:none;">Скачать</a>
                        </div>
                    `;
                }

                let giftHtml = '';
                if (m.gift) {
                    giftHtml = `
                        <div style="background:linear-gradient(135deg, #f59e0b, #ef4444); border-radius:14px; padding:10px; color:#fff; text-align:center; margin:4px 0;">
                            <div style="font-size:2.5rem;">${m.gift.icon}</div>
                            <div style="font-weight:700; font-size:1rem;">${m.gift.name}</div>
                            <div style="font-size:0.75rem; opacity:0.9;">Подарок за ${m.gift.price} ⭐</div>
                        </div>
                    `;
                }

                // Video Circle with Speed Control
                let circleHtml = '';
                if (m.circle) {
                    circleHtml = `
                        <div class="video-circle-wrap" onclick="AppManager.toggleCirclePlayback(this)">
                            <video src="${m.circle}" loop playsinline webkit-playsinline></video>
                            <div class="video-circle-play-btn">▶</div>
                            <div class="speed-badge">1.0x</div>
                        </div>
                    `;
                }

                // Voice Note Player
                let voiceHtml = '';
                if (m.voice) {
                    voiceHtml = `
                        <div class="voice-player" id="voice_${m.id}">
                            <button class="voice-play-btn" onclick="AppManager.toggleVoiceAudio('${m.id}', '${m.voice.audio}')">▶</button>
                            <div class="waveform-bar">
                                <div class="waveform-stick" style="height:12px;"></div>
                                <div class="waveform-stick" style="height:18px;"></div>
                                <div class="waveform-stick" style="height:22px;"></div>
                                <div class="waveform-stick" style="height:14px;"></div>
                                <div class="waveform-stick" style="height:20px;"></div>
                                <div class="waveform-stick" style="height:10px;"></div>
                            </div>
                            <span style="font-size:0.72rem; color:var(--tg-text-muted);">${m.voice.duration || 1}s</span>
                        </div>
                    `;
                }

                let reactionsHtml = '<div class="reactions-row">';
                if (m.reactions) {
                    Object.entries(m.reactions).forEach(([emoji, count]) => {
                        reactionsHtml += `<div class="reaction-chip" onclick="AppManager.reactToMessage('${m.id}', '${emoji}')">${emoji} ${count}</div>`;
                    });
                }
                reactionsHtml += `
                    <div class="reaction-chip" onclick="AppManager.reactToMessage('${m.id}', '❤️')">❤️</div>
                    <div class="reaction-chip" onclick="AppManager.reactToMessage('${m.id}', '🔥')">🔥</div>
                    <div class="reaction-chip" onclick="AppManager.reactToMessage('${m.id}', '👍')">👍</div>
                </div>`;

                const checkmarks = isMy ? (m.delivered ? ' ✓✓' : ' ✓') : '';
                const editedMark = m.edited ? '<span style="font-size:.68rem; color:var(--tg-text-muted); margin-right:4px;">изменено</span>' : '';
                const snippet = m.text ? m.text.substring(0, 25) : '[Медиа]';
                const footerHtml = `
                    <div class="message-footer-info">
                        ${m.text ? `<span class="tts-speaker-btn" onclick="AppManager.speakText('${this.escapeHtml(m.text)}')">🔊</span>` : ''}
                        <span class="tts-speaker-btn" onclick="AppManager.setReply('${m.id}', '${this.escapeHtml(snippet)}')">↩️</span>
                        <span class="tts-speaker-btn" onclick="AppManager.pinMessage('${this.escapeHtml(snippet)}')">📌</span>
                        ${editedMark}
                        <span>${m.time || ''}</span>
                        <span>${checkmarks}</span>
                    </div>
                `;

                let senderLabel = '';
                if (!isMy && (contactInfo.isGroup || contactInfo.isChannel) && m.sender !== 'sys') {
                    const srcNick = m.senderNick || ((this.db.contacts[m.sender] || {}).nick) || m.sender || 'Участник';
                    senderLabel = `<div style="font-size:.72rem; font-weight:700; color:var(--tg-accent-2); margin-bottom:3px;">${this.escapeHtml(srcNick)}</div>`;
                }

                bubble.innerHTML = `${senderLabel}${replyHtml}${textHtml}${imgHtml}${docHtml}${giftHtml}${circleHtml}${voiceHtml}${reactionsHtml}${footerHtml}`;
                area.appendChild(bubble);
            });

            area.scrollTop = area.scrollHeight;
        }

        // --- GROUPS & CHANNELS ---
        groupEmojis() {
            return ['🐶','🐕','🐩','🦮','🐱','🐈','🦊','🐻','🐼','🐨','🦁','🐯','🦄','🐰','🐹','🦝','🐸','🐤','🦉','🐳','📢','📣','🔔','📡','⭐','🔥','🎮','🚀'];
        }

        isChannelAdmin(chatId) {
            const g = this.db.groups[chatId];
            if (!g) return false;
            if (g.owner === this.myPeerId) return true;
            return (g.admins || []).indexOf(this.myPeerId) !== -1;
        }

        avatarHtmlOf(contact, fallbackName) {
            const a = contact ? contact.avatar : '';
            if (a && (/^https?:|^data:/i.test(a))) return `<img src="${a}">`;
            if (a) return `<span style="font-size:1.1rem;">${a}</span>`;
            const ch = fallbackName ? [...fallbackName][0] : '?';
            return (ch && ch.toUpperCase && ch.length === 1) ? ch.toUpperCase() : (ch || '?');
        }

        setChatAvatar(box, contact, fallbackName) {
            if (!box) return;
            const a = contact ? contact.avatar : '';
            if (a && (/^https?:|^data:/i.test(a))) {
                box.innerHTML = `<img src="${a}">`;
            } else if (a) {
                box.innerHTML = `<span style="font-size:1.1rem;">${a}</span>`;
            } else {
                const ch = fallbackName ? [...fallbackName][0] : '?';
                box.textContent = (ch && ch.toUpperCase && ch.length === 1) ? ch.toUpperCase() : (ch || '?');
            }
        }

        openCreateChatModal(type) {
            this.creatingChatType = type || 'group';
            this.selectedGroupMembers = [];
            document.getElementById('createChatTitle').textContent = type === 'channel' ? '📢 Создать канал' : '👥 Создать группу';
            document.getElementById('createChatName').value = '';
            document.getElementById('createChatError').textContent = '';

            const av = document.getElementById('createChatAvatars');
            av.innerHTML = '';
            this.groupEmojis().forEach((e) => {
                const b = document.createElement('button');
                b.className = 'emoji-btn';
                b.textContent = e;
                b.onclick = () => {
                    this.creatingChatAvatar = e;
                    av.querySelectorAll('button').forEach(x => { x.style.background = ''; });
                    b.style.background = 'var(--tg-border)';
                    b.style.borderRadius = '10px';
                };
                av.appendChild(b);
            });
            this.creatingChatAvatar = '';

            const membersBox = document.getElementById('createChatMembers');
            const list = Object.keys(this.db.contacts).filter(id => {
                const c = this.db.contacts[id] || {};
                return !c.isBot && !c.isSaved && !c.isGroup && !c.isChannel && id !== this.myPeerId;
            });
            if (list.length === 0) {
                membersBox.innerHTML = '<div style="font-size:.75rem; color:var(--tg-text-muted); padding:6px 2px;">Пока нет контактов — просто создастся чат. Добавить участников можно позже, их пригласят при следующем сообщении.</div>';
            } else {
                membersBox.innerHTML = '<div style="font-size:.72rem; color:var(--tg-text-muted); font-weight:700; margin-bottom:4px;">Участники</div>';
                list.forEach(id => {
                    const c = this.db.contacts[id] || {};
                    const row = document.createElement('label');
                    row.style.cssText = 'display:flex; align-items:center; gap:9px; padding:7px 6px; border-radius:10px; cursor:pointer;';
                    row.innerHTML = `<input type="checkbox" class="gm-check" data-id="${id}" style="width:16px; height:16px; accent-color:var(--tg-accent);"> <span style="font-size:.85rem;">${this.escapeHtml(c.nick || id)}</span>`;
                    row.querySelector('input').onchange = (e) => {
                        this.selectedGroupMembers = this.selectedGroupMembers.filter(m => m !== id);
                        if (e.target.checked) this.selectedGroupMembers.push(id);
                    };
                    membersBox.appendChild(row);
                });
            }

            this.ui.openModal('createChatModal');
        }

        createChat() {
            const type = this.creatingChatType || 'group';
            const name = document.getElementById('createChatName').value.trim();
            if (!name) {
                document.getElementById('createChatError').textContent = 'Введите название.';
                return;
            }
            const safe = toSafeId(name) || 'chat';
            let id = (type === 'channel' ? 'channel_' : 'group_') + safe;
            let n = 2;
            while (this.db.groups[id]) { id = (type === 'channel' ? 'channel_' : 'group_') + safe + '_' + n++; }

            const members = [this.myPeerId, ...this.selectedGroupMembers.filter(m => m && m !== this.myPeerId)];
            const uniqueMembers = Array.from(new Set(members));
            const avatar = this.creatingChatAvatar || (type === 'channel' ? '📢' : '🐶');
            const g = {
                id, name, type, avatar,
                owner: this.myPeerId,
                admins: [this.myPeerId],
                members: uniqueMembers,
                desc: ''
            };
            this.db.groups[id] = g;
            this.db.contacts[id] = { nick: name, avatar, isGroup: true, isChannel: type === 'channel' };
            this.db.history[id] = [{
                id: 'sys_' + Date.now(),
                sender: 'sys',
                text: type === 'channel'
                    ? `📣 Канал «${name}» создан. Публиковать могут только администраторы.`
                    : `👥 Группа «${name}» создана. Участников: ${uniqueMembers.length}`,
                time: this.formatTime()
            }];
            this.saveStorage();
            this.ui.closeModal('createChatModal');
            this.renderChats();
            uniqueMembers.forEach(m => {
                if (m !== this.myPeerId) {
                    const conn = this.connections[m];
                    if (conn && conn.open) {
                        try { conn.send({ type: 'group-invite', group: g }); } catch(e) {}
                    }
                }
            });
            this.openChat(id, name);
            this.showToast(type === 'channel' ? 'Канал создан! 📣' : 'Группа создана! 🎉');
        }

        dispatchGroupPayload(payload) {
            const chatId = this.activeChat;
            if (!chatId) return;
            const g = this.db.groups[chatId];
            if (!g) return;
            if (g.type === 'channel' && !this.isChannelAdmin(chatId)) {
                this.showToast('🔒 Публиковать в канале может только создатель');
                return;
            }
            if (!this.db.history[chatId]) this.db.history[chatId] = [];
            this.db.history[chatId].push(payload);
            this.saveStorage();
            this.renderMessages();
            this.renderChats();
            this.sound.playSend();
            if (navigator.vibrate) navigator.vibrate(30);

            const remote = JSON.parse(JSON.stringify(payload));
            remote.sender = this.myPeerId;
            remote.senderNick = this.db.profile.nick || this.myPeerId;

            (g.members || []).forEach(m => {
                if (m === this.myPeerId) return;
                const conn = this.connections[m];
                if (conn && conn.open) {
                    try {
                        conn.send({
                            type: 'group-msg',
                            groupId: chatId,
                            id: payload.id,
                            groupName: g.name,
                            groupType: g.type,
                            groupAvatar: g.avatar,
                            payload: remote
                        });
                    } catch(e) {}
                }
            });
        }

        uploadAvatar(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                this.db.profile.avatar = evt.target.result;
                this.saveStorage();
                this.initPeerNetwork();
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    }

    const AppManager = new EnterpriseMessenger();
    window.addEventListener('DOMContentLoaded', () => AppManager.init());

    /* --- Mobile / Android runtime optimizations --- */
    (function () {
        "use strict";
        var isAndroid = !!window.AndroidNative;

        /* Native haptic feedback (Android) with graceful fallback */
        window.__tgVibrate = function (pattern) {
            if (isAndroid) {
                try { window.AndroidNative.vibrate(typeof pattern === 'number' ? pattern : 30); return; } catch (e) { }
            }
            if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) { } }
        };

        /* Route all existing navigator.vibrate calls through the native bridge */
        if (isAndroid) {
            try {
                var nativeVibrate = navigator.vibrate && navigator.vibrate.bind(navigator);
                navigator.vibrate = function (pattern) {
                    window.__tgVibrate(pattern);
                    return true;
                };
                void nativeVibrate;
            } catch (e) { }
        }

        /* Release camera/mic when the app goes to background (battery + privacy) */
        function releaseMedia() {
            try {
                if (window.AppManager) {
                    if (AppManager.currentCall) { AppManager.endCall && AppManager.endCall(); }
                    if (AppManager.localStream) {
                        AppManager.localStream.getTracks().forEach(function (t) { t.stop(); });
                        AppManager.localStream = null;
                    }
                    if (AppManager.mediaRecorder && AppManager.mediaRecorder.state === 'recording') {
                        AppManager.mediaRecorder.stop();
                    }
                }
            } catch (e) { }
        }
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') releaseMedia();
        });
        window.addEventListener('pagehide', releaseMedia);

        /* Keep the screen awake while recording a voice note */
        try {
            var recInput = document.getElementById('msgInputBox');
            var setAwake = function (on) {
                if (!isAndroid) return;
                try { window.AndroidNative.keepAwake(on); } catch (e) { }
            };
            document.addEventListener('touchstart', function () {
                if (AppManager && AppManager.mediaRecorder && AppManager.mediaRecorder.state === 'recording') setAwake(true);
            }, true);
            document.addEventListener('touchend', function () { setAwake(false); }, true);
            void recInput;
        } catch (e) { }

        /* Prevent double-tap zoom & pinch zoom on the whole app */
        document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, { passive: false });
        var lastTouch = 0;
        document.addEventListener('touchend', function (e) {
            var now = Date.now();
            if (now - lastTouch < 300) e.preventDefault();
            lastTouch = now;
        }, { passive: false });

        /* Android hardware back button is handled natively; expose state helpers */
        window.__tgAndroid = { isAndroid: isAndroid };
    })();