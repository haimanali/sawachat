import { NavigateFunction } from "react-router-dom";
import { IClientPublic } from "../public/IClientPublic";

export interface IProtectedContext
{
    userState : IClientPublic | null,
    status : "authorized" | "loading",
    navigate : NavigateFunction,
    setUserState : React.Dispatch<React.SetStateAction<IClientPublic | null>>,
}