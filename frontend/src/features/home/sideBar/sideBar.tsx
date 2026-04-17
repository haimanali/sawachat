import React, { useState } from "react";
import { useSocket } from "../../../hooks/useSocket";
import { IPayloadInterface, IPayloadRequestType } from "../../../interfaces/payload/EPaylaod";
import { apiCall } from "../../../services/apiCaller";
import RequestsTab from "./requestTab";
import ChatRoomTab from "./chatRoomTab";
import AddContactPOPUP from "../../popup/addContactPOPUP";
import UserSettingsPOPUP from "../../popup/userSettingsPOPUP";

export default function SideBar() {

    const {
        socket,
        setSettingsPOPUP,
        navigate,
        activeRoomSetup,
        setActiveRoomSetup,
        rooms,
    } = useSocket();

    const [activeTab, setActive] = useState<"rooms" | "requests">("rooms");


    return (<>
        <aside className="chat-sidebar" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* --- HEADER --- */}
            <div className="sidebar-header">
                <h2 data-i18n="chats_title">SawaChat</h2>
                <button className="icon-btn" id="settings-btn"
                    onClick={() => { setSettingsPOPUP(true) }}
                    aria-label="Settings">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                </button>
            </div>

            {/* --- TAB NAVIGATOR --- */}
            <div className="tab-navigator" style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "8px" }}>
                <button
                    onClick={() => {
                        setActive("rooms");

                        if (!activeRoomSetup)
                            setActiveRoomSetup(rooms[0] || null);
                    }}
                    style={{
                        flex: 1, padding: "12px", background: "none", cursor: "pointer",
                        border: "none",
                        borderBottom: activeTab === "rooms" ? "2px solid var(--primary)" : "none",
                        color: activeTab === "rooms" ? "var(--primary)" : "var(--text-sub)",
                        fontWeight: activeTab === "rooms" ? "bold" : "normal"
                    }}
                >
                    Rooms
                </button>
                <button
                    onClick={() => {
                        setActive("requests");
                    }}
                    style={{
                        flex: 1, padding: "12px", background: "none", cursor: "pointer",
                        border: "none",
                        borderBottom: activeTab === "requests" ? "2px solid var(--primary)" : "none",
                        color: activeTab === "requests" ? "var(--primary)" : "var(--text-sub)",
                        fontWeight: activeTab === "requests" ? "bold" : "normal"
                    }}
                >
                    Requests
                </button>
            </div>

            {/* --- TAB CONTENT AREA --- */}
            <div className="sidebar-content" style={{ flex: 1, overflowY: "auto" }}>

                {/* Condition 1: REQUESTS TAB */}
                {activeTab === "requests" && <RequestsTab/>}

                {/* Condition 2: ROOMS TAB */}
                {activeTab === "rooms" && <ChatRoomTab/>}

            </div>

            {/* --- FOOTER --- */}
            <div style={{ padding: "16px", borderTop: "1px solid var(--border)", marginTop: "auto" }}>
                <div className="chat-item" id="logout-btn"
                    onClick={async () => {
                        const response: IPayloadInterface = await apiCall("http://localhost:3000/api/auth/session/logout", "POST");

                        if (response.success) {
                            if (socket) {
                                socket.disconnect();
                            }

                            navigate("/");
                        }

                    }}
                    style={{ color: "var(--error)", cursor: "pointer", display: "flex", gap: "8px", alignItems: "center" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "20px", height: "20px" }}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <strong data-i18n="logout_btn">Log out</strong>
                </div>
            </div>

                <AddContactPOPUP/>
                <UserSettingsPOPUP/>
        </aside>
    </>);
}