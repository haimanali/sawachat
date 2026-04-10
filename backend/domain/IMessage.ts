import { IMessagePublic } from "../public/IMessagePublic.js";

export interface IMessage extends IMessagePublic
{
    readonly message_id : number,
    readonly room_id : number,
}