import React, { useEffect } from "react";
import { useSocket } from "../../../hooks/useSocket";
import { IPayloadRequestType } from "../../../interfaces/payload/EPaylaod";
import { IRoomPublic } from "../../../interfaces/public/IRoomPublic";

export default function ChatRoomTab() {

    const { socket,
        rooms, activeRoomSetup, activeRoomRef, setActiveRoomSetup, loadingRooms, setMsgInputDOM, setRoomSettingsMenu,
        roomCache, messages_cursor, setHasMoreMessages, setMessages } = useSocket();


    useEffect(() => {
        if (!socket?.connected || !activeRoomSetup)
            return;

        
        activeRoomRef.current = activeRoomSetup;
        const curr_roomCache = roomCache[activeRoomRef.current.public_id];

        
        if (curr_roomCache)
        {
            setMessages(curr_roomCache.messages);
            setHasMoreMessages(curr_roomCache.hasMore);
            messages_cursor.current = curr_roomCache.cursor;
            setMsgInputDOM(curr_roomCache.msgInputDOM);
            setRoomSettingsMenu(curr_roomCache.settingsMenu);
        }
        else
        {
            
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


            {!loadingRooms && (<>

                <div className="chat-list" id="chat-list" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    {
                        rooms.length === 0 ?
                            (<>
                                <div style=
                                    {{
                                        height: "100%",
                                        width: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}>
                                    <p style={{ color: "rgba(0, 0, 0, 0.4)" }} >no rooms where found</p>
                                </div>
                            </>)
                            :
                            (rooms.map((room: IRoomPublic) => (
                                <div
                                    key={room.public_id}
                                    className="room-item"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "12px 16px",
                                        borderBottom: "1px solid var(--border)",
                                        gap: "12px",
                                        cursor: "pointer",
                                        transition: "background 0.2s"
                                    }}
                                    onClick={() => {
                                        // Logic to select the active room will go here later
                                        setActiveRoomSetup(room);


                                    }}
                                >
                                    {/* 1. Avatar at the far left */}
                                    <div className="room-avatar" style={{
                                        width: "44px",
                                        height: "44px",
                                        borderRadius: "50%",
                                        backgroundColor: room.type === "group" ? "var(--secondary)" : "var(--primary)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        fontSize: "1rem",
                                        fontWeight: "bold",
                                        flexShrink: 0
                                    }}>
                                        {room.room_name.charAt(0).toUpperCase()}
                                    </div>

                                    {/* 2. Middle: Room Name and Subname */}
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
                                            color: "var(--text-sub)",
                                            opacity: 0.7,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis"
                                        }}>
                                            {room.room_subname}
                                        </span>
                                    </div>

                                    {/* 3. Data/Meta at far right */}
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-sub)" }}>
                                            {new Date(room.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {/* Optional: Add a lock icon since Sawachat is E2EE */}
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "12px", height: "12px", opacity: 0.4 }}>
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                        </svg>
                                    </div>
                                </div>
                            ))
                            )
                    }
                </div></>)}

        </div>
    );
}