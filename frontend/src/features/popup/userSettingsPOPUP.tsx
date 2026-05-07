import React from "react";
import { useSocket } from "../../hooks/useSocket";
import UserAvatar from "../../componets/avatar/userAvatar"

export default function UserSettingsPOPUP() {

    const { userState, settingsPOPUP, setSettingsPOPUP } = useSocket()!;

    return (<>

        <div className={`modal-overlay ${settingsPOPUP ? "active" : ""}`} id="settings-modal" inert={!settingsPOPUP}>
            <div className="modal" style={{ width: "440px", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h2 data-i18n="settings_title" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Settings</h2>
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
                            onClick={() => { /* change user avatar */ }}
                            style={{ border: "none", background: "transparent", cursor: "pointer", position: "relative", borderRadius: "50%" }}>
                            <div className="chat-avatar" id="settings-avatar" style={{ width: "56px", height: "56px", fontSize: "1.5rem" }}>{
                                (<>
                                        <UserAvatar size="100%" nickname={userState.nickname}/>
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
                                <h3 id="settings-name" style={{ fontSize: "1.1rem", marginBottom: "4px" }}>{userState!.nickname}</h3>
                                <button id="edit-name-btn" className="icon-btn"
                                    onClick={() => { /* change user nickname */ }}
                                    style={{ width: "24px", height: "24px" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "14px", height: "14px" }}>
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                            </div>
                            <p id="settings-username" style={{ color: "var(--text-sub)", fontSize: "0.9rem" }}>@{userState!.username}</p>
                        </div>
                    </div>
                </div>

                <h3 data-i18n="cat_general" style={{ fontSize: "0.9rem", color: "var(--primary)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>General</h3>
                <div className="setting-row">
                    <div>
                        <strong data-i18n="dark_mode">Dark Mode</strong>
                        <p data-i18n="dark_mode_sub" style={{ fontSize: "0.85rem", color: "var(--text-sub)", marginTop: "4px" }}>Switch to dark theme UI</p>
                    </div>
                    <div className="toggle-switch" id="theme-toggle" role="switch" aria-checked="false"></div>
                </div>

                <div className="setting-row">
                    <div>
                        <strong data-i18n="language">Language **under work**</strong>
                        <p data-i18n="language_sub" style={{ fontSize: "0.85rem", color: "var(--text-sub)", marginTop: "4px" }}>Choose your preferred app language</p>
                    </div>
                    <select id="language-select" style={{ padding: "8px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontFamily: "inherit", outline: "none" }}>
                        <option value="en">English</option>
                        <option value="ar">العربية (Arabic)</option>
                    </select>
                </div>

                <h3 data-i18n="cat_chat" style={{ fontSize: "0.9rem", color: "var(--primary)", marginBottom: "16px", marginTop: "32px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Chat Settings</h3>
                <div className="setting-row">
                    <div>
                        <strong data-i18n="notifications">Desktop Notifications  **under work**</strong>
                        <p data-i18n="notif_sub" style={{ fontSize: "0.85rem", color: "var(--text-sub)", marginTop: "4px" }}>Get alerts for new messages</p>
                    </div>
                    <div className="toggle-switch active" id="notif-toggle" role="switch" aria-checked="true"></div>
                </div>

                <h3 data-i18n="cat_privacy" style={{ fontSize: "0.9rem", color: "var(--primary)", marginBottom: "16px", marginTop: "32px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Privacy</h3>
                <div className="setting-row" style={{ borderBottom: "none" }}>
                    <div>
                        <strong data-i18n="read_receipts">Read Receipts  **under work**</strong>
                        <p data-i18n="receipts_sub" style={{ fontSize: "0.85rem", color: "var(--text-sub)", marginTop: "4px" }}>Let others see when you've read messages</p>
                    </div>
                    <div className="toggle-switch active" id="receipts-toggle" role="switch" aria-checked="true"></div>
                </div>
            </div>
        </div>


        {/* Edit Profile Modal */}
        <div className="modal-overlay" id="edit-profile-modal" aria-hidden="true">
            <div className="modal">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h2 data-i18n="edit_profile_title" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Edit Profile</h2>
                    <button className="icon-btn" id="close-edit-profile" aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form id="edit-profile-form">
                    <div className="input-group" style={{ marginBottom: "24px" }}>
                        <label data-i18n="display_name" htmlFor="edit-nickname-input">Display Name</label>
                        <input type="text" id="edit-nickname-input" placeholder="Nickname" autoComplete="off" required minLength={2} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>
                            <span data-i18n="save_changes">Save Changes</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>


    </>);
}