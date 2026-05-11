import { NavigateFunction } from "react-router-dom";
import { IClientPublic } from "../public/IClientPublic";

export interface IAppContext
{
    userState : IClientPublic | null,
    loading : boolean,
    setUserState : React.Dispatch<React.SetStateAction<IClientPublic | null>>,
    navigate : NavigateFunction,
    theme: 'light' | 'dark',
    setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>,
    language: 'en' | 'ar',
    setLanguage: React.Dispatch<React.SetStateAction<'en' | 'ar'>>,
    readReceipts: boolean,
    setReadReceipts: React.Dispatch<React.SetStateAction<boolean>>,
    t: (key: string) => string,
}