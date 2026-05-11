import React, { useState } from "react";
import { SocketProvider } from "../../hooks/useSocket";
import { useProtected } from "../../hooks/useProtected";
import SideBar  from '../home/sideBar/sideBar';
import ChatArea  from '../home/chatArea/chatArea';


// this is the main page you see after you log in
// it contains the sidebar and the chat area
export default function Home() {

    const [toastMsg, setToastMsg] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // helper to show a little popup message at the bottom
    const showToast = (msg: string, ms = 2800) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(""), ms);
    };
    
    // we make sure the user is logged in before showing the page
    const { userState, setUserState, status, navigate} = useProtected();

    return (
        <>
            <div className="chat-container">
                {/* we wrap everything in a socket provider so we can send/receive messages in real time */}
                <SocketProvider userState={userState!} status={status} setUserState= {setUserState} navigate={navigate} showToast={showToast}>
                    {/* Mobile backdrop for when the sidebar is open on small screens */}
                    {sidebarOpen && (
                        <div 
                            className="sidebar-backdrop" 
                            onClick={() => setSidebarOpen(false)} 
                        />
                    )}
                    {/* the sidebar has your friends and rooms */}
                    <SideBar sidebarOpen={sidebarOpen} onCloseSidebar={() => setSidebarOpen(false)} />
                    {/* the chat area is where you type and read messages */}
                    <ChatArea onOpenSidebar={() => setSidebarOpen(true)} />
                </SocketProvider>
            </div>

            {/* little toast notification for alerts */}
            <div className={`toast ${toastMsg ? "show" : ""}`} role="alert" aria-live="polite">
                {toastMsg}
            </div>
        </>
    );
}