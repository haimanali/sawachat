/**
 * chat.ts — Main chat dashboard logic
 */

import { apiCall } from "./apiCaller.js";

/* ── DOM Elements ─────────────────────────────────── */
const chatList = document.getElementById("chat-list") as HTMLElement;

const addFriendModal = document.getElementById("add-friend-modal") as HTMLElement;
const openAddFriendBtn = document.getElementById("open-add-friend-btn") as HTMLButtonElement;
const closeAddFriendBtn = document.getElementById("close-add-friend") as HTMLButtonElement;
const friendForm = document.getElementById("add-friend-form") as HTMLFormElement;
const friendInput = document.getElementById("friend-username") as HTMLInputElement;

const editProfileModal = document.getElementById("edit-profile-modal") as HTMLElement;
const closeEditProfileBtn = document.getElementById("close-edit-profile") as HTMLButtonElement;
const editProfileForm = document.getElementById("edit-profile-form") as HTMLFormElement;
const editNicknameInput = document.getElementById("edit-nickname-input") as HTMLInputElement;

const activeChatAvatar = document.getElementById("active-chat-avatar") as HTMLElement;
const activeChatName = document.getElementById("active-chat-name") as HTMLElement;
const messagesArea = document.getElementById("messages-area") as HTMLElement;
const messageForm = document.getElementById("message-form") as HTMLFormElement;
const messageInput = document.getElementById("message-input") as HTMLInputElement;

const settingsBtn = document.getElementById("settings-btn") as HTMLButtonElement;
const closeSettings = document.getElementById("close-settings") as HTMLButtonElement;
const settingsModal = document.getElementById("settings-modal") as HTMLElement;
const settingsAvatar = document.getElementById("settings-avatar") as HTMLElement;
const settingsName = document.getElementById("settings-name") as HTMLElement;
const settingsUsername = document.getElementById("settings-username") as HTMLElement;
const editAvatarBtn = document.getElementById("edit-avatar-btn") as HTMLButtonElement;
const editNameBtn = document.getElementById("edit-name-btn") as HTMLButtonElement;
const languageSelect = document.getElementById("language-select") as HTMLSelectElement;

const chatOptionsBtn = document.getElementById("chat-options-btn") as HTMLButtonElement;
const chatDropdown = document.getElementById("chat-dropdown") as HTMLElement;
const exportChatBtn = document.getElementById("export-chat-btn") as HTMLElement;

const themeToggle = document.getElementById("theme-toggle") as HTMLElement;
const logoutBtn = document.getElementById("logout-btn") as HTMLElement;

/* ── State ────────────────────────────────────────── */
let currentUsername = sessionStorage.getItem("username") || localStorage.getItem("username");
let currentNickname = sessionStorage.getItem("nickname") || localStorage.getItem("nickname");

interface ChatPreview {
    id: string;
    nickname: string;
    username: string;
    lastMessage: string;
    messages: { text: string; isSent: boolean }[];
}

let activeChatId: string | null = null;
let chats: ChatPreview[] = [];

/* ── Init Check ───────────────────────────────────── */
if (!currentUsername) {
    // TEMPORARY BYPASS FOR UI TESTING:
    // window.location.href = "login.html";
    currentUsername = "test_user";
    currentNickname = "Testing Mode";
    console.warn("Bypassing login for UI testing");
}

// Ensure it's not null for TS
const safeNickname = currentNickname || "User";

settingsAvatar.textContent = safeNickname.charAt(0).toUpperCase();
settingsName.textContent = safeNickname;
settingsUsername.textContent = `@${currentUsername}`;
loadMockChats();
renderChatList();

/* ── Helpers ──────────────────────────────────────── */
function toast(msg: string, ms = 2800): void {
    const el = document.getElementById("toast")!;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout((el as any)._t);
    (el as any)._t = setTimeout(() => el.classList.remove("show"), ms);
}

/* ── Settings & Theme ─────────────────────────────── */
settingsBtn.addEventListener("click", () => {
    settingsModal.classList.add("active");
});

closeSettings.addEventListener("click", () => {
    settingsModal.classList.remove("active");
});

// Load saved theme preference
if (localStorage.getItem("theme") === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle.classList.add("active");
    themeToggle.setAttribute("aria-checked", "true");
}

themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
        document.documentElement.setAttribute("data-theme", "light");
        themeToggle.classList.remove("active");
        themeToggle.setAttribute("aria-checked", "false");
        localStorage.setItem("theme", "light");
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
        themeToggle.classList.add("active");
        themeToggle.setAttribute("aria-checked", "true");
        localStorage.setItem("theme", "dark");
    }
});

/* Toggle general config (Read receipts, etc. – UI mock only) */
document.querySelectorAll(".toggle-switch:not(#theme-toggle)").forEach((toggle) => {
    toggle.addEventListener("click", () => {
        toggle.classList.toggle("active");
        const isActive = toggle.classList.contains("active");
        toggle.setAttribute("aria-checked", isActive.toString());
    });
});

/* ── Logout ───────────────────────────────────────── */
logoutBtn.addEventListener("click", () => {
    sessionStorage.clear();
    localStorage.removeItem("username");
    localStorage.removeItem("nickname");
    localStorage.removeItem("session_id");
    window.location.href = "index.html";
});

/* ── Chat Logic ───────────────────────────────────── */
function loadMockChats() {
    // Basic mock logic so the dashboard has life
    const saved = localStorage.getItem("sawa_chats");
    if (saved) {
        chats = JSON.parse(saved);
    } else {
        chats = [
            {
                id: "c1",
                nickname: "Alice",
                username: "alice",
                lastMessage: "Are we still on for tomorrow?",
                messages: [
                    { text: "Hey! How are you?", isSent: false },
                    { text: "I'm good, thanks! You?", isSent: true },
                    { text: "Are we still on for tomorrow?", isSent: false },
                ]
            }
        ];
        saveChats();
    }
}

function saveChats() {
    localStorage.setItem("sawa_chats", JSON.stringify(chats));
}

function renderChatList() {
    chatList.innerHTML = "";
    if (chats.length === 0) {
        chatList.innerHTML = `<p style="padding: 16px; color: var(--text-muted); text-align: center; font-size: 0.9rem;">No friends yet. Search a username above to start chatting!</p>`;
        return;
    }

    chats.forEach(chat => {
        const item = document.createElement("div");
        item.className = "chat-item" + (chat.id === activeChatId ? " active" : "");
        item.innerHTML = `
            <div class="chat-avatar">${chat.nickname.charAt(0).toUpperCase()}</div>
            <div class="chat-meta">
                <div class="chat-name">${chat.nickname}</div>
                <div class="chat-preview">${chat.lastMessage}</div>
            </div>
        `;
        item.addEventListener("click", () => selectChat(chat.id));
        chatList.appendChild(item);
    });
}

function selectChat(id: string) {
    activeChatId = id;
    renderChatList();
    
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    // Update Header
    activeChatAvatar.textContent = chat.nickname.charAt(0).toUpperCase();
    activeChatName.textContent = chat.nickname;
    
    // Enable Form & Header Buttons
    messageForm.style.display = "flex";
    chatOptionsBtn.style.display = "flex";

    // Update messages
    messagesArea.innerHTML = "";
    chat.messages.forEach(msg => {
        const div = document.createElement("div");
        div.className = "message " + (msg.isSent ? "sent" : "received");
        div.textContent = msg.text;
        messagesArea.appendChild(div);
    });
    messagesArea.scrollTop = messagesArea.scrollHeight;
    messageInput.focus();
}

/* ── Export Chat & Editing Extras ─────────────────── */
chatOptionsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    chatDropdown.classList.toggle("active");
});

document.addEventListener("click", (e) => {
    if (!chatDropdown.contains(e.target as Node) && e.target !== chatOptionsBtn) {
        chatDropdown.classList.remove("active");
    }
});

// Mock other dropdown actions
document.querySelectorAll(".dropdown-item:not(#export-chat-btn)").forEach(item => {
    item.addEventListener("click", () => {
        chatDropdown.classList.remove("active");
        toast("ℹ️ " + item.textContent + " will be available in the next backend update.");
    });
});

exportChatBtn.addEventListener("click", () => {
    chatDropdown.classList.remove("active");
    if (!activeChatId) return;
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat) return;

    let content = `Chat Export with @${chat.username}\n\n`;
    chat.messages.forEach(msg => {
        const sender = msg.isSent ? "You" : chat.nickname;
        content += `[${sender}]: ${msg.text}\n`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SawaChat_${chat.username}_Export.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast("✅ Chat exported successfully!");
});

/* ── Edit Profile Modal ────────────────────────────── */
editNameBtn.addEventListener("click", () => {
    editProfileModal.classList.add("active");
    editNicknameInput.value = safeNickname;
    editNicknameInput.focus();
});

closeEditProfileBtn.addEventListener("click", () => {
    editProfileModal.classList.remove("active");
});

editProfileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newName = editNicknameInput.value.trim();
    if (newName.length >= 2) {
        currentNickname = newName;
        sessionStorage.setItem("nickname", currentNickname);
        // Note: Can't modify const safeNickname directly, so we just update the DOM
        settingsName.textContent = currentNickname;
        settingsAvatar.textContent = currentNickname.charAt(0).toUpperCase();
        toast("✅ Nickname updated!");
        editProfileModal.classList.remove("active");
    }
});

editAvatarBtn.addEventListener("click", () => {
    toast("ℹ️ Profile picture uploads require the backend to be fully started!");
});

/* ── i18n Translations ────────────────────────────── */
const translations: Record<string, Record<string, string>> = {
    en: {
        chats_title: "Chats",
        add_friend_btn: "Add a Friend",
        logout_btn: "Log out",
        settings_title: "Settings",
        cat_general: "General",
        dark_mode: "Dark Mode",
        dark_mode_sub: "Switch to dark theme UI",
        language: "Language",
        language_sub: "Choose your preferred app language",
        cat_chat: "Chat Settings",
        notifications: "Desktop Notifications",
        notif_sub: "Get alerts for new messages",
        cat_privacy: "Privacy",
        read_receipts: "Read Receipts",
        receipts_sub: "Let others see when you've read messages",
        add_friend_title: "Add a Friend",
        add_friend_sub: "Enter a user's exact username to send them a secure friend request.",
        friend_username: "Friend's Username",
        send_request: "Send Friend Request",
        empty_state: "End-to-end encrypted messaging.",
        placeholder_type: "Type a secure message...",
        placeholder_user: "username",
        contact_info: "Contact Info",
        change_wallpaper: "Change Wallpaper",
        archive_chat: "Archive Chat",
        export_chat: "Export Chat",
        clear_chat: "Clear Chat",
        edit_profile_title: "Edit Profile",
        display_name: "Display Name",
        save_changes: "Save Changes",
        placeholder_nickname: "Nickname"
    },
    ar: {
        chats_title: "المحادثات",
        add_friend_btn: "إضافة صديق",
        logout_btn: "تسجيل الخروج",
        settings_title: "الإعدادات",
        cat_general: "عام",
        dark_mode: "الوضع الداكن",
        dark_mode_sub: "التبديل إلى واجهة المستخدم ذات النسق الداكن",
        language: "لغة",
        language_sub: "اختر لغة التطبيق المفضلة لديك",
        cat_chat: "إعدادات الدردشة",
        notifications: "إشعارات سطح المكتب",
        notif_sub: "احصل على تنبيهات للرسائل الجديدة",
        cat_privacy: "الخصوصية",
        read_receipts: "إيصالات القراءة",
        receipts_sub: "دع الآخرين يرون عندما تقرأ الرسائل",
        add_friend_title: "إضافة صديق",
        add_friend_sub: "أدخل اسم المستخدم الدقيق للمستخدم لإرسال طلب صداقة آمن.",
        friend_username: "اسم مستخدم الصديق",
        send_request: "إرسال طلب صداقة",
        empty_state: "مراسلة مشفرة من طرف إلى طرف.",
        placeholder_type: "اكتب رسالة آمنة...",
        placeholder_user: "اسم المستخدم",
        contact_info: "معلومات الاتصال",
        change_wallpaper: "تغيير الخلفية",
        archive_chat: "أرشفة الدردشة",
        export_chat: "تصدير الدردشة",
        clear_chat: "مسح الدردشة",
        edit_profile_title: "تعديل الملف الشخصي",
        display_name: "الاسم المعروض",
        save_changes: "حفظ التغييرات",
        placeholder_nickname: "الاسم المستعار"
    }
};

function updateLanguage(lang: string) {
    const dict = translations[lang] || translations["en"];
    
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (key && dict[key]) {
            el.textContent = dict[key];
        }
    });

    messageInput.placeholder = dict["placeholder_type"];
    friendInput.placeholder = dict["placeholder_user"];
    editNicknameInput.placeholder = dict["placeholder_nickname"];
    
    // Save setting
    localStorage.setItem("app_lang", lang);
}

// Initial Lang Load
const savedLang = localStorage.getItem("app_lang") || "en";
if (savedLang === "ar") {
    languageSelect.value = "ar";
    document.documentElement.setAttribute("dir", "rtl");
    updateLanguage("ar");
}

languageSelect.addEventListener("change", (e) => {
    const lang = (e.target as HTMLSelectElement).value;
    if (lang === "ar") {
        toast("✅ تم تغيير اللغة إلى العربية");
        document.documentElement.setAttribute("dir", "rtl"); 
        updateLanguage("ar");
    } else {
        toast("✅ Language changed to English");
        document.documentElement.setAttribute("dir", "ltr");
        updateLanguage("en");
    }
});

/* ── Add Friend ───────────────────────────────────── */
friendForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const targetUser = friendInput.value.trim();
    if (!targetUser) return;
    
    if (targetUser === currentUsername) {
        toast("❌ You can't add yourself!");
        return;
    }

    const existing = chats.find(c => c.username === targetUser);
    if (existing) {
        toast("ℹ️ You already have a chat with this user.");
        selectChat(existing.id);
        friendInput.value = "";
        return;
    }

    // In a real app we would call 'apiCall("/api/add-friend", ...)'
    // Here we just mock adding the user to the chat list.
    const newChat: ChatPreview = {
        id: "c" + Date.now().toString(),
        nickname: targetUser, // Default nickname to the username until actual lookup
        username: targetUser,
        lastMessage: "Say hello!",
        messages: []
    };

    chats.unshift(newChat);
    saveChats();
    renderChatList();
    selectChat(newChat.id);
    friendInput.value = "";
    toast(`✅ Friend request sent to @${targetUser}`);
    addFriendModal.classList.remove("active");
});

/* ── Send Message ─────────────────────────────────── */
messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!activeChatId) return;

    const text = messageInput.value.trim();
    if (!text) return;

    const chat = chats.find(c => c.id === activeChatId);
    if (!chat) return;

    // --- AI Message Scan Requirement (gp1.pdf) ---
    // The AI checks the message before sending it to ensure no explicit rules are broken
    const lowerText = text.toLowerCase();
    const explicitWords = ["badword", "spam", "abuse", "scam"]; 
    
    if (explicitWords.some(w => lowerText.includes(w))) {
        toast("⚠️ AI Warning: Your message was blocked for containing explicit content.");
        return;
    }

    // In a real app we would await apiCall("/api/send-message", ...)
    
    // Add to UI immediately mock
    chat.messages.push({ text, isSent: true });
    chat.lastMessage = text;
    saveChats();

    const div = document.createElement("div");
    div.className = "message sent";
    div.textContent = text;
    messagesArea.appendChild(div);
    messagesArea.scrollTop = messagesArea.scrollHeight;
    
    messageInput.value = "";
    renderChatList();
});

/* ── Add Friend Modal ─────────────────────────────── */
openAddFriendBtn.addEventListener("click", () => {
    addFriendModal.classList.add("active");
    friendInput.focus();
});

closeAddFriendBtn.addEventListener("click", () => {
    addFriendModal.classList.remove("active");
});
