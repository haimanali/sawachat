import { NavigateFunction } from "react-router-dom";
import { IClientPublic } from "../public/IClientPublic";

export interface IAppContext
{
    userState : IClientPublic | null,
    loading : boolean,
    setUserState : React.Dispatch<React.SetStateAction<IClientPublic | null>>,
    navigate : NavigateFunction,

}