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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
var apiCaller_js_1 = require("./apiCaller.js");
var API_URL = "http://localhost:3000/api/signup";
/* ── State ────────────────────────────────────────── */
var chosenNickname = "";
var chosenUsername = "";
/* ── Helpers ──────────────────────────────────────── */
function toast(msg, ms) {
    if (ms === void 0) { ms = 2800; }
    var el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { return el.classList.remove("show"); }, ms);
}
function showStep(id) {
    var _a;
    document.querySelectorAll(".step-card").forEach(function (el) { return el.classList.remove("active"); });
    (_a = document.getElementById(id)) === null || _a === void 0 ? void 0 : _a.classList.add("active");
}
function setTagline(text) {
    var el = document.getElementById("step-tagline");
    if (el)
        el.textContent = text;
}
/* ── Password strength ────────────────────────────── */
function calcStrength(pw) {
    var s = 0;
    if (pw.length >= 8)
        s++;
    if (pw.length >= 12)
        s++;
    if (/[A-Z]/.test(pw))
        s++;
    if (/[0-9]/.test(pw))
        s++;
    if (/[^A-Za-z0-9]/.test(pw))
        s++;
    return s;
}
function updateStrengthUI(pw) {
    var _a, _b;
    var fill = document.getElementById("strength-fill");
    var label = document.getElementById("strength-label");
    if (!fill || !label)
        return;
    var s = calcStrength(pw);
    var pct = pw.length ? Math.max((s / 5) * 100, 12) : 0;
    var colors = ["#f44336", "#ff9800", "#ffc107", "#8bc34a", "#4caf50"];
    var labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
    var col = pw.length ? ((_a = colors[s - 1]) !== null && _a !== void 0 ? _a : colors[0]) : "transparent";
    fill.style.width = "".concat(pct, "%");
    fill.style.background = col;
    label.textContent = pw.length ? ((_b = labels[s - 1]) !== null && _b !== void 0 ? _b : labels[0]) : "";
    label.style.color = col;
}
(_a = document.getElementById("reg-password")) === null || _a === void 0 ? void 0 : _a.addEventListener("input", function (e) { return updateStrengthUI(e.target.value); });
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
/* ── STEP 1: Nickname form ────────────────────────── */
(_b = document.getElementById("back-to-nickname")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", function () {
    setTagline("Create your account");
    showStep("step-nickname");
});
(_c = document.getElementById("nickname-form")) === null || _c === void 0 ? void 0 : _c.addEventListener("submit", function (e) {
    e.preventDefault();
    var nick = document.getElementById("reg-nickname").value.trim();
    var user = document.getElementById("reg-username").value.trim();
    if (nick.length < 2) {
        toast("❌ Nickname must be at least 2 characters");
        return;
    }
    if (!/^[A-Za-z0-9_]{3,20}$/.test(user)) {
        toast("❌ Username must be 3-20 letters, numbers, or underscores");
        return;
    }
    chosenNickname = nick;
    chosenUsername = user;
    setTagline("Secure your account");
    showStep("step-password");
});
/* ── STEP 2: Password + submit to API ─────────────── */
var signupBtn = document.getElementById("signup-btn");
var errorEl = document.getElementById("signup-error");
var errorText = document.getElementById("signup-error-text");
(_d = document.getElementById("password-form")) === null || _d === void 0 ? void 0 : _d.addEventListener("submit", function (e) { return __awaiter(void 0, void 0, void 0, function () {
    var pw, pw2, hasUpper, hasLower, hasNum, hasSpec, result, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                e.preventDefault();
                pw = document.getElementById("reg-password").value;
                pw2 = document.getElementById("reg-confirm").value;
                hasUpper = /[A-Z]/.test(pw);
                hasLower = /[a-z]/.test(pw);
                hasNum = /[0-9]/.test(pw);
                hasSpec = /[^A-Za-z0-9]/.test(pw);
                if (pw.length < 8) {
                    toast("❌ Password must be at least 8 characters");
                    return [2 /*return*/];
                }
                if (!hasUpper || !hasLower || !hasNum || !hasSpec) {
                    toast("❌ Password must contain uppercase, lowercase, number, and special character.");
                    return [2 /*return*/];
                }
                if (pw !== pw2) {
                    toast("❌ Passwords do not match");
                    return [2 /*return*/];
                }
                // Hide previous errors, show loading
                errorEl.classList.add("hidden");
                signupBtn.classList.add("is-loading");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, (0, apiCaller_js_1.apiCall)(API_URL, "POST", {
                        username: chosenUsername,
                        nickname: chosenNickname,
                        password: pw,
                    })];
            case 2:
                result = _a.sent();
                if (result.success) {
                    setTagline("You're all set! 🎉");
                    showStep("step-success");
                    window.location.href = "/@".concat(result.username);
                }
                else {
                    errorText.textContent = result.message;
                    errorEl.classList.remove("hidden");
                }
                return [3 /*break*/, 5];
            case 3:
                err_1 = _a.sent();
                errorText.textContent = "Could not connect to server. Please try again.";
                errorEl.classList.remove("hidden");
                return [3 /*break*/, 5];
            case 4:
                signupBtn.classList.remove("is-loading");
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); });
/* ── Init ─────────────────────────────────────────── */
showStep("step-nickname");
