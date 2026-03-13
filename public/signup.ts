/**
 * signup.ts — Signup / Registration page logic
 *
 * API contract (from gp1.pdf / signup.ts stub):
 *   POST localhost:3000/api/signup
 *   Body:  { username: string, nickname: string, password: string }
 *   Response: { success: boolean, client: { username: string, nickname: string, session_id: string } }
 *
 * NOTE: "username" here is the system-generated anonymous User ID.
 *   The user only picks a nickname. The server generates the username/ID.
 *   This file posts nickname + password; username is returned by the server.
 */

import { apiCall } from "./apiCaller.js";

const API_URL = "http://localhost:3000/api/signup";

/* ── State ────────────────────────────────────────── */
let chosenNickname = "";

/* ── Helpers ──────────────────────────────────────── */
function toast(msg: string, ms = 2800): void {
    const el = document.getElementById("toast")!;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout((el as any)._t);
    (el as any)._t = setTimeout(() => el.classList.remove("show"), ms);
}

function showStep(id: string): void {
    document.querySelectorAll<HTMLElement>(".step-card").forEach((el) => el.classList.remove("active"));
    document.getElementById(id)?.classList.add("active");
}

function setTagline(text: string): void {
    const el = document.getElementById("step-tagline");
    if (el) el.textContent = text;
}

/* ── Password strength ────────────────────────────── */
function calcStrength(pw: string): number {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
}

function updateStrengthUI(pw: string): void {
    const fill = document.getElementById("strength-fill") as HTMLElement;
    const label = document.getElementById("strength-label") as HTMLElement;
    if (!fill || !label) return;

    const s = calcStrength(pw);
    const pct = pw.length ? Math.max((s / 5) * 100, 12) : 0;
    const colors = ["#f44336", "#ff9800", "#ffc107", "#8bc34a", "#4caf50"];
    const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
    const col = pw.length ? (colors[s - 1] ?? colors[0]) : "transparent";

    fill.style.width = `${pct}%`;
    fill.style.background = col;
    label.textContent = pw.length ? (labels[s - 1] ?? labels[0]) : "";
    label.style.color = col;
}

(document.getElementById("reg-password") as HTMLInputElement)
    ?.addEventListener("input", (e) => updateStrengthUI((e.target as HTMLInputElement).value));

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

/* ── STEP 1: Nickname form ────────────────────────── */
document.getElementById("back-to-nickname")?.addEventListener("click", () => {
    setTagline("Create your account");
    showStep("step-nickname");
});

(document.getElementById("nickname-form") as HTMLFormElement)
    ?.addEventListener("submit", (e: Event) => {
        e.preventDefault();
        const nick = (document.getElementById("reg-nickname") as HTMLInputElement).value.trim();
        if (nick.length < 2) { toast("❌ Nickname must be at least 2 characters"); return; }
        chosenNickname = nick;
        setTagline("Secure your account");
        showStep("step-password");
    });

/* ── STEP 2: Password + submit to API ─────────────── */
const signupBtn = document.getElementById("signup-btn") as HTMLButtonElement;
const errorEl = document.getElementById("signup-error") as HTMLElement;
const errorText = document.getElementById("signup-error-text") as HTMLElement;

(document.getElementById("password-form") as HTMLFormElement)
    ?.addEventListener("submit", async (e: Event) => {
        e.preventDefault();

        const pw = (document.getElementById("reg-password") as HTMLInputElement).value;
        const pw2 = (document.getElementById("reg-confirm") as HTMLInputElement).value;

        if (pw.length < 8) { toast("❌ Password must be at least 8 characters"); return; }
        if (pw !== pw2) { toast("❌ Passwords do not match"); return; }
        if (calcStrength(pw) < 2) { toast("⚠️ Password is too weak. Add numbers or symbols."); return; }

        // Hide previous errors, show loading
        errorEl.classList.add("hidden");
        signupBtn.classList.add("is-loading");

        try {
            // The server generates the anonymous username/ID
            // We send nickname + password; username field is intentionally empty
            // and the server will return the generated username in the response.
            const result = await apiCall(API_URL, "POST", {
                username: "",           // server-generated
                nickname: chosenNickname,
                password: pw,
            });

            if (result.success) {
                // Store session
                sessionStorage.setItem("session_id", result.client.session_id);
                sessionStorage.setItem("username", result.client.username);
                sessionStorage.setItem("nickname", result.client.nickname);

                // Show the generated User ID on success screen
                const idEl = document.getElementById("generated-id");
                if (idEl) idEl.textContent = result.client.username;

                setTagline("You're all set! 🎉");
                showStep("step-success");
            } else {
                errorText.textContent = "Registration failed. Please try a different nickname.";
                errorEl.classList.remove("hidden");
            }
        } catch (err: any) {
            errorText.textContent = "Could not connect to server. Please try again.";
            errorEl.classList.remove("hidden");
        } finally {
            signupBtn.classList.remove("is-loading");
        }
    });

/* ── STEP 3: Copy ID button ───────────────────────── */
document.getElementById("copy-id-btn")?.addEventListener("click", () => {
    const uid = document.getElementById("generated-id")!.textContent ?? "";
    const label = document.getElementById("copy-label")!;

    navigator.clipboard.writeText(uid)
        .then(() => {
            label.textContent = "Copied!";
            toast("✅ User ID copied to clipboard");
            setTimeout(() => { label.textContent = "Copy ID"; }, 2200);
        })
        .catch(() => toast("⚠️ Could not copy — please copy the ID manually"));
});

/* ── Init ─────────────────────────────────────────── */
showStep("step-nickname");
