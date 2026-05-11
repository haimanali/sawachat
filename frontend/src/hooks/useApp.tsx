import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { IAppContext } from "../interfaces/context/IAppContext";
import { IClientPublic } from "../interfaces/public/IClientPublic";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../services/apiCaller";


export const translations: Record<'en' | 'ar', Record<string, string>> = {
    en: {
        chats_title: "SawaChat",
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
        edit_profile_title: "Edit Profile",
        display_name: "Display Name",
        save_changes: "Save Changes",
        tab_rooms: "Rooms",
        tab_requests: "Requests",
        tagline: "Secure messaging with AI-powered safety",
        get_started: "Get Started",
        join_anon: "Join anonymously — no phone or email needed",
        create_account: "Create New Account",
        login_existing: "Login to Existing Account",
        feature_1: "Encryption at Rest (EaR)",
        feature_2: "AI-powered moderation",
        feature_3: "Anonymous user IDs",
        feature_4: "No phone number required",
        add_contact: "Add a Contact",
        no_requests: "No requests were found",
        accept: "Accept",
        reject: "Reject",
        rejoin: "Rejoin",
        no_rooms: "No rooms were found",
        no_messages: "No messages yet.",
        empty_state: "Start Your Secure Encrypted Messaging Journey.",
        contact_info: "Contact Info",
        change_wallpaper: "Change Wallpaper",
        export_chat: "Export Chat",
        delete_contact: "Delete Contact",
        you: "You",
        msg_deleted: "This message was deleted",
        type_msg: "Type an encrypted message...",
        rejoin_ask: "Ask to rejoin",
        banned_msg: "You can no longer send messages to this room. The user might have been banned or removed you from their contacts.",
        welcome_back: "Welcome Back! 👋",
        good_night: "Good Night 🌙",
        good_morning: "Good Morning ☀️",
        good_afternoon: "Good Afternoon 👋",
        good_evening: "Good Evening 🌆",
        login_username_subtitle: "Login with your Username",
        username_label: "Username",
        username_ph: "your_username",
        password_label: "Password",
        password_ph: "••••••••",
        remember_me: "Remember me",
        no_account: "Don't have an account?",
        create_one: "Create one",
        back: "Back",
        create_account_tag: "Create your account",
        step_1_title: "Choose a Nickname",
        step_1_sub: "This is how others will see you",
        unique_username: "Unique Username",
        choose_username_ph: "choose_a_username",
        username_hint: "3–16 letters, numbers, or underscores. Cannot be changed later.",
        display_nickname: "Display Nickname",
        nickname_ph: "Enter your nickname",
        nickname_hint: "2–30 characters. You can change this later in settings.",
        continue: "Continue",
        secure_account: "Secure your account",
        step_2_title: "Set Your Password",
        step_2_sub: "Secure your anonymous account",
        min_8_char: "Min. 8 characters",
        confirm_password: "Confirm Password",
        repeat_password: "Repeat your password",
        create_account_btn: "Create Account",
        all_set: "You're all set! 🎉",
        account_created: "Account Created!",
        account_ready: "Your secure account is ready.",
        redirecting: "Redirecting you to your profile...",
        very_weak: "Very weak",
        weak: "Weak",
        fair: "Fair",
        strong: "Strong",
        very_strong: "Very strong",
        add_friend_title: "Add a Contact",
        add_friend_sub: "Enter the username of the person you want to chat with.",
        friend_username: "Contact's Username",
        send_request: "Send Contact Request",
        help_center: "Help Center",
        policies: "Policies",
        privacy_policy: "Privacy Policy",
        terms_service: "Terms of Service",
        help_sub: "Find answers and learn how to use SawaChat",
        policies_sub: "Our commitment to your privacy and safety",
        faq_encryption: "How does encryption work?",
        faq_encryption_sub: "SawaChat uses Encryption at Rest (EaR) and secure transport to keep your data safe.",
        faq_anon: "Is it really anonymous?",
        faq_anon_sub: "Yes. We don't ask for your phone number, email, or real identity.",
        privacy_policy_content: "At SawaChat, we value your anonymity. We do not collect personal identifiers like phone numbers, emails, or device IDs. Your messages are encrypted and only accessible to you and your chosen contacts.",
        terms_service_content: "By using SawaChat, you agree to communicate respectfully. Our AI moderation system works to ensure a safe environment by detecting and removing harmful content. Anonymous doesn't mean unaccountable—please be kind.",
        three_strikes_title: "Three Strikes Policy",
        three_strikes_content: "To maintain a safe community, we implement a strict three-strikes rule. If our AI moderation detects repeated violations (toxic language, harassment, or illegal content), your account will face the following actions: 1. Warning, 2. Temporary Suspension, 3. Permanent Ban."
    },
    ar: {
        chats_title: "ساوا شات",
        settings_title: "الإعدادات",
        cat_general: "عام",
        dark_mode: "الوضع الليلي",
        dark_mode_sub: "التبديل إلى واجهة المستخدم الداكنة",
        language: "اللغة",
        language_sub: "اختر لغة التطبيق المفضلة لديك",
        cat_chat: "إعدادات الدردشة",
        notifications: "إشعارات سطح المكتب",
        notif_sub: "احصل على تنبيهات للرسائل الجديدة",
        cat_privacy: "الخصوصية",
        read_receipts: "مؤشرات القراءة",
        receipts_sub: "دع الآخرين يرون متى قرأت الرسائل",
        edit_profile_title: "تعديل الملف الشخصي",
        display_name: "اسم العرض",
        save_changes: "حفظ التغييرات",
        tab_rooms: "الغرف",
        tab_requests: "الطلبات",
        tagline: "مراسلة آمنة مدعومة بالذكاء الاصطناعي",
        get_started: "ابدأ الآن",
        join_anon: "انضم بهوية مجهولة — لا حاجة لرقم هاتف أو بريد إلكتروني",
        create_account: "إنشاء حساب جديد",
        login_existing: "تسجيل الدخول إلى حساب موجود",
        feature_1: "تشفير البيانات أثناء السكون (EaR)",
        feature_2: "إشراف مدعوم بالذكاء الاصطناعي",
        feature_3: "معرفات مستخدم مجهولة",
        feature_4: "لا يلزم وجود رقم هاتف",
        add_contact: "إضافة جهة اتصال",
        no_requests: "لم يتم العثور على طلبات",
        accept: "قبول",
        reject: "رفض",
        rejoin: "إعادة الانضمام",
        no_rooms: "لم يتم العثور على غرف",
        no_messages: "لا توجد رسائل بعد.",
        empty_state: "ابدأ رحلة المراسلة المشفرة الآمنة.",
        contact_info: "معلومات جهة الاتصال",
        change_wallpaper: "تغيير الخلفية",
        export_chat: "تصدير الدردشة",
        delete_contact: "حذف جهة الاتصال",
        you: "أنت",
        msg_deleted: "تم حذف هذه الرسالة",
        type_msg: "اكتب رسالة مشفرة...",
        rejoin_ask: "طلب الانضمام",
        banned_msg: "لم يعد بإمكانك إرسال رسائل إلى هذه الغرفة. ربما تم حظر المستخدم أو إزالتك من جهات اتصاله.",
        welcome_back: "مرحبًا بعودتك! 👋",
        good_night: "تصبح على خير 🌙",
        good_morning: "صباح الخير ☀️",
        good_afternoon: "طاب مساؤك 👋",
        good_evening: "مساء الخير 🌆",
        login_username_subtitle: "تسجيل الدخول باستخدام اسم المستخدم",
        username_label: "اسم المستخدم",
        username_ph: "اسم_المستخدم_الخاص_بك",
        password_label: "كلمة المرور",
        password_ph: "••••••••",
        remember_me: "تذكرني",
        no_account: "ليس لديك حساب؟",
        create_one: "إنشاء حساب",
        back: "رجوع",
        create_account_tag: "إنشاء حسابك",
        step_1_title: "اختر اسم عرض",
        step_1_sub: "هكذا سيراك الآخرون",
        unique_username: "اسم مستخدم فريد",
        choose_username_ph: "اختر_اسم_مستخدم",
        username_hint: "3-16 حرفًا أو رقمًا أو شرطة سفلية. لا يمكن تغييره لاحقًا.",
        display_nickname: "اسم العرض",
        nickname_ph: "أدخل اسم العرض",
        nickname_hint: "2-30 حرفًا. يمكنك تغييره لاحقًا في الإعدادات.",
        continue: "متابعة",
        secure_account: "تأمين حسابك",
        step_2_title: "تعيين كلمة المرور",
        step_2_sub: "تأمين حسابك المجهول",
        min_8_char: "على الأقل 8 أحرف",
        confirm_password: "تأكيد كلمة المرور",
        repeat_password: "كرر كلمة المرور",
        create_account_btn: "إنشاء الحساب",
        all_set: "أنت جاهز! 🎉",
        account_created: "تم إنشاء الحساب!",
        account_ready: "حسابك الآمن جاهز.",
        redirecting: "جاري توجيهك إلى ملفك الشخصي...",
        very_weak: "ضعيف جدا",
        weak: "ضعيف",
        fair: "مقبول",
        strong: "قوي",
        very_strong: "قوي جدا",
        add_friend_title: "إضافة جهة اتصال",
        add_friend_sub: "أدخل اسم المستخدم للشخص الذي ترغب في الدردشة معه.",
        friend_username: "اسم مستخدم جهة الاتصال",
        send_request: "إرسال طلب تواصل",
        help_center: "مركز المساعدة",
        policies: "السياسات",
        privacy_policy: "سياسة الخصوصية",
        terms_service: "شروط الخدمة",
        help_sub: "ابحث عن إجابات وتعرف على كيفية استخدام ساوا شات",
        policies_sub: "التزامنا بخصوصيتك وسلامتك",
        faq_encryption: "كيف يعمل التشفير؟",
        faq_encryption_sub: "يستخدم ساوا شات تشفير البيانات أثناء السكون (EaR) والنقل الآمن للحفاظ على أمان بياناتك.",
        faq_anon: "هل هو مجهول حقاً؟",
        faq_anon_sub: "نعم. نحن لا نطلب رقم هاتفك أو بريدك الإلكتروني أو هويتك الحقيقية.",
        privacy_policy_content: "في ساوا شات، نحن نقدر هويتك المجهولة. نحن لا نجمع معرفات شخصية مثل أرقام الهواتف أو رسائل البريد الإلكتروني أو معرفات الأجهزة. رسائلك مشفرة ولا يمكن الوصول إليها إلا لك ولجهات الاتصال التي اخترتها.",
        terms_service_content: "باستخدام ساوا شات، فإنك توافق على التواصل باحترام. يعمل نظام الإشراف بالذكاء الاصطناعي لدينا لضمان بيئة آمنة من خلال اكتشاف وإزالة المحتوى الضار. مجهول لا يعني غير مسؤول - يرجى التعامل بلطف.",
        three_strikes_title: "سياسة الإنذارات الثلاثة",
        three_strikes_content: "للحفاظ على مجتمع آمن، نطبق قاعدة صارمة للإنذارات الثلاثة. إذا اكتشف نظام الإشراف بالذكاء الاصطناعي الخاص بنا انتهاكات متكررة (لغة سامة، تحرش، أو محتوى غير قانوني)، فسيواجه حسابك الإجراءات التالية: 1. تحذير، 2. تعليق مؤقت، 3. حظر دائم."
    }
};

const AppContext = createContext<IAppContext | undefined>(undefined);
export const AppProvider = ({ children }: { children: ReactNode }) => {

    const navigate = useNavigate();

    const [userState, setUserState] = useState<IClientPublic | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const storedTheme = localStorage.getItem('theme');
        return (storedTheme === 'light' || storedTheme === 'dark') ? storedTheme : 'dark';
    });

    const [language, setLanguage] = useState<'en' | 'ar'>(() => {
        const storedLang = localStorage.getItem('language');
        return (storedLang === 'en' || storedLang === 'ar') ? storedLang : 'en';
    });

    const [readReceipts, setReadReceipts] = useState<boolean>(() => {
        const stored = localStorage.getItem('readReceipts');
        return stored !== null ? stored === 'true' : true;
    });

    const t = (key: string) => translations[language][key] || key;

    useEffect(() => {
        const checkSession = async () => {

            const ip = "http://localhost:3000/api/auth/session";
            const response = await apiCall(ip, 'GET');

            if (response.success) {
                setUserState(response.data!);
            }
            
            setLoading(false);
        };
        checkSession();

    }, []);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('readReceipts', readReceipts.toString());
    }, [readReceipts]);

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.setAttribute('lang', language);
        document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');

    }, [language]);


    if (loading)
        return (
            <div className="full-page-loader is-loading">
                <div className="btn-loader-wrap">
                    <div className="btn-spinner" style={{ width: "40px", height: "40px", border: "4px solid #ccc", borderTopColor: " #2563eb" }}></div>
                </div>
            </div>
        );



    return (
        <AppContext.Provider value={{ userState, loading, setUserState, navigate, theme, setTheme, language, setLanguage, readReceipts, setReadReceipts, t }}>
            {children}
        </AppContext.Provider>

    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined)
        throw Error("something went wrong");

    return context;
};