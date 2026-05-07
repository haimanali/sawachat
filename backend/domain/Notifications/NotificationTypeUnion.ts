import { ENotificationType } from "../../notificationFormat.js";
import { IRequestPublic } from "../../public/IRequestPublic.js";
import { IRoomPublic } from "../../public/IRoomPublic.js";

export type NotificationTypeUnion = 
{ type : ENotificationType.RECEIVE_REQUEST, request : IRequestPublic } | 
{ type : ENotificationType.CREATE_CONTACT, room : IRoomPublic };