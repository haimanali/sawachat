import { INotification } from "../../domain/INotification.js";
import { NotificationTypeUnion } from "../../domain/Notifications/NotificationTypeUnion.js";
import { ENotificationType, INotificaitonTypeCount } from "../../notificationFormat.js";
import { IServiceLayerResponse } from "../../responseFormat.js";

export interface INotificationService
{
    generatePublicID() : IServiceLayerResponse<string>;
    
    performMarkAsReadType(type: ENotificationType): Promise<IServiceLayerResponse>;
    performMarkAsReadPID(notif_public_id: string): Promise<IServiceLayerResponse>;
    performLoadNotifications(user_id : number) : Promise<IServiceLayerResponse<{total : INotificaitonTypeCount, notifications : INotification<NotificationTypeUnion> []}>>;
    performPushNotifcation(public_id : string, payload : NotificationTypeUnion, type : ENotificationType, user_id : number) : Promise<IServiceLayerResponse<INotification<NotificationTypeUnion>>>;
}