/**
 * SawaChat — Auth Flow (Frontend Prototype)
 *
 * Registration Flow (gp1.pdf REQ-F1.1):
 *   Step 1: Enter nickname only
 *   Step 2: Set password
 *   Step 3: Optional biometric setup
 *   Result: System generates unique anonymous User ID
 *
 * Login Flow (gp1.pdf REQ-F1.2):
 *   User ID + Password  OR  Biometric
 */

(function () {
    'use strict';

    /* ──────────────────────────────────────────────
       State
    ────────────────────────────────────────────── */
    const state = {
        scanType: null,      // 'face' | 'fingerprint'
        scanContext: null,   // 'register' | 'login'
        nickname: '',
    };

    /* ──────────────────────────────────────────────
       Helpers
    ────────────────────────────────────────────── */
    function show(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id)?.classList.add('active');
    }

    function setTagline(text) {
        const el = document.getElementById('header-tagline');
        if (el) el.textContent = text;
    }

    function toast(msg, ms = 2800) {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(t._t);
        t._t = setTimeout(() => t.classList.remove('show'), ms);
    }

    function generateId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id = 'USER';
        for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
        return id;
    }

    function timeGreeting() {
        const h = new Date().getHours();
        if (h < 5) return 'Good Night 🌙';
        if (h < 12) return 'Good Morning ☀️';
        if (h < 17) return 'Good Afternoon 👋';
        return 'Good Evening 🌆';
    }

    function wait(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    /* Password strength */
    function strength(pw) {
        let s = 0;
        if (pw.length >= 8) s++;
        if (pw.length >= 12) s++;
        if (/[A-Z]/.test(pw)) s++;
        if (/[0-9]/.test(pw)) s++;
        if (/[^A-Za-z0-9]/.test(pw)) s++;
        return s;
    }

    function updateStrengthUI(pw) {
        const fill = document.getElementById('strength-fill');
        const label = document.getElementById('strength-label');
        if (!fill || !label) return;
        const s = strength(pw);
        const pct = pw.length ? Math.max((s / 5) * 100, 12) : 0;
        const colors = ['#f44336', '#ff9800', '#ffc107', '#8bc34a', '#4caf50'];
        const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
        const col = pw.length ? (colors[s - 1] || colors[0]) : 'transparent';
        fill.style.width = `${pct}%`;
        fill.style.background = col;
        label.textContent = pw.length ? (labels[s - 1] || labels[0]) : '';
        label.style.color = col;
    }

    /* ──────────────────────────────────────────────
       Toggle password visibility
    ────────────────────────────────────────────── */
    document.querySelectorAll('.toggle-pw').forEach(btn => {
        btn.addEventListener('click', () => {
            const inp = document.getElementById(btn.dataset.target);
            if (!inp) return;
            const show = inp.type === 'password';
            inp.type = show ? 'text' : 'password';
            btn.querySelector('.eye-open').classList.toggle('hidden', show);
            btn.querySelector('.eye-closed').classList.toggle('hidden', !show);
        });
    });

    /* Live password strength */
    document.getElementById('reg-password')
        ?.addEventListener('input', e => updateStrengthUI(e.target.value));

    /* ──────────────────────────────────────────────
       SCREEN: Welcome
    ────────────────────────────────────────────── */
    document.getElementById('btn-create-account')?.addEventListener('click', () => {
        setTagline('Create your account');
        show('screen-register-nickname');
    });

    document.getElementById('btn-go-login')?.addEventListener('click', () => {
        setTagline('Welcome back');
        document.getElementById('greeting-text').textContent = timeGreeting();
        show('screen-login');
    });

    /* ──────────────────────────────────────────────
       SCREEN: Register — Nickname
       REQ-F1.1: user picks a nickname; system gives the ID
    ────────────────────────────────────────────── */
    document.getElementById('back-to-welcome-from-nickname')?.addEventListener('click', () => {
        setTagline('Secure messaging with AI-powered safety');
        show('screen-welcome');
    });

    document.getElementById('nickname-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const nick = document.getElementById('reg-nickname').value.trim();
        if (nick.length < 2) { toast('❌ Nickname must be at least 2 characters'); return; }
        state.nickname = nick;
        setTagline('Secure your account');
        show('screen-register-password');
    });

    /* ──────────────────────────────────────────────
       SCREEN: Register — Password
    ────────────────────────────────────────────── */
    document.getElementById('back-to-nickname')?.addEventListener('click', () => {
        setTagline('Create your account');
        show('screen-register-nickname');
    });

    document.getElementById('password-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const pw = document.getElementById('reg-password').value;
        const pw2 = document.getElementById('reg-confirm').value;
        if (pw.length < 8) { toast('❌ Password must be at least 8 characters'); return; }
        if (pw !== pw2) { toast('❌ Passwords do not match'); return; }
        setTagline('Secure your account');
        show('screen-biometric');
    });

    /* ──────────────────────────────────────────────
       SCREEN: Biometric Setup
    ────────────────────────────────────────────── */
    document.getElementById('back-to-password')?.addEventListener('click', () => {
        setTagline('Secure your account');
        show('screen-register-password');
    });

    document.getElementById('btn-setup-face')?.addEventListener('click', () => startScan('face', 'register'));
    document.getElementById('btn-setup-fingerprint')?.addEventListener('click', () => startScan('fingerprint', 'register'));
    document.getElementById('btn-skip-bio')?.addEventListener('click', () => completeRegistration());

    /* ──────────────────────────────────────────────
       SCREEN: Biometric Scanning (shared)
    ────────────────────────────────────────────── */
    const FACE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M4 6C4 4.896 4.896 4 6 4H8"/><path d="M16 4H18C19.104 4 20 4.896 20 6V8"/>
        <path d="M20 16V18C20 19.104 19.104 20 18 20H16"/><path d="M8 20H6C4.896 20 4 19.104 4 18V16"/>
        <path d="M9 10C9 10 10 11 12 11C14 11 15 10 15 10"/>
        <path d="M9 15C10.5 16.5 13.5 16.5 15 15"/>
        <circle cx="9" cy="8.5" r="0.5" fill="white"/><circle cx="15" cy="8.5" r="0.5" fill="white"/>
    </svg>`;

    const FP_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04.054-.09A13.916 13.916 0 0 0 8 11a4 4 0 1 1 8 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0 0 15.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 0 0 4 11"/>
    </svg>`;

    function startScan(type, context) {
        state.scanType = type;
        state.scanContext = context;
        const isFace = type === 'face';

        document.getElementById('scan-icon').innerHTML = isFace ? FACE_SVG : FP_SVG;
        document.getElementById('scan-title').textContent =
            context === 'login' ? 'Authenticating...' : 'Setting up...';
        document.getElementById('scan-sub').textContent =
            isFace ? 'Look at your camera' : 'Place your finger on the sensor';

        setTagline('Secure your account');
        show('screen-scanning');

        // Simulate biometric scan (2.5 s)
        setTimeout(() => {
            if (context === 'register') completeRegistration();
            else completeBiometricLogin();
        }, 2500);
    }

    document.getElementById('back-from-scanning')?.addEventListener('click', () => {
        if (state.scanContext === 'login') {
            setTagline('Welcome back');
            show('screen-login');
        } else {
            setTagline('Secure your account');
            show('screen-biometric');
        }
    });

    /* ──────────────────────────────────────────────
       SCREEN: Registration Success
       System generates the anonymous User ID here
    ────────────────────────────────────────────── */
    function completeRegistration() {
        const uid = generateId();
        document.getElementById('generated-id').textContent = uid;
        setTagline("You're all set!");
        show('screen-success');
    }

    document.getElementById('copy-id-btn')?.addEventListener('click', () => {
        const uid = document.getElementById('generated-id').textContent;
        const label = document.getElementById('copy-label');
        navigator.clipboard.writeText(uid)
            .then(() => {
                label.textContent = 'Copied!';
                toast('✅ User ID copied to clipboard');
                setTimeout(() => label.textContent = 'Copy ID', 2200);
            })
            .catch(() => toast('⚠️ Could not copy — please copy the ID manually'));
    });

    document.getElementById('btn-start-chatting')?.addEventListener('click', () => {
        toast('🚀 Redirecting to SawaChat...');
        // In production: window.location.href = '/chat';
    });

    /* ──────────────────────────────────────────────
       SCREEN: Login
       REQ-F1.2: Authenticate with User ID + password
    ────────────────────────────────────────────── */
    document.getElementById('back-to-welcome-from-login')?.addEventListener('click', () => {
        setTagline('Secure messaging with AI-powered safety');
        show('screen-welcome');
    });

    document.getElementById('login-form')?.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('login-submit-btn');
        const errEl = document.getElementById('login-error');
        const uid = document.getElementById('login-id').value.trim();
        const pw = document.getElementById('login-pw').value;

        errEl.classList.add('hidden');
        btn.classList.add('is-loading');

        // Simulate REST API call (REQ-CI.2: non-real-time ops use REST/HTTPS)
        await wait(1500);
        btn.classList.remove('is-loading');

        // Mock validation — IDs start with USER, password >= 8 chars
        if (uid.toUpperCase().startsWith('USER') && pw.length >= 8) {
            toast('✅ Authentication successful! Welcome back.');
            // production: window.location.href = '/chat';
        } else {
            errEl.classList.remove('hidden');
            const form = document.getElementById('login-form');
            form.style.animation = 'none';
            void form.offsetHeight; // reflow
            form.style.animation = 'shake 0.42s ease';
        }
    });

    /* Biometric login buttons */
    document.getElementById('login-face')?.addEventListener('click', () => startScan('face', 'login'));
    document.getElementById('login-fingerprint')?.addEventListener('click', () => startScan('fingerprint', 'login'));

    function completeBiometricLogin() {
        toast(`✅ ${state.scanType === 'face' ? 'Face ID' : 'Fingerprint'} verified! Welcome back.`);
        setTagline('Welcome back');
        show('screen-login');
    }

    /* ──────────────────────────────────────────────
       Init
    ────────────────────────────────────────────── */
    document.getElementById('greeting-text').textContent = timeGreeting();
    show('screen-welcome');

}());
