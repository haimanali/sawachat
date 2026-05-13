import React, { useEffect, useRef, useState } from "react";
import { msgEncrytion } from "../../../services/msgEncrytion";
import { initKey } from "../../../services/initKey";
import { IPayloadRequestType } from "../../../interfaces/payload/EPaylaod";
import { useSocket } from "../../../hooks/useSocket";
import { useApp } from "../../../hooks/useApp";
import { IMessagePublic } from "../../../interfaces/public/IMessagePublic";
import UserAvatar from "../../../componets/avatar/userAvatar";
import { ENotificationType } from "../../../interfaces/UI/notificationFormat";

// this is where the actual chat happens
// it shows the messages and the input box to type new ones
export default function ChatArea({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
    const { readReceipts, t } = useApp();

    const {
        socket,
        messages,
        loadingMessages,
        msgInputDOM,
        activeRoomSetup,
        activeRoomRef,
        userState,
        onlineStatus,
        contacts,
        roomSettingsMenu, setRoomSettingsMenu, setNotifCountType, setNotifications, setRooms, notifications
    } = useSocket();

    const messageEnd_anchor = useRef<HTMLDivElement | null>(null);
    const [msgInput, setMsgInput] = useState<string>("");
    
    // UI states
    const [contactInfoModal, setContactInfoModal] = useState<boolean>(false);

    // Wallpaper color state
    const [roomWallpaper, setRoomWallpaper] = useState<string | null>(null);
    const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
    // wallpaper options for the chat background
    const wallpaperOptions = [
        { label: "None", value: "" },
        { label: "Ocean", value: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" },
        { label: "Night", value: "linear-gradient(135deg, #0B0E18, #1a1c2e, #0B0E18)" },
        { label: "Midnight", value: "linear-gradient(135deg, #020024, #090979, #00d4ff20)" },
        { label: "Aurora", value: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" },
        { label: "Sunset", value: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)" },
        { label: "Ember", value: "linear-gradient(135deg, #1a0a0a, #2d1117, #1a0a0a)" },
        { label: "Forest", value: "linear-gradient(135deg, #0a1a0f, #112d1a, #0a1a0f)" },
    ];

    useEffect(() => {
        if (activeRoomRef.current) {
            const saved = localStorage.getItem(`wallpaper_${activeRoomRef.current.public_id}`);
            setRoomWallpaper(saved);
        }
    }, [activeRoomRef.current?.public_id]);

    const applyWallpaper = (value: string) => {
        if (activeRoomRef.current) {
            if (value) {
                localStorage.setItem(`wallpaper_${activeRoomRef.current.public_id}`, value);
            } else {
                localStorage.removeItem(`wallpaper_${activeRoomRef.current.public_id}`);
            }
            setRoomWallpaper(value || null);
        }
        setShowWallpaperPicker(false);
    };

    // this lets you download your chat history as a text file
    const handleExportChat = () => {
        if (!activeRoomSetup) return;
        
        let content = `SawaChat Export - ${activeRoomSetup.room_name}\n`;
        content += `Generated on: ${new Date().toLocaleString()}\n\n`;
        
        messages.forEach(msg => {
            const time = new Date(msg.created_at).toLocaleString();
            content += `[${time}] ${msg.nickname}: ${msg.content}\n`;
        });
        
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SawaChat_${activeRoomSetup.room_name.replace(/\s+/g, "_")}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setRoomSettingsMenu(false);
    };

    useEffect(() => {
        if (onlineStatus !== "online" || !activeRoomRef.current || messages.length === 0)
            return;

        const payload = {
            type: IPayloadRequestType.UPDATE_LAST_READ,
            payload: {
                room_public_id: activeRoomRef.current!.public_id,
                read_receipts: readReceipts,
            },
        };
        socket.emit("message", payload);
    }, [messages.length, onlineStatus]);

    useEffect(() => {
        const scrollToLatest = () => {
            const parentContainer = messageEnd_anchor.current?.parentElement;
            if (parentContainer) {
                const atBottom = parentContainer.scrollHeight - parentContainer.scrollTop <= parentContainer.clientHeight;
                if (atBottom) {
                    messageEnd_anchor.current?.scrollIntoView({ behavior: "instant" });
                }
            }
        };

        scrollToLatest();

    }, [messages]);

    const handleNotification = () => {

        if (!document.hasFocus() || !activeRoomRef.current)
            return;

        const room_public_id = activeRoomRef.current!.public_id;

        const room_unread_msgs = activeRoomRef.current!.unread_msgs;
        const room_notif_obj = notifications[ENotificationType.CREATE_CONTACT]?.[room_public_id];

        if (room_notif_obj) {
            setNotifCountType((prev) => ({
                ...prev,
                [ENotificationType.CREATE_CONTACT]: Math.max(0, prev[ENotificationType.CREATE_CONTACT] - 1),
            }));

            setNotifications((prev) => {
                const currentContacts = prev[ENotificationType.CREATE_CONTACT] || {};
                const { [room_public_id]: _, ...rest } = currentContacts;
                return { ...prev, [ENotificationType.CREATE_CONTACT]: rest };
            });

            socket.emit("message", {
                type: IPayloadRequestType.MARK_NOTIF_READ,
                payload: { notif_public_id: room_notif_obj.public_id },
            });
        }

        if (room_unread_msgs > 0) {
            setNotifCountType((prev) => ({
                ...prev,
                [ENotificationType.RECEIVE_MESSAGE]: Math.max(0, prev[ENotificationType.RECEIVE_MESSAGE] - room_unread_msgs),
            }));

            setRooms((prev) =>
                prev.map((r) => r.public_id === room_public_id ? { ...r, unread_msgs: 0 } : r)
            );

            socket.emit("message", {
                type: IPayloadRequestType.UPDATE_LAST_READ,
                payload: { room_public_id: room_public_id, read_receipts: readReceipts },
            });
        }
    };


    return (
        <>
            <main className="chat-main" onMouseMove={ handleNotification }>

                {!activeRoomSetup ? (

                    <div className="no-room-selected" style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", justifyContent: "center", alignItems: "center", color: "var(--text-muted)", opacity: 0.5 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "48px", height: "48px", marginBottom: "16px" }}>
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        <p>{t('empty_state')}</p>
                    </div>

                ) : (

                    <>
                        {/* 1. THE HEADER (Always visible if room is selected) */}
                        <header className="chat-header">
                            {/* Mobile hamburger — only visible on small screens */}
                            <button 
                                className="icon-btn mobile-menu-btn" 
                                onClick={onOpenSidebar} 
                                aria-label="Open sidebar"
                                style={{ flexShrink: 0 }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: "22px", height: "22px"}}>
                                    <line x1="3" y1="6" x2="21" y2="6"/>
                                    <line x1="3" y1="12" x2="21" y2="12"/>
                                    <line x1="3" y1="18" x2="21" y2="18"/>
                                </svg>
                            </button>
                            <UserAvatar mode={contacts[activeRoomSetup.room_subname]?.onlineState || "offline"} nickname={contacts[activeRoomSetup.room_subname]?.client.nickname || "User"} image={contacts[activeRoomSetup.room_subname]?.client.avatar} type={contacts[activeRoomSetup.room_subname]?.client.avatar_type} />
                            <div className="chat-meta">
                                <h2 className="chat-name" id="active-chat-name">{activeRoomSetup.room_name}</h2>
                                <p className="chat-preview" style={{ color: "var(--primary)" }}>Encryption at Rest (EaR) Channel</p>
                            </div>

                            <div style={{ display: "flex", gap: "8px", position: "relative" }}>
                                <button className="icon-btn" id="chat-options-btn" aria-label="Menu" title="Menu"
                                    onClick={() => { setRoomSettingsMenu(!roomSettingsMenu) }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="5" r="1.5" />
                                        <circle cx="12" cy="12" r="1.5" />
                                        <circle cx="12" cy="19" r="1.5" />
                                    </svg>
                                </button>
                                {/* Dropdown */}
                                <div className={`dropdown-menu ${roomSettingsMenu ? "active" : ""}`} id="chat-dropdown">
                                    <div className="dropdown-item" onClick={() => {
                                        setContactInfoModal(true);
                                        setRoomSettingsMenu(false);
                                    }}>{t('contact_info')}</div>
                                    <div className="dropdown-item" onClick={() => {
                                        setShowWallpaperPicker(true);
                                        setRoomSettingsMenu(false);
                                    }}>{t('change_wallpaper')}</div>
                                    <div className="dropdown-item" id="export-chat-btn" onClick={handleExportChat}>{t('export_chat')}</div>
                                    <div className="dropdown-item"
                                        onClick={() => {
                                            const request_payload = {
                                                type: IPayloadRequestType.DELETE_CONTACT,
                                                payload: {
                                                    room_public_id: activeRoomRef.current!.public_id,
                                                    username: userState.username,
                                                },
                                            };
                                            socket.emit("message", request_payload);

                                            setRoomSettingsMenu(false);
                                        }}
                                        style={{ color: "var(--error)" }}>{t('delete_contact')}</div>
                                </div>
                            </div>
                        </header>

                        {/* 2. THE MESSAGES AREA (Toggle between Loader and List) */}
                        <div className="chat-messages" id="chat-messages" style={{
                            background: roomWallpaper ? roomWallpaper : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            position: "relative"
                        }}>
                            {roomWallpaper && <div style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.2)", zIndex: 0}}></div>}
                            
                            {loadingMessages ? (
                                <div className="chat-loader-container is-loading" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                                    <div className="btn-loader-wrap">
                                        <div className="btn-spinner" style={{
                                            width: "40px",
                                            height: "40px",
                                            border: "4px solid rgba(255, 255, 255, 0.1)",
                                            borderTopColor: "var(--primary)",
                                            borderRadius: "50%",
                                            animation: "spin 1s linear infinite"
                                        }}></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="messages-list" style={{zIndex: 1, position: "relative"}}>
                                    {messages.length === 0 ? (
                                        <div className="empty-state-text" style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>
                                            No messages here yet. Start the conversation!
                                        </div>
                                    ) : (
                                        messages.map((msg: IMessagePublic) => {
                                            const isMe = msg.username === userState!.username;
                                            const timeString = new Date(msg.created_at).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });

                                            return (
                                                <div key={msg.public_id} className={`message-row ${isMe ? "own-message" : ""}`}>
                                                    {!isMe && (
                                                        <UserAvatar image={contacts[msg.username].client.avatar} type={contacts[msg.username].client.avatar_type} nickname={msg.nickname}/>
                                                    )}
                                                    <div className="message-content-wrapper">
                                                        <div className={`message-bubble ${msg.is_del ? 'deleted-message' : ''}`}>
                                                            <div className="message-text">
                                                                {msg.is_del ? t('msg_deleted') : msg.content}
                                                            </div>

                                                            {isMe && !msg.is_del && (
                                                                <div className="message-bubble-footer">
                                                                    <div className="status-indicators">
                                                                        <div className={`status-dot ${msg.is_sent ? 'active' : ''}`}></div>
                                                                        <div className={`status-dot ${msg.is_read ? 'active' : ''}`}></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="message-time">{timeString}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messageEnd_anchor}></div>
                                </div>
                            )}
                        </div>

                        {/* 3. THE INPUT AREA (Toggle between Input Box and Deactivated Banner) */}
                        {msgInputDOM ? (
                            <form className="chat-input-area" id="message-form"
                                style={{ zIndex: 1, display: "flex" }}
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setMsgInput("");

                                    const crypto_key = await initKey(activeRoomSetup!.enc_key);
                                    const result = await msgEncrytion(msgInput, crypto_key);

                                    const request_payload = {
                                        type: IPayloadRequestType.SEND_MESSAGE,
                                        payload: {
                                            room_public_id: activeRoomSetup!.public_id,
                                            msg_content: result.encrypted_text,
                                            iv: result.iv,
                                        },
                                    };

                                    socket.emit("message", request_payload);
                                }}>
                                <input type="text" id="message-input" placeholder={t('type_msg')} value={msgInput} onChange={(e) => { setMsgInput(e.target.value) }} autoComplete="off" />
                                <button className="btn-primary" type="submit" disabled={!msgInput}
                                    style={{ padding: "0%", background: "var(--primary)", color: "white", border: "none", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }} aria-label="Send">
                                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "20px", height: "20px", marginLeft: "2px" }}>
                                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </form>
                        ) : (
                            <div className="deactivated-banner" style={{
                                padding: "16px",
                                textAlign: "center",
                                background: "var(--bg-subtle)",
                                borderTop: "1px solid var(--border)",
                                color: "var(--text-sub)",
                                fontSize: "0.9rem"
                            }}>
                                <p>
                                    {t('banned_msg')}
                                    <button
                                        onClick={() => {
                                            const request_payload = {
                                                type: IPayloadRequestType.REJOIN_REQUEST,
                                                payload:
                                                {
                                                    room_public_id: activeRoomRef.current!.public_id,
                                                    username: userState.username,
                                                },
                                            };

                                            socket.emit("message", request_payload);
                                        }}

                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "var(--primary)",
                                            textDecoration: "underline",
                                            cursor: "pointer",
                                            marginLeft: "5px",
                                            fontWeight: "600"
                                        }}>
                                        {t('rejoin_ask')}
                                    </button>
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* --- Wallpaper Color Picker Modal --- */}
            {showWallpaperPicker && (
                <div className="modal-overlay active" style={{ zIndex: 1000 }} onClick={() => setShowWallpaperPicker(false)}>
                    <div className="modal" style={{ width: "380px", padding: "28px 24px" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>{t('change_wallpaper')}</h2>
                            <button className="icon-btn" onClick={() => setShowWallpaperPicker(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: "20px", height: "20px"}}>
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: "20px 16px",
                        }}>
                            {wallpaperOptions.map((opt) => (
                                <div key={opt.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                                    <button
                                        onClick={() => applyWallpaper(opt.value)}
                                        title={opt.label}
                                        style={{
                                            width: "100%",
                                            aspectRatio: "1",
                                            borderRadius: "14px",
                                            border: roomWallpaper === opt.value || (!roomWallpaper && !opt.value)
                                                ? "2.5px solid var(--primary)"
                                                : "2px solid var(--border)",
                                            background: opt.value || "var(--bg)",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow: roomWallpaper === opt.value || (!roomWallpaper && !opt.value)
                                                ? "0 0 12px rgba(59, 158, 255, 0.3)"
                                                : "none",
                                        }}
                                    >
                                        {!opt.value && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-sub)" strokeWidth="2" style={{width: "22px", height: "22px"}}>
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        )}
                                    </button>
                                    <span style={{
                                        fontSize: "0.75rem",
                                        color: roomWallpaper === opt.value || (!roomWallpaper && !opt.value) ? "var(--primary)" : "var(--text-sub)",
                                        fontWeight: roomWallpaper === opt.value || (!roomWallpaper && !opt.value) ? 600 : 400,
                                    }}>{opt.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Contact Info Modal --- */}
            {contactInfoModal && activeRoomSetup && contacts[activeRoomSetup.room_subname] && (
                <div className="modal-overlay active" style={{ zIndex: 1000 }} onClick={() => setContactInfoModal(false)}>
                    <div className="modal" style={{ width: "350px", textAlign: "center", padding: "32px 24px" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "-16px" }}>
                            <button className="icon-btn" onClick={() => setContactInfoModal(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: "20px", height: "20px"}}>
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                            <div style={{ width: "100px", height: "100px", fontSize: "2.5rem" }}>
                                <UserAvatar 
                                    size="100%" 
                                    nickname={contacts[activeRoomSetup.room_subname].client.nickname} 
                                    image={contacts[activeRoomSetup.room_subname].client.avatar}
                                    type={contacts[activeRoomSetup.room_subname].client.avatar_type}
                                    mode={contacts[activeRoomSetup.room_subname].onlineState}
                                />
                            </div>
                        </div>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "4px" }}>
                            {contacts[activeRoomSetup.room_subname].client.nickname}
                        </h2>
                        <p style={{ color: "var(--text-sub)", fontSize: "1rem", marginBottom: "24px" }}>
                            @{contacts[activeRoomSetup.room_subname].client.username}
                        </p>
                        
                        <div style={{ background: "var(--bg-subtle)", borderRadius: "8px", padding: "16px", textAlign: "left" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{width: "20px", height: "20px"}}>
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <span style={{ fontSize: "0.9rem", color: "var(--text)" }}>End-to-End Encrypted</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{width: "20px", height: "20px"}}>
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span style={{ fontSize: "0.9rem", color: "var(--text)" }}>Joined SawaChat</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}