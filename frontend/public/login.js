"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var apiCaller_js_1 = require("./apiCaller.js");
var API_URL = "http://localhost:3000/api/login";
/* ── Helpers ──────────────────────────────────────── */
function toast(msg, ms) {
    if (ms === void 0) { ms = 2800; }
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { return el.classList.remove("show"); }, ms);
}
function setGreeting() {
    var h = new Date().getHours();
    var msg = "Welcome Back! 👋";
    if (h < 5)
        msg = "Good Night 🌙";
    else if (h < 12)
        msg = "Good Morning ☀️";
    else if (h < 17)
        msg = "Good Afternoon 👋";
    else if (h < 20)
        msg = "Good Evening 🌆";
    var el = document.getElementById("greeting");
    if (el)
        el.textContent = msg;
}
/* ── Toggle password visibility ───────────────────── */
document.querySelectorAll(".toggle-pw").forEach(function (btn) {
    btn.addEventListener("click", function () {
        var input = document.getElementById(btn.dataset.target);
        if (!input)
            return;
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.querySelector(".eye-open").classList.toggle("hidden", show);
        btn.querySelector(".eye-closed").classList.toggle("hidden", !show);
    });
});
/* ── Login form submit ────────────────────────────── */
var loginForm = document.getElementById("login-form");
var loginBtn = document.getElementById("login-btn");
var errorEl = document.getElementById("login-error");
var errorText = document.getElementById("login-error-text");
loginForm === null || loginForm === void 0 ? void 0 : loginForm.addEventListener("submit", function (e) { return __awaiter(void 0, void 0, void 0, function () {
    var username, password, auto_login, result_1, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                e.preventDefault();
                username = document.getElementById("login-username").value.trim();
                password = document.getElementById("login-password").value;
                auto_login = document.getElementById("auto-login").checked;
                // Basic client-side validation
                if (!username) {
                    toast("❌ Please enter your User ID");
                    return [2 /*return*/];
                }
                if (!password) {
                    toast("❌ Please enter your password");
                    return [2 /*return*/];
                }
                // Hide previous error, show loading
                errorEl.classList.add("hidden");
                loginBtn.classList.add("is-loading");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, (0, apiCaller_js_1.apiCall)(API_URL, "POST", { auto_login: auto_login, username: username, password: password })];
            case 2:
                result_1 = _a.sent();
                if (result_1.success) {
                    toast("\u2705 Welcome back, ".concat(result_1.nickname, "!"));
                    // Redirect to chat after short delay
                    setTimeout(function () { window.location.href = "/@".concat(result_1.username); }, 1000);
                }
                else {
                    errorText.textContent = "Invalid User ID or password.";
                    errorEl.classList.remove("hidden");
                    shakeForm();
                }
                return [3 /*break*/, 5];
            case 3:
                err_1 = _a.sent();
                // Network / server error
                errorText.textContent = "Could not connect to server. Please try again.";
                errorEl.classList.remove("hidden");
                shakeForm();
                return [3 /*break*/, 5];
            case 4:
                loginBtn.classList.remove("is-loading");
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); });
function shakeForm() {
    var form = document.getElementById("login-form");
    form.style.animation = "none";
    void form.offsetHeight; // reflow
    form.style.animation = "shake 0.42s ease";
}
/* ── Init ─────────────────────────────────────────── */
setGreeting();
