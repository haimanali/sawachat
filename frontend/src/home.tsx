import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiCall } from "./assets/apiCaller";
import { io, Socket } from 'socket.io-client';
import { IClientPublic } from "./assets/public/IClientPublic"
import { IRoomPublic } from "./assets/public/IRoomPublic";
import { IRequestPublic } from "./assets/public/IRequestPublic";
import { IPayloadRequestType, IPayloadResponseType, IPayloadInterface } from "./assets/EPaylaod";
import { IMessagePublic } from "./assets/public/IMessagePublic";

export default function Home() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const [activeTab, setActive] = useState<"rooms" | "requests">("rooms");
    const [status, setStatus] = useState<string>("loading");
    const [toastMsg, setToastMsg] = useState("");

    const showToast = (msg: string, ms = 2800) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(""), ms);
    };

    const [rooms, setRooms] = useState<IRoomPublic []>([]);
    const [hasMoreRooms, setHasMoreRooms] = useState<boolean>(true);
    const [roomSetup, setRoomSetup] = useState<IRoomPublic | null>(null);
    const [roomSettingsMenu, setRoomSettingsMenu] = useState<boolean>(false);

    const [requests, setRequests] = useState<IRequestPublic []>([]);
    const [hasMoreRequests, setHasMoreRequests] = useState<boolean>(true);

    const [messages, setMessages] = useState<IMessagePublic []>([]);

    const [settingsPOPUP, setSettingsPOPUP] = useState<boolean>(false);

    const [addContactPOPUP, setaddContactPOPUP] = useState<boolean>(false);
    const [contactRequestError, setContactRequestError] = useState<string>("");
    const [addContactUsername, setAddContactUsername] = useState<string>("");

    const conn_soc = useRef<Socket | null>(null);
    const requests_cursor = useRef<Date | null>(null);
    const rooms_cursor = useRef<Date | null>(null); 

    useEffect(() => {
        const verifySession = async () => {
            const url = `http://localhost:3000/api/auth/session/check/${username}`;
            const response : IPayloadInterface<IClientPublic> = await apiCall(url, "GET");

            if (response.success) {
                setStatus("authorized");

            } else {
                navigate("/");
            }

        };

        verifySession();

    }, [username, navigate]);

    useEffect( () => {

        if (status !== "authorized")
            return;

        if (conn_soc.current && conn_soc.current.connected)
            return;

        const socket = io("http://localhost:3000", {
            withCredentials : true,
            transports : ["websocket"],
        });

        conn_soc.current = socket;

        socket.on("connect", () => {
            console.log("client has been connected");
        });


        //EVENT HANDLERS.....

        socket.on(IPayloadResponseType.ONLOAD_ROOMS, (response) => {
            const payload : IPayloadInterface<IRoomPublic []> = response.payload;
            const room_items : IRoomPublic [] = payload.data!;

            if (room_items.length === 0)
            {
                setHasMoreRooms(false);
                return;
            }

            setRooms( payload.data! );

            rooms_cursor.current = payload.data![ payload.data!.length - 1 ].created_at;

            if (room_items.length < IPayloadRequestType.LIMIT)
            {
                setHasMoreRooms(false);
                return;
            }
        });

        socket.on(IPayloadResponseType.ONLOAD_REQUESTS, (response) => {
            const payload : IPayloadInterface<IRequestPublic []> = response.payload;
            const request_items : IRequestPublic [] = payload.data!;

            if (request_items.length === 0)
            {
                setHasMoreRequests(false);
                return;
            }
            
            requests_cursor.current = request_items[ request_items.length - 1 ].created_at;
            
            setRequests( (prev) => [...prev, ...request_items] );

            if (request_items.length < IPayloadRequestType.LIMIT)
            {
                setHasMoreRequests(false);
                return;
            }
        });

        socket.on(IPayloadResponseType.ONLOAD_MESSAGES, (response) => {
            
        });

        socket.on(IPayloadResponseType.ONSEND_MESSAGE, (response) => {
            
        });

        socket.on(IPayloadResponseType.ONSEND_REQUEST, (response) => {
            const payload : IPayloadInterface <IRequestPublic> = response.payload;

            setAddContactUsername("");

            if (!payload.success)
            {
                setContactRequestError(payload.log_message);
                
                setTimeout(() => {
                    setContactRequestError("");
                }, 2000);

                return;
            }

            setaddContactPOPUP(false);
            showToast(payload.log_message);
            
        });


        socket.on(IPayloadResponseType.ONRECEIVE_REQUEST, (response) => {
            
            const payload : IPayloadInterface <IRequestPublic> = response.payload;
            
            setRequests( (prev) => [payload.data!, ...prev] );

        });

        socket.on(IPayloadResponseType.ONVERDICT_REQUEST, (response) => {

            const payload : IPayloadInterface<string> = response.payload;

            setRequests( prev =>  prev.filter( req =>  req.public_id !== payload.data!  ) );

            showToast(payload.log_message) ;
        });

        socket.on(IPayloadResponseType.ONCREATE_CONTACT, (response) => {
            const payload : IPayloadInterface<IRoomPublic> = response.payload;

            setRooms( (prev) => [payload.data!, ...prev] );

        });


        socket.on("disconnect", () => {
            console.log("client has disconnected");
        });

        socket.on("error", (reason) => {
            console.log(reason);
        })

        return () => {
            if (conn_soc.current)
            {
                conn_soc.current.disconnect();
                conn_soc.current = null;
            }
        };

    }, [status, conn_soc.current]);

    useEffect(() => {
        if(status !== "authorized" && !conn_soc.current?.connected)
            return;

        let payload_type;
        let tab_cursor;

        switch (activeTab)
        {
            case "rooms" :
                payload_type = IPayloadRequestType.LOAD_ROOMS;
                tab_cursor = rooms_cursor.current;
                break;

            case "requests" :
                payload_type = IPayloadRequestType.LOAD_REQUESTS;
                tab_cursor = requests_cursor.current;
                break;
        }

        const request_payload = {
            type : payload_type,
            payload : {
                cursor : tab_cursor,
            },
        };

        conn_soc.current!.emit("message", request_payload);


    }, [status, activeTab, conn_soc.current]);


    if (status === "loading") {
        return <div>Loading your dashboard...</div>;
    }

    return (
        <>
            <div className="chat-container">
                <aside className="chat-sidebar" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                            
                            {/* --- HEADER --- */}
                            <div className="sidebar-header">
                                <h2 data-i18n="chats_title">SawaChat</h2>
                                <button className="icon-btn" id="settings-btn" 
                                onClick={ () => {setSettingsPOPUP(true)} }
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
                                        setActive("rooms")
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
                                {activeTab === "requests" && (
                                    <div className="requests-container" style= {{display : "flex", flexDirection : "column", height : "100%"}} >
                                        {/* Add Friend Button ONLY renders here */}
                                        <div className="friend-search" style={{ padding: "0 16px 16px 16px" }}>
                                            <button className="btn-primary btn-full" id="open-add-friend-btn"
                                            onClick={ () => {setaddContactPOPUP(true)}}
                                            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "18px", height: "18px" }}>
                                                    <line x1="12" y1="5" x2="12" y2="19" />
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                </svg>
                                                <span>Add a Contact</span>
                                            </button>
                                        </div>
                                        
                                        {/* INJECT YOUR REQUESTS DATA HERE */}
                                            <div className="request-list" id="request-list" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                                {requests.length === 0 ? (
                                                    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                                        <p style={{ color: "rgba(0, 0, 0, 0.4)" }}>no requests were found</p>
                                                    </div>
                                                ) : (
                                                    requests.map((req: IRequestPublic) => (
                                                        <div key={req.public_id} className="request-item" style={{
                                                            display: "flex",
                                                            flexDirection: "column", // Stack content and buttons for better mobile/sidebar fit
                                                            padding: "12px 16px",
                                                            borderBottom: "1px solid var(--border)",
                                                            gap: "8px"
                                                        }}>
                                                            <div style={{ display: "flex", alignItems: "center", width: "100%", gap: "12px" }}>
                                                                {/* 1. Time on the far left */}
                                                                <span style={{ fontSize: "0.75rem", color: "var(--text-sub)", minWidth: "45px" }}>
                                                                    {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>

                                                                {/* 2. Middle: Nickname and Username */}
                                                                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                                                                    <strong style={{ fontSize: "0.95rem", color: "var(--text-main)" }}>
                                                                        {req.nickname}
                                                                    </strong>
                                                                    <span style={{ fontSize: "0.8rem", opacity: 0.5, color: "var(--text-main)" }}>
                                                                        @{req.username}
                                                                    </span>
                                                                </div>

                                                                {/* 3. Avatar on the right */}
                                                                <div className="request-avatar" style={{
                                                                    width: "36px",
                                                                    height: "36px",
                                                                    borderRadius: "50%",
                                                                    backgroundColor: "var(--primary)",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    color: "white",
                                                                    fontSize: "0.8rem"
                                                                }}>
                                                                    {req.nickname.charAt(0).toUpperCase()}
                                                                </div>
                                                            </div>

                                                            {/* 4. Action Buttons Row */}
                                                            <div style={{ display: "flex", gap: "8px", marginLeft: "57px" }}> 
                                                                <button 
                                                                    onClick={() => {
                                                        
                                                                        const request_payload = {
                                                                            type : IPayloadRequestType.VERDICT_REQUEST,
                                                                            payload : {
                                                                                username : req.username,
                                                                                req_public_id : req.public_id,
                                                                                verdict : true,
                                                                            }
                                                                        } 

                                                                        conn_soc.current?.emit("message", request_payload);
                                                                    }}
                                                                    className="btn-small btn-primary"
                                                                    style={{ padding: "4px 12px", fontSize: "0.8rem", borderRadius: "4px", cursor: "pointer" }}
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        const request_payload = {
                                                                            type : IPayloadRequestType.VERDICT_REQUEST,
                                                                            payload : {
                                                                                username : req.username,
                                                                                req_public_id : req.public_id,
                                                                                verdict : false,
                                                                            }
                                                                        } 
                                                                        conn_soc.current?.emit("message", request_payload);
                                                                    }}
                                                                    className="btn-small"
                                                                    style={{ padding: "4px 12px", fontSize: "0.8rem", borderRadius: "4px", cursor: "pointer", border: "1px solid var(--border)", background: "transparent" }}
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                    </div>
                                )}

                                {/* Condition 2: ROOMS TAB */}
                                {activeTab === "rooms" && (
                                    <div className="rooms-container" style = {{display : "flex", flexDirection : "column", height : "100%"}}>
                                        
                                        {/* INJECT YOUR ROOMS DATA HERE */}
                                        <div className="chat-list" id="chat-list" style = {{display : "flex", flexDirection : "column", height : "100%"}}>
                                            {
                                                rooms.length === 0 ? 
                                                (<>
                                                    <div style=
                                                {{
                                                height : "100%",
                                                width : "100%",
                                                display : "flex",
                                                flexDirection : "column",
                                                alignItems : "center",
                                                justifyContent : "center",
                                                }}>
                                                        <p style={{color : "rgba(0, 0, 0, 0.4)"}} >no rooms where found</p>
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
                                                            setRoomSetup(room);


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
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* --- FOOTER --- */}
                            <div style={{ padding: "16px", borderTop: "1px solid var(--border)", marginTop: "auto" }}>
                                <div className="chat-item" id="logout-btn" 
                                onClick= { async () => {
                                    const response : IPayloadInterface = await apiCall("http://localhost:3000/api/auth/session/logout", "POST");

                                    if (response.success)
                                    {
                                        if (conn_soc.current)
                                        {
                                            conn_soc.current.disconnect();
                                            conn_soc.current = null;
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

                        </aside>
                {/* Main Chat Area */}
                <main className="chat-main">
                    {/* Header */}
                    <header className="chat-header">
                        <div className="chat-avatar" id="active-chat-avatar">{roomSetup ? 
                         (<>
                            <div className="room-avatar" style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: "50%",
                                backgroundColor: roomSetup.type === "group" ? "var(--secondary)" : "var(--primary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "1rem",
                                fontWeight: "bold",
                                flexShrink: 0
                            }}>
                                {roomSetup.room_name.charAt(0).toUpperCase()}
                            </div>
                         </>) : "S"}</div>
                        <div className="chat-meta">
                            <h2 className="chat-name" id="active-chat-name">{roomSetup ? roomSetup.room_name : "Select a Chat"}</h2>
                            <p className="chat-preview" style={{ color: "var(--primary)" }}>Secure E2EE Channel</p>
                        </div>
                        
                        <div style={{ display: "flex", gap: "8px", position: "relative" }}>
                            <button className="icon-btn" id="chat-options-btn" aria-label="Menu" title="Menu" 
                            onClick={ () => { setRoomSettingsMenu(!roomSettingsMenu) } }
                            style={{ display: roomSetup ? "flex" : "none" }}>
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
                                <div className="dropdown-item" data-i18n="clear_chat" style={{ color: "var(--error)" }}>Clear Chat</div>
                            </div>
                        </div>
                    </header>

                    {/* Messages */}
                    <div className="messages-area" id="messages-area">
                        {/* Empty state initially */}
                        {
                        roomSetup ? (                        
                            <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)" }}>
                                {/* Room background */}
                            </div>
                        ) : 
                        (
                            <div style={{ margin: "auto", textAlign: "center", color: "var(--text-muted)" }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: "48px", height: "48px", marginBottom: "16px", opacity: 0.5 }}>
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                </svg>
                                <p data-i18n="empty_state">End-to-end encrypted messaging.</p>
                            </div>
                        )
                        }

                    </div>

                    {/* Input Box */}
                    <form className="chat-input-area" id="message-form" 
                    onSubmit={ (e) => {
                        e.preventDefault();
                    } }
                    style={{ display: roomSetup ? "flex" : "none" }}>
                        <input type="text" id="message-input" placeholder="Type a secure message..." autoComplete="off" />
                        <button type="submit" style={{ background: "var(--primary)", color: "white", border: "none", borderRadius: "50%", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "all 0.2s" }} aria-label="Send">
                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "20px", height: "20px", marginLeft: "2px" }}>
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </form>
                </main>
            </div>

            {/* Settings Modal */}
            <div className={`modal-overlay ${settingsPOPUP ? "active" : ""}`} id="settings-modal" inert={!settingsPOPUP}>
                <div className="modal" style={{ width: "440px", maxHeight: "90vh", overflowY: "auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <h2 data-i18n="settings_title" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Settings</h2>
                        <button className="icon-btn" id="close-settings" 
                        onClick={ () => {setSettingsPOPUP(false) }}
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
                            <button id="edit-avatar-btn" style={{ border: "none", background: "transparent", cursor: "pointer", position: "relative", borderRadius: "50%" }}>
                                <div className="chat-avatar" id="settings-avatar" style={{ width: "56px", height: "56px", fontSize: "1.5rem" }}>S</div>
                                <div style={{ position: "absolute", bottom: 0, right: "-4px", background: "var(--surface)", borderRadius: "50%", padding: "4px", boxShadow: "var(--shadow)" }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" style={{ width: "14px", height: "14px" }}>
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </div>
                            </button>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <h3 id="settings-name" style={{ fontSize: "1.1rem", marginBottom: "4px" }}>User</h3>
                                    <button id="edit-name-btn" className="icon-btn" style={{ width: "24px", height: "24px" }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: "14px", height: "14px" }}>
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                </div>
                                <p id="settings-username" style={{ color: "var(--text-sub)", fontSize: "0.9rem" }}>@username</p>
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

            {/* Add Friend Modal */}

                <div className={`modal-overlay ${addContactPOPUP ? "active" : ""}`} id="add-friend-modal" inert = {!addContactPOPUP}>
                    <div className="modal">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 data-i18n="add_friend_title" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Add a Contact</h2>
                            <button className="icon-btn" id="close-add-friend"
                            onClick={ () => { setaddContactPOPUP(false); setAddContactUsername(""); }}
                            aria-label="Close">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        
                        <p data-i18n="add_friend_sub" style={{ color: "var(--text-sub)", marginBottom: "24px", fontSize: "0.95rem" }}>
                            Enter a user's exact username to send them a secure Contact request.
                        </p>

                        <form id="add-friend-form" onSubmit={ (e) => {
                            e.preventDefault();
                            const request_payload = {
                                type : IPayloadRequestType.SEND_REQUEST,
                                payload : {
                                    username : addContactUsername,
                                },
                            };

                            conn_soc.current?.emit("message", request_payload);
                        } }>

                            <div className="input-group" style={{ marginBottom: "24px" }}>
                                <label data-i18n="friend_username" htmlFor="friend-username">Contact's Username</label>
                                <div className="input-wrapper">
                                    <span className="input-prefix">@</span>
                                    <input type="text" id="friend-username" value = {addContactUsername} onChange = { (e) => { setAddContactUsername(e.target.value) } } placeholder="username" autoComplete="off" required />
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", flexDirection : "column", alignItems : "center"}}>
                                <p className = {`message-error ${contactRequestError ? "active" : ""}`} aria-hidden = {!contactRequestError}>{contactRequestError}</p>
                                <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>
                                    <span data-i18n="send_request">Send Contact Request</span>
                                </button>
                            </div>
                        </form>
                        
                    </div>
                </div>


            {/* Toast for alerts */}
            <div className={`toast ${toastMsg ? "show" : ""}`} role="alert" aria-live="polite">
                {toastMsg}
            </div>
        </>
    );
}