import React from "react";
import { useSocket } from "../../hooks/useSocket";
import { IPayloadRequestType } from "../../interfaces/payload/EPaylaod";

export default function AddContactPOPUP() {

    const { socket, contactRequestError, addContactUsername, addContactPOPUP, setaddContactPOPUP, setAddContactUsername } = useSocket();

    return (<>
        <div className={`modal-overlay ${addContactPOPUP ? "active" : ""}`} id="add-friend-modal" inert={!addContactPOPUP}>
            <div className="modal">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h2 data-i18n="add_friend_title" style={{ fontSize: "1.5rem", fontWeight: 700 }}>Add a Contact</h2>
                    <button className="icon-btn" id="close-add-friend"
                        onClick={() => { setaddContactPOPUP(false); setAddContactUsername(""); }}
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

                <form id="add-friend-form" onSubmit={(e) => {
                    e.preventDefault();
                    const request_payload = {
                        type: IPayloadRequestType.SEND_REQUEST,
                        payload: {
                            username: addContactUsername,
                        },
                    };

                    socket.emit("message", request_payload);
                }}>

                    <div className="input-group" style={{ marginBottom: "24px" }}>
                        <label data-i18n="friend_username" htmlFor="friend-username">Contact's Username</label>
                        <div className="input-wrapper">
                            <span className="input-prefix">@</span>
                            <input type="text" id="friend-username" value={addContactUsername} onChange={(e) => { setAddContactUsername(e.target.value) }} placeholder="username" autoComplete="off" required />
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", flexDirection: "column", alignItems: "center" }}>
                        <p className={`message-error ${contactRequestError ? "active" : ""}`} aria-hidden={!contactRequestError}>{contactRequestError}</p>
                        <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>
                            <span data-i18n="send_request">Send Contact Request</span>
                        </button>
                    </div>
                </form>

            </div>
        </div>
    </>);
}