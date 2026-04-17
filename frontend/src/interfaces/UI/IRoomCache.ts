import { IMessagePublic } from "../public/IMessagePublic";

export interface IRoomCache
{
    messages : IMessagePublic [],
    hasMore : boolean,
    cursor : Date | null,
    msgInputDOM : boolean,
    settingsMenu : boolean,
}