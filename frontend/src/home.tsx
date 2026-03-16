import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiCall } from "./apiCaller";

export default function Home() {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    
    const [status, setStatus] = useState<string>("loading");
    useEffect(() => {
        const verifySession = async () => {
            const url = `http://localhost:3000/api/auth/session/check/${username}`;
            
                const response = await apiCall(url, "GET");
                
                if (response.success) {
                    setStatus("authorized");
                } else {
                    navigate("/");
                }
        };

        verifySession();
    }, [username, navigate]);

    // 3. Render based on the state
    if (status === "loading") {
        return <div>Loading your dashboard...</div>;
    }

    return (
        <div>
            <h1>Welcome home, {username}!</h1>
            <p>This is your private dashboard.</p>
        </div>
    );
}