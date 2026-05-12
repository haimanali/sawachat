import React, { useEffect, useState } from "react";
import { useSocket } from "../../../hooks/useSocket";
import { useApp } from "../../../hooks/useApp";
import { IPayloadRequestType } from "../../../interfaces/payload/EPaylaod";
import { IRoomPublic } from "../../../interfaces/public/IRoomPublic";
import NotificationDot from "../../../componets/notificationDot/NotificationDot";
import { ENotificationType } from "../../../interfaces/UI/notificationFormat";
import UserAvatar from "../../../componets/avatar/userAvatar";
import { msgDecryption } from "../../../services/msgDecryption";
import { initKey } from "../../../services/initKey";


const DecryptedPreview = React.memo(({ contentx64, ivx64, encKey }: { contentx64: string, ivx64: string, encKey: string }) => {
    const [decrypted, setDecrypted] = useState<string>("...");
    useEffect(() => {
        let isMounted = true;

        const runDecryption = async () => {
            const key = await initKey(encKey);
            const text = await msgDecryption(contentx64, key, ivx64);
            if (isMounted) setDecrypted(text);
        };

        runDecryption();
        return () => { isMounted = false; };
    }, [contentx64, ivx64, encKey]);
    return <>{decrypted}</>;
});

export default function ChatRoomTab() {
    const { t } = useApp();
    const { socket, userState,
        rooms, activeRoomSetup, activeRoomRef, setActiveRoomSetup, loadingRooms, setMsgInputDOM, setRoomSettingsMenu,
        roomCache, messages_cursor, setHasMoreMessages, setMessages, notifications, contacts } = useSocket();

    useEffect(() => {
        if (!socket?.connected || !activeRoomSetup)
            return;


        activeRoomRef.current = activeRoomSetup;
        const curr_roomCache = roomCache[activeRoomRef.current.public_id];


        if (curr_roomCache) {
            setMessages(curr_roomCache.messages);
            setHasMoreMessages(curr_roomCache.hasMore);
            messages_cursor.current = curr_roomCache.cursor;
            setMsgInputDOM(curr_roomCache.msgInputDOM);
            setRoomSettingsMenu(curr_roomCache.settingsMenu);
        }
        else {

            setMessages([]);
            setHasMoreMessages(true);
            messages_cursor.current = null;
            setMsgInputDOM(activeRoomRef.current!.is_active);
            setRoomSettingsMenu(false);

            const request_payload = {
                type: IPayloadRequestType.LOAD_MESSAGES,
                payload: {
                    room_public_id: activeRoomSetup.public_id,
                    cursor: messages_cursor.current,
                },
            };
            socket.emit("message", request_payload);
        }


    }, [activeRoomSetup]);

    return (
        <div className="rooms-container" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {loadingRooms && (
                <div className="chat-loader-container is-loading">
                    <div className="btn-loader-wrap">
                        <div className="btn-spinner" style={{
                            width: "40px",
                            height: "40px",
                            border: "4px solid rgba(255, 255, 255, 0.1)",
                            borderTopColor: "var(--primary)"
                        }}></div>
                    </div>
                </div>
            )}

            {!loadingRooms && (
                <div className="chat-list" id="chat-list" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    {rooms.length === 0 ? (
                        <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <p style={{ color: "rgba(0, 0, 0, 0.4)" }}>{t('no_rooms')}</p>
                        </div>
                    ) : (
                        rooms.map((room: IRoomPublic) => {
                            const room_notif_obj = notifications[ENotificationType.CREATE_CONTACT]?.[room.public_id];

                            return (
                                <div
                                    key={room.public_id}
                                    className="room-item"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "12px 16px",
                                        borderBottom: "1px solid var(--border)",
                                        borderLeft: room_notif_obj ? "4px solid var(--primary)" : "4px solid transparent",
                                        gap: "12px",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        backgroundColor: room_notif_obj ? "var(--primary-light)" : "transparent",
                                        fontWeight: room_notif_obj ? "600" : "normal",
                                    }}
                                    onClick={() => {
                                        /* ... existing onClick logic ... */
                                        setActiveRoomSetup(room);

                                    }}
                                >
                                    {/* 1. Avatar */}
                                    <UserAvatar mode={contacts[room.room_subname]?.onlineState || 'offline'} nickname={contacts[room.room_subname]?.client.nickname || room.room_name} image={contacts[room.room_subname]?.client.avatar} type={contacts[room.room_subname]?.client.avatar_type} />

                                    {/* 2. Middle: Room Details & Last Message */}
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                                            <strong style={{
                                                fontSize: "0.95rem",
                                                color: "var(--text-main)",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis"
                                            }}>
                                                {room.room_name}
                                            </strong>
                                            <span style={{
                                                fontSize: "0.8rem",
                                                color: "gray",
                                                opacity: room_notif_obj ? 1 : 0.7,
                                            }}>
                                                ({room.room_subname})
                                            </span>
                                        </div>

                                        <span style={{
                                            fontSize: "0.85rem",
                                            color: room_notif_obj ? "var(--text-main)" : "var(--text-sub)",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            marginTop: "2px"
                                        }}>
                                            {room.last_message_payload ? (
                                                <>
                                                    <strong>
                                                        {room.last_message_payload.username === userState.username
                                                            ? t('you')
                                                            : room.last_message_payload.username}:
                                                    </strong>{" "}

                                                    {room.last_message_payload.is_del ? (
                                                        <span style={{ fontStyle: "italic", opacity: 0.6 }}>
                                                            {t('no_message')}
                                                        </span>
                                                    ) : (
                                                        <DecryptedPreview
                                                            contentx64={room.last_message_payload.content}
                                                            ivx64={room.last_message_payload.iv}
                                                            encKey={room.enc_key}
                                                        />
                                                    )}
                                                </>
                                            ) : (
                                                <span style={{ fontStyle: "italic", opacity: 0.6 }}>
                                                    {t('no_messages')}
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    {/* 3. Right: Time and Dots */}
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                                        <span style={{
                                            fontSize: "0.75rem",
                                            color: room_notif_obj ? "var(--primary-deep)" : "var(--text-sub)"
                                        }}>
                                            {new Date(room.last_msg_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>

                                        <div>
                                            {(room.unread_msgs > 0 || room_notif_obj) && <NotificationDot />}
                                        </div>

                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "12px", height: "12px", opacity: room_notif_obj ? 0.8 : 0.4 }}>
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                        </svg>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}