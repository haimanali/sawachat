import React, { useMemo, useState } from "react";
import { useSocket } from "../../../hooks/useSocket";
import { useApp } from "../../../hooks/useApp";
import { IPayloadInterface, IPayloadRequestType } from "../../../interfaces/payload/EPaylaod";
import { apiCall } from "../../../services/apiCaller";
import RequestsTab from "./requestTab";
import ChatRoomTab from "./chatRoomTab";
import AddContactPOPUP from "../../popup/addContactPOPUP";
import UserSettingsPOPUP from "../../popup/userSettingsPOPUP";
import { ENotificationType } from "../../../interfaces/UI/notificationFormat";
import NotificationDot from "../../../componets/notificationDot/NotificationDot";
import UserAvatar from "../../../componets/avatar/userAvatar";

// this is the sidebar where you can see your chats and friend requests
export default function SideBar({ sidebarOpen, onCloseSidebar }: { sidebarOpen?: boolean, onCloseSidebar?: () => void }) {
    const { theme, setTheme, setUserState, language, setLanguage, t } = useApp();

    const {
        socket,
        userState,
        onlineStatus,
        activeTab,
        setActive,
        setSettingsPOPUP,
        notifCountType,
        navigate,
        activeRoomSetup,
        setActiveRoomSetup,
        rooms,
    } = useSocket();


    return (<>
        <aside className={`chat-sidebar ${sidebarOpen ? 'mobile-open' : ''}`} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* --- HEADER --- */}
            <div className="sidebar-header">
                <h2>{t('chats_title')}</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

                    <button className="icon-btn" id="settings-btn"
                        onClick={() => { setSettingsPOPUP(true) }}
                        aria-label="Settings">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* --- TAB NAVIGATOR --- */}

            <div className="tab-navigator" style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "8px" }}>

                {/* ROOMS TAB */}
                <button
                    onClick={() => {
                        setActive("rooms");
                        if (!activeRoomSetup)
                            setActiveRoomSetup(rooms[0] || null);
                    }}
                    style={{
                        flex: 1, // Stretches the button to take exactly half the width
                        padding: "12px",
                        background: "none",
                        cursor: "pointer",
                        border: "none",
                        borderBottom: activeTab === "rooms" ? "2px solid var(--primary)" : "none",
                        color: activeTab === "rooms" ? "var(--primary)" : "var(--text-sub)",
                        fontWeight: activeTab === "rooms" ? "bold" : "normal",
                        display: "flex",           // Aligns text and dot
                        alignItems: "center",      // Vertically centers them
                        justifyContent: "center",  // Horizontally centers the group
                        gap: "6px"                 // The magic spacing between text and dot
                    }}
                >
                    <span>{t('tab_rooms')}</span>
                    {(notifCountType[ENotificationType.CREATE_CONTACT] > 0 || notifCountType[ENotificationType.RECEIVE_MESSAGE] > 0) && <NotificationDot />}
                </button>

                {/* REQUESTS TAB */}
                <button
                    onClick={() => {
                        setActive("requests");
                    }}
                    style={{
                        flex: 1, // Stretches the button to take exactly half the width
                        padding: "12px",
                        background: "none",
                        cursor: "pointer",
                        border: "none",
                        borderBottom: activeTab === "requests" ? "2px solid var(--primary)" : "none",
                        color: activeTab === "requests" ? "var(--primary)" : "var(--text-sub)",
                        fontWeight: activeTab === "requests" ? "bold" : "normal",
                        display: "flex",           // FIXED: Added missing flex
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                    }}
                >
                    <span>{t('tab_requests')}</span>
                    {notifCountType[ENotificationType.RECEIVE_REQUEST] > 0 && <NotificationDot />}
                </button>
            </div>

            {/* --- TAB CONTENT AREA --- */}
            <div className="sidebar-content" style={{ flex: 1, overflowY: "auto" }}>

                {/* Condition 1: REQUESTS TAB */}
                {activeTab === "requests" && <RequestsTab />}

                {/* Condition 2: ROOMS TAB */}
                {activeTab === "rooms" && <ChatRoomTab />}

            </div>

            {/* --- FOOTER --- */}
            <div style={{
                padding: "16px",
                borderTop: "1px solid var(--border)",
                marginTop: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between", // Pushes content apart
                gap: "12px"
            }}>
                {/* Left Side: Avatar and Name Info */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                    <UserAvatar
                        mode={onlineStatus}
                        nickname={userState?.nickname || "User"}
                        image={userState?.avatar}
                        type={userState?.avatar_type}
                    />

                    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <span style={{
                            fontWeight: "600",
                            fontSize: "0.95rem",
                            color: "var(--text-main)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                        }}>
                            {userState?.nickname}
                        </span>
                        <span style={{
                            fontSize: "0.8rem",
                            opacity: 0.5,
                            color: "var(--text-main)",
                            whiteSpace: "nowrap"
                        }}>
                            @{userState?.username}
                        </span>
                    </div>
                </div>

                {/* Right Side: Logout Button */}
                <div className="chat-item" id="logout-btn"
                    onClick={async () => {
                        const response: IPayloadInterface = await apiCall("/api/auth/session/logout", "POST");

                        if (response.success) {
                            if (socket) {
                                socket.disconnect();
                            }
                            setUserState(null);
                            navigate("/");
                        }
                    }}
                    style={{
                        color: "var(--error)",
                        cursor: "pointer",
                        display: "flex",
                        padding: "8px",
                        borderRadius: "8px",
                        transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 0, 0, 0.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "20px", height: "20px" }}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </div>
            </div>

            <AddContactPOPUP />
            <UserSettingsPOPUP />
        </aside>
    </>);
}