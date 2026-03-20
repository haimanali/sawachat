/**
 * login.ts — Login page logic
 *
 * API contract (from gp1.pdf / login.ts stub):
 *   POST localhost:3000/api/login
 *   Body:  { auto_login: boolean, username: string, password: string }
 *   Response: { success: boolean, client: { username: string, nickname: string, session_id: string } }
 */

import { apiCall } from "./apiCaller.js";

const API_URL = "http://localhost:3000/api/login";

/* ── Helpers ──────────────────────────────────────── */
function toast(msg: string, ms = 2800): void {
    const el = document.getElementById("toast")!;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout((el as any)._t);
    (el as any)._t = setTimeout(() => el.classList.remove("show"), ms);
}

function setGreeting(): void {
    const h = new Date().getHours();
    let msg = "Welcome Back! 👋";
    if (h < 5) msg = "Good Night 🌙";
    else if (h < 12) msg = "Good Morning ☀️";
    else if (h < 17) msg = "Good Afternoon 👋";
    else if (h < 20) msg = "Good Evening 🌆";
    const el = document.getElementById("greeting");
    if (el) el.textContent = msg;
}

/* ── Toggle password visibility ───────────────────── */
document.querySelectorAll<HTMLButtonElement>(".toggle-pw").forEach((btn) => {
    btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.target!) as HTMLInputElement;
        if (!input) return;
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.querySelector(".eye-open")!.classList.toggle("hidden", show);
        btn.querySelector(".eye-closed")!.classList.toggle("hidden", !show);
    });
});

/* ── Login form submit ────────────────────────────── */
const loginForm = document.getElementById("login-form") as HTMLFormElement;
const loginBtn = document.getElementById("login-btn") as HTMLButtonElement;
const errorEl = document.getElementById("login-error") as HTMLElement;
const errorText = document.getElementById("login-error-text") as HTMLElement;

loginForm?.addEventListener("submit", async (e: Event) => {
    e.preventDefault();

    const username = (document.getElementById("login-username") as HTMLInputElement).value.trim();
    const password = (document.getElementById("login-password") as HTMLInputElement).value;
    const auto_login = (document.getElementById("auto-login") as HTMLInputElement).checked;

    // Basic client-side validation
    if (!username) { toast("❌ Please enter your Username"); return; }
    if (!password) { toast("❌ Please enter your password"); return; }

    // Hide previous error, show loading
    errorEl.classList.add("hidden");
    loginBtn.classList.add("is-loading");

    try {
        const result = await apiCall(API_URL, "POST", { auto_login, username, password });

        if (result.success) {
            // Store session
            const storage = auto_login ? localStorage : sessionStorage;
            storage.setItem("session_id", result.client.session_id);
            storage.setItem("username", result.client.username);
            storage.setItem("nickname", result.client.nickname);

            toast(`✅ Welcome back, ${result.client.nickname}!`);
            // Redirect to chat after short delay
            setTimeout(() => { window.location.href = "chat.html"; }, 1000);
        } else {
            errorText.textContent = "Invalid Username or password.";
            errorEl.classList.remove("hidden");
            shakeForm();
        }
    } catch (err: any) {
        // Network / server error
        errorText.textContent = "Could not connect to server. Please try again.";
        errorEl.classList.remove("hidden");
        shakeForm();
    } finally {
        loginBtn.classList.remove("is-loading");
    }
});

function shakeForm(): void {
    const form = document.getElementById("login-form")!;
    form.style.animation = "none";
    void form.offsetHeight; // reflow
    form.style.animation = "shake 0.42s ease";
}

/* ── Init ─────────────────────────────────────────── */
setGreeting();
