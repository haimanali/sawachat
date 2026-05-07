import { IRequestPublic } from "../public/IRequestPublic";
import { IRoomPublic } from "../public/IRoomPublic";

export enum ENotificationType
{
    RECEIVE_MESSAGE = "receive_message",
    RECEIVE_REQUEST = "receive_request",
    CREATE_CONTACT  = "create_contact",
}


export type NotificationTypeUnion = 
{ type : ENotificationType.RECEIVE_REQUEST, request : IRequestPublic } | 
{ type : ENotificationType.CREATE_CONTACT, room : IRoomPublic };


export interface IGlobalNotifCount {
    [ENotificationType.CREATE_CONTACT] : number,
    [ENotificationType.RECEIVE_REQUEST] : number,
    [ENotificationType.RECEIVE_MESSAGE] : number,
    
}