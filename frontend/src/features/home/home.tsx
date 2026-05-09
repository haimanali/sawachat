import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SocketProvider } from "../../hooks/useSocket";
import { useProtected } from "../../hooks/useProtected";
import SideBar  from '../home/sideBar/sideBar';
import ChatArea  from '../home/chatArea/chatArea';
import { IClientPublic } from "../../interfaces/public/IClientPublic";


export default function Home() {

    const [toastMsg, setToastMsg] = useState("");
    
    const showToast = (msg: string, ms = 2800) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(""), ms);
    };
    
    const { userState, setUserState, status, navigate} = useProtected();

    return (
        <>
            <div className="chat-container">
                <SocketProvider userState={userState!} status={status} setUserState= {setUserState} navigate={navigate} showToast={showToast}>
                    <SideBar/>
                    <ChatArea/>
                </SocketProvider>
            </div>


            {/* Toast for alerts */}
            <div className={`toast ${toastMsg ? "show" : ""}`} role="alert" aria-live="polite">
                {toastMsg}
            </div>
        </>
    );
}