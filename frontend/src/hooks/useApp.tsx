import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { IAppContext } from "../interfaces/context/IAppContext";
import { IClientPublic } from "../interfaces/public/IClientPublic";
import { useNavigate } from "react-router-dom";
import { apiCall } from "../services/apiCaller";


const AppContext = createContext<IAppContext | undefined>(undefined);
export const AppProvider = ({ children }: { children: ReactNode }) => {

    const navigate = useNavigate();

    const [userState, setUserState] = useState<IClientPublic | null>(null);
    const [loading, setLoading] = useState<boolean>(true);


    useEffect(() => {
        const checkSession = async () => {

            const ip = "http://localhost:3000/api/auth/session";
            const response = await apiCall(ip, 'GET');

            if (response.success) {
                setUserState(response.data!);
            }
            
            setLoading(false);
        };
        checkSession();

    }, []);


    if (loading)
        return (
            <div className="full-page-loader is-loading">
                <div className="btn-loader-wrap">
                    <div className="btn-spinner" style={{ width: "40px", height: "40px", border: "4px solid #ccc", borderTopColor: " #2563eb" }}></div>
                </div>
            </div>
        );



    return (
        <AppContext.Provider value={{ userState, loading, setUserState, navigate }}>
            {children}
        </AppContext.Provider>

    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined)
        throw Error("something went wrong");

    return context;
};