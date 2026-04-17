import React, { useEffect, useRef, useState } from "react";
import { msgEncrytion } from "../../../services/msgEncrytion";
import { initKey } from "../../../services/initKey";
import { IPayloadRequestType } from "../../../interfaces/payload/EPaylaod";
import { useSocket } from "../../../hooks/useSocket";
import { IMessagePublic } from "../../../interfaces/public/IMessagePublic";

export default function ChatArea() {

    const {
        socket,
        messages,
        loadingMessages,
        msgInputDOM,
        activeRoomSetup,
        activeRoomRef,
        userState,
        roomSettingsMenu, setRoomSettingsMenu
    } = useSocket();

    const messageEnd_anchor = useRef<HTMLDivElement | null>(null);
    const [msgInput, setMsgInput] = useState<string>("");

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


    return (
        <>
            <main className="chat-main">

                {!activeRoomSetup ? (

                    <div className="no-room-selected" style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", justifyContent: "center", alignItems: "center", color: "var(--text-muted)", opacity: 0.5 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "48px", height: "48px", marginBottom: "16px" }}>
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        <p data-i18n="empty_state">Start Your Secure EE2E Messaging Journey.</p>
                    </div>

                ) : (

                    <>
                        {/* 1. THE HEADER (Always visible if room is selected) */}
                        <header className="chat-header">
                            <div className="chat-avatar" id="active-chat-avatar">
                                <div className="room-avatar" style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: "50%",
                                    backgroundColor: activeRoomSetup.type === "group" ? "var(--secondary)" : "var(--primary)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    flexShrink: 0
                                }}>
                                    {activeRoomSetup.room_name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="chat-meta">
                                <h2 className="chat-name" id="active-chat-name">{activeRoomSetup.room_name}</h2>
                                <p className="chat-preview" style={{ color: "var(--primary)" }}>Secure E2EE Channel</p>
                            </div>

                            <div style={{ display: "flex", gap: "8px", position: "relative" }}>
                                <button className="icon-btn" id="chat-options-btn" aria-label="Menu" title="Menu"
                                    onClick={() => { setRoomSettingsMenu( !roomSettingsMenu ) }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="5" r="1.5" />
                                        <circle cx="12" cy="12" r="1.5" />
                                        <circle cx="12" cy="19" r="1.5" />
                                    </svg>
                                </button>
                                {/* Dropdown */}
                                <div className={`dropdown-menu ${roomSettingsMenu ? "active" : ""}`} id="chat-dropdown">
                                    <div className="dropdown-item" data-i18n="contact_info">Contact Info</div>
                                    <div className="dropdown-item" data-i18n="change_wallpaper">Change Wallpaper</div>
                                    <div className="dropdown-item" data-i18n="archive_chat">Archive Chat</div>
                                    <div className="dropdown-item" id="export-chat-btn" data-i18n="export_chat">Export Chat</div>
                                    <div className="dropdown-item" data-i18n="clear_chat" style={{ color: "var(--error)" }}>Block</div>
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

                                            setRoomSettingsMenu( false );
                                        }}
                                        data-i18n="clear_chat" style={{ color: "var(--error)" }}>Delete Contact</div>
                                </div>
                            </div>
                        </header>

                        {/* 2. THE MESSAGES AREA (Toggle between Loader and List) */}
                        <div className="messages-area" id="messages-area">
                            {loadingMessages ? (
                                <div className="chat-loader-container is-loading" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                                    <div className="btn-loader-wrap">
                                        <div className="btn-spinner" style={{
                                            width: "40px",
                                            height: "40px",
                                            border: "4px solid rgba(255, 255, 255, 0.1)",
                                            borderTopColor: "var(--primary)",
                                            borderRadius: "50%",
                                            animation: "spin 1s linear infinite" // ensure you have a spin keyframe in your CSS
                                        }}></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="messages-list">
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
                                                        <div className="message-avatar">
                                                            {msg.nickname.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="message-content-wrapper">
                                                        <div className="message-bubble">
                                                            <div className="message-text">{msg.content}</div>
                                                            {isMe &&
                                                                <div className="message-bubble-footer">
                                                                    <div className="status-indicators">
                                                                        <div className={`status-dot ${msg.is_sent ? 'active' : ''}`}></div>
                                                                        <div className={`status-dot ${msg.is_delivered ? 'active' : ''}`}></div>
                                                                    </div>
                                                                </div>
                                                            }
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
                                }}
                                style={{ display: "flex" }}>
                                <input type="text" id="message-input" placeholder="Type a secure message..." value={msgInput} onChange={(e) => { setMsgInput(e.target.value) }} autoComplete="off" />
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
                                    You can no longer send messages to this room. The user might have been banned or removed you from their contacts.
                                    <button
                                        onClick={() => { 
                                            const request_payload = {
                                                type : IPayloadRequestType.REJOIN_REQUEST,
                                                payload : 
                                                {
                                                    room_public_id : activeRoomRef.current!.public_id,
                                                    username : userState.username,
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
                                        Ask to rejoin
                                    </button>
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </>
    );
}