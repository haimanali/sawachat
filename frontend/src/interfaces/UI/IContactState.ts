import { IClientPublic } from "../public/IClientPublic";

export interface IContactState
{
    client : IClientPublic,
    onlineState : "online" | "offline",
}