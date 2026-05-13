import React, { createContext, ReactNode, use, useContext, useEffect, useState } from "react";
import { IClientPublic } from "../interfaces/public/IClientPublic";
import { apiCall } from "../services/apiCaller";
import {  useParams } from "react-router-dom";
import { IPayloadInterface } from "../interfaces/payload/EPaylaod";
import { IProtectedContext } from "../interfaces/context/IProtectedContext";
import { useApp } from "./useApp";


const ProtectedContext = createContext<IProtectedContext | undefined>(undefined);

export const ProtectedProvider = ({ children }: { children: ReactNode }) => {

    const { username } = useParams<{ username: string }>();
    const [status, setStatus] = useState<"authorized" | "loading">("loading");

    const { userState, setUserState, navigate } = useApp();

    useEffect(() => {


        if (userState && userState.username === username) {
            setStatus("authorized");
            return;
        }


        const verifySession = async () => {

            const url = `/api/auth/session/check/${username}`;
            const response: IPayloadInterface<IClientPublic> = await apiCall(url, "GET");

            if (response.success) {
                setStatus("authorized");
                setUserState(response.data!);

            } else {
                navigate("/", { replace: true });
            }

        };

        verifySession();

    }, [username]);



    if (status === "loading") {
        return (
            <div className="full-page-loader is-loading">
                <div className="btn-loader-wrap">
                    <div className="btn-spinner" style={{ width: "40px", height: "40px", border: "4px solid #ccc", borderTopColor: " #2563eb" }}></div>
                </div>
            </div>
        );
    }


    return (

        <ProtectedContext.Provider value={{ userState, setUserState, status, navigate }}>
            {children}
        </ProtectedContext.Provider>
    );

};


export const useProtected = () => {
    const context = useContext(ProtectedContext);
    if (context === undefined)
        throw Error("something went wrong");

    return context
}; 