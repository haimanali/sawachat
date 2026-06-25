import React from "react";
import { Link } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket";
import { useApp } from "../../hooks/useApp";
import UserAvatar from "../../componets/avatar/userAvatar"
import { IPayloadRequestType } from "../../interfaces/payload/EPaylaod";
import ImageCropperPOPUP from "./ImageCropperPOPUP";

export default function UserSettingsPOPUP() {

    const { userState, settingsPOPUP, setSettingsPOPUP, socket, showToast } = useSocket()!;
    const { theme, setTheme, language, setLanguage, readReceipts, setReadReceipts, t } = useApp();

    const [isEditingNickname, setIsEditingNickname] = React.useState(false);
    const [newNickname, setNewNickname] = React.useState("");

    const [avatarToCrop, setAvatarToCrop] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (userState) {
            setNewNickname(userState.nickname);
        }
    }, [userState]);

    const handleSaveNickname = () => {
        if (newNickname.trim() && newNickname !== userState.nickname) {
            socket.emit("message", {
                type: IPayloadRequestType.UPDATE_NICKNAME,
                payload: { nickname: newNickname.trim() }
            });
        }
        setIsEditingNickname(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

            // SECURITY CHECK: TYPE & SIZE (NFR 1.7)
            if (!allowedTypes.includes(file.type)) {
                showToast(t('error_invalid_file_type') || "Invalid file type! Please upload a JPEG, PNG, or WebP image.");
                return;
            }

            if (file.size > 1024 * 1024) {
                showToast(t('error_file_too_large') || "File is too large! Maximum size is 1MB.");
                return;
            }

            const reader = new FileReader();
            reader.addEventListener('load', () => setAvatarToCrop(reader.result?.toString() || null));
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (base64: string) => {
        socket.emit("message", {
            type: IPayloadRequestType.UPDATE_AVATAR,
            payload:
            {
                avatar: base64,
            }
        });
        setAvatarToCrop(null);
    };

    return (<>

        <div className={`modal-overlay ${settingsPOPUP ? "active" : ""}`} id="settings-modal" inert={!settingsPOPUP}>
            <div className="modal" style={{ width: "440px", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{t('settings_title')}</h2>
                    <button className="icon-btn" id="close-settings"
                        onClick={() => { setSettingsPOPUP(false) }}
                        aria-label="Close Settings">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Profile Overview */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <button id="edit-avatar-btn"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ border: "none", background: "transparent", cursor: "pointer", position: "relative", borderRadius: "50%" }}>
                            <div className="chat-avatar" id="settings-avatar" style={{ width: "56px", height: "56px", fontSize: "1.5rem" }}>{
                                (<>
                                    <UserAvatar size="100%" nickname={userState.nickname} image={userState.avatar} type={userState.avatar_type} />
                                </>)
                            }</div>
                            <div style={{ position: "absolute", bottom: 0, right: "-4px", background: "var(--surface)", borderRadius: "50%", padding: "4px", boxShadow: "var(--shadow)" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ width: "14px", height: "14px" }}>
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </div>
                        </button>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {isEditingNickname ? (
                                    <input
                                        type="text"
                                        value={newNickname}
                                        onChange={(e) => setNewNickname(e.target.value)}
                                        onBlur={handleSaveNickname}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNickname() }}
                                        autoFocus
                                        style={{ fontSize: "1.1rem", marginBottom: "4px", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                                    />
                                ) : (
                                    <>
                                        <h3 id="settings-name" style={{ fontSize: "1.1rem", marginBottom: "4px" }}>{userState!.nickname}</h3>
                                        <button id="edit-name-btn" className="icon-btn"
                                            onClick={() => setIsEditingNickname(true)}
                                            style={{ width: "24px", height: "24px" }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "14px", height: "14px" }}>
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>
                            <p id="settings-username" style={{ color: "var(--text-sub)", fontSize: "0.9rem" }}>@{userState!.username}</p>
                        </div>
                    </div>
                </div>

                <h3 style={{ fontSize: "0.9rem", color: "var(--primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t('cat_general')}</h3>
                <div className="setting-row">
                    <div>
                        <strong>{t('dark_mode')}</strong>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-sub)", marginTop: "4px" }}>{t('dark_mode_sub')}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', color: theme === 'light' ? 'var(--primary)' : 'var(--text-sub)' }}>
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" />
                            <line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                        <div
                            className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}
                            id="theme-toggle"
                            role="switch"
                            aria-checked={theme === 'dark'}
                            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                        ></div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', color: theme === 'dark' ? 'var(--primary)' : 'var(--text-sub)' }}>
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    </div>
                </div>
              <div>  petro  </div>
              <div className="setting-row">
                    <div>
                        <strong>{t('language')}</strong>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-sub)", marginTop: "4px" }}>{t('language_sub')}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: language === 'en' ? 'var(--primary)' : 'var(--text-sub)' }}>EN</span>
                        <div
                            className={`toggle-switch ${language === 'ar' ? 'active' : ''}`}
                            id="language-toggle"
                            role="switch"
                            aria-checked={language === 'ar'}
                            onClick={() => setLanguage(prev => prev === 'en' ? 'ar' : 'en')}
                        ></div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: language === 'ar' ? 'var(--primary)' : 'var(--text-sub)' }}>AR</span>
                    </div>
                </div>
                <div className="setting-row">
                    <div>
                        <strong>{t('language')}</strong>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-sub)", marginTop: "4px" }}>{t('language_sub')}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: language === 'en' ? 'var(--primary)' : 'var(--text-sub)' }}>EN</span>
                        <div
                            className={`toggle-switch ${language === 'ar' ? 'active' : ''}`}
                            id="language-toggle"
                            role="switch"
                            aria-checked={language === 'ar'}
                            onClick={() => setLanguage(prev => prev === 'en' ? 'ar' : 'en')}
                        ></div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: language === 'ar' ? 'var(--primary)' : 'var(--text-sub)' }}>AR</span>
                    </div>
                </div>

                <h3 style={{ fontSize: "0.9rem", color: "var(--primary)", marginBottom: "16px", marginTop: "32px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t('cat_privacy')}</h3>
                <div className="setting-row" style={{ borderBottom: "none" }}>
                    <div>
                        <strong>{t('read_receipts')}</strong>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-sub)", marginTop: "4px" }}>{t('receipts_sub')}</p>
                    </div>
                    <div
                        className={`toggle-switch ${readReceipts ? 'active' : ''}`}
                        id="receipts-toggle"
                        role="switch"
                        aria-checked={readReceipts}
                        onClick={() => setReadReceipts(prev => !prev)}
                    ></div>
                </div>

                {/* Help & Policies Links */}
                <div style={{ marginTop: "32px", padding: "16px", background: "var(--surface-alt)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <Link to="/help" onClick={() => setSettingsPOPUP(false)} style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "10px" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ width: "18px", height: "18px" }}>
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        {t('help_center')}
                    </Link>
                    <Link to="/policies" onClick={() => setSettingsPOPUP(false)} style={{ color: "var(--text)", textDecoration: "none", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "10px" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ width: "18px", height: "18px" }}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        {t('policies')}
                    </Link>
                </div>
            </div>
        </div>


        {/* Edit Profile Modal */}
        <div className="modal-overlay" id="edit-profile-modal" aria-hidden="true">
            <div className="modal">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{t('edit_profile_title')}</h2>
                    <button className="icon-btn" id="close-edit-profile" aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form id="edit-profile-form">
                    <div className="input-group" style={{ marginBottom: "24px" }}>
                        <label htmlFor="edit-nickname-input">{t('display_name')}</label>
                        <input type="text" id="edit-nickname-input" placeholder={t('display_name')} autoComplete="off" required minLength={2} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>
                            <span>{t('save_changes')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>


        {/* Hidden file input for avatar */}
        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />

        {/* Avatar cropper popup */}
        {avatarToCrop && (
            <ImageCropperPOPUP
                image={avatarToCrop}
                onCropComplete={handleCropComplete}
                onClose={() => setAvatarToCrop(null)}
                aspect={1}
            />
        )}

    </>);
}