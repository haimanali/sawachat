import { IMessagePublic } from "../public/IMessagePublic.js";

// this interface defines what a chat message looks like
export interface IMessage extends IMessagePublic
{
    readonly message_id : number,
    readonly room_id : number,
}