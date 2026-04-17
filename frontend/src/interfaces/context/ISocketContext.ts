import { NavigateFunction } from "react-router-dom";
import { Socket } from "socket.io-client";
import { IClientPublic } from "../public/IClientPublic";
import { IMessagePublic } from "../public/IMessagePublic";
import { IRequestPublic } from "../public/IRequestPublic";
import { IRoomPublic } from "../public/IRoomPublic";
import { IRoomCache } from "../UI/IRoomCache";

export interface ISocketContext {
    socket: Socket;
    rooms: IRoomPublic[];
    setRooms: React.Dispatch<React.SetStateAction<IRoomPublic[]>>;
    messages: IMessagePublic[];
    setMessages: React.Dispatch<React.SetStateAction<IMessagePublic[]>>;
    requests: IRequestPublic[];
    setRequests: React.Dispatch<React.SetStateAction<IRequestPublic[]>>;
    activeRoomSetup: IRoomPublic | null;
    setActiveRoomSetup: React.Dispatch<React.SetStateAction<IRoomPublic | null>>;
    userState: IClientPublic;
    setHasMoreMessages: React.Dispatch<React.SetStateAction<boolean>>;
    navigate: NavigateFunction;
    setSettingsPOPUP: React.Dispatch<React.SetStateAction<boolean>>;
    setaddContactPOPUP: React.Dispatch<React.SetStateAction<boolean>>;
    setAddContactUsername : React.Dispatch<React.SetStateAction<string>>;
    activeRoomRef: React.MutableRefObject<IRoomPublic | null>;
    messages_cursor: React.MutableRefObject<Date | null>;
    addContactPOPUP: boolean; 
    contactRequestError : string;
    addContactUsername : string;
    settingsPOPUP : boolean,
    loadingMessages : boolean,
    loadingRooms : boolean,
    loadingRequests : boolean,
    roomCache : Record<string, IRoomCache>,
    setRoomCache : React.Dispatch<React.SetStateAction<Record<string, IRoomCache>>>,
    msgInputDOM : boolean,
    setMsgInputDOM : React.Dispatch<React.SetStateAction<boolean>>,
    roomSettingsMenu : boolean,
    setRoomSettingsMenu : React.Dispatch<React.SetStateAction<boolean>>,
}