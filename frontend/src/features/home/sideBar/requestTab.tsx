import React from "react";
import { useSocket } from "../../../hooks/useSocket";
import { IPayloadRequestType } from "../../../interfaces/payload/EPaylaod";
import { IRequestPublic } from "../../../interfaces/public/IRequestPublic";
import { ENotificationType } from "../../../interfaces/UI/notificationFormat";

export default function RequestsTab() {

    const { socket, requests, loadingRequests, setaddContactPOPUP, notifications, setNotifCountType, setNotifications } = useSocket();

    const handleNotif = (notif_public_id : string, req_public_id : string) => {
        const request_payload = {
            type: IPayloadRequestType.MARK_NOTIF_READ,
            payload: {
                notif_public_id : notif_public_id,
            },
        };

        socket.emit("message", request_payload);
        setNotifCountType((prev) => {
            return {
                ...prev,
                [ENotificationType.RECEIVE_REQUEST]: Math.max(0,  prev[ENotificationType.RECEIVE_REQUEST] - 1),
            };
        });

        setNotifications((prev) => {
            const { [req_public_id] : _, ...rest } = prev[ENotificationType.RECEIVE_REQUEST] || {};
            return {
                ...prev,
                [ENotificationType.RECEIVE_REQUEST]: rest,
            };
        });
    };

    return (

        <div className="requests-container" style={{ display: "flex", flexDirection: "column", height: "100%" }} >
            {loadingRequests && (
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


            {!loadingRequests && (<>
                <div className="friend-search" style={{ padding: "0 16px 16px 16px" }}>
                    <button className="btn-primary btn-full" id="open-add-friend-btn"
                        onClick={() => { setaddContactPOPUP(true) }}
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
                        requests.map((req: IRequestPublic) => { 
                            const req_notif = notifications[ENotificationType.RECEIVE_REQUEST][req.public_id] || {};

                            return(
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
                                    {req.type === "contact" && <>

                                        <button
                                            onClick={() => {

                                                const request_payload = {
                                                    type: IPayloadRequestType.VERDICT_REQUEST,
                                                    payload: {
                                                        username: req.username,
                                                        req_public_id: req.public_id,
                                                        verdict: true,
                                                    }
                                                }

                                                socket?.emit("message", request_payload);

                                                handleNotif(req_notif.public_id, req.public_id);
                                            }}
                                            className="btn-small btn-primary"
                                            style={{ padding: "4px 12px", fontSize: "0.8rem", borderRadius: "4px", cursor: "pointer" }}
                                        >
                                            Accept
                                        </button>

                                        <button
                                            onClick={() => {
                                                const request_payload = {
                                                    type: IPayloadRequestType.VERDICT_REQUEST,
                                                    payload: {
                                                        username: req.username,
                                                        req_public_id: req.public_id,
                                                        verdict: false,
                                                    }
                                                }
                                                socket?.emit("message", request_payload);

                                                handleNotif(req_notif.public_id, req.public_id);
                                            }}
                                            className="btn-small btn-primary"
                                            style={{ padding: "4px 12px", fontSize: "0.8rem", borderRadius: "4px", cursor: "pointer", border: "1px solid var(--border)", background: "var(--error)" }}
                                        >
                                            Reject
                                        </button>
                                    </>

                                    }

                                    {req.type === "reactive" && <>
                                        <button
                                            onClick={() => {
                                                const request_payload = {
                                                    type: IPayloadRequestType.VERDICT_REJOIN,
                                                    payload: {
                                                        req_public_id: req.public_id,
                                                        username: req.username,
                                                        verdict: true,
                                                    },
                                                };

                                                socket.emit("message", request_payload);

                                                handleNotif(req_notif.public_id, req.public_id);
                                            }}

                                            className="btn-small btn-primary"
                                            style={{ padding: "4px 12px", fontSize: "0.8rem", borderRadius: "4px", cursor: "pointer" }}
                                        >
                                            Rejoin
                                        </button>


                                        <button
                                            onClick={() => {

                                            }}
                                            className="btn-small btn-primary"
                                            style={{ padding: "4px 12px", fontSize: "0.8rem", borderRadius: "4px", cursor: "pointer", border: "1px solid var(--border)", background: "var(--error)" }}
                                        >
                                            Reject
                                        </button></>
                                    }


                                    <button
                                        onClick={() => {

                                        }}
                                        className="btn-small btn-primary "
                                        style={{ padding: "4px 12px", fontSize: "0.8rem", borderRadius: "4px", cursor: "pointer", border: "1px solid var(--border)", background: "var(--secondary)", color: "black" }}
                                    >
                                        Block
                                    </button>
                                </div>
                            </div>
                        )})
                    )}
                </div>
            </>)}

        </div>
    );
}