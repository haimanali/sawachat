import { INotification } from "../../domain/INotification.js";
import { NotificationTypeUnion } from "../../domain/Notifications/NotificationTypeUnion.js";
import { ENotificationType, INotificaitonTypeCount } from "../../notificationFormat.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";

export interface INotificationRepository
{
    updateNotificationReadByType(type: ENotificationType, is_read : boolean): Promise<IRepositoryLayerResponse>;
    updateNotificationReadByPID(notif_public_id : string, is_read : boolean): Promise<IRepositoryLayerResponse>;
    getNotificationsByUserID(user_id: number, is_read : boolean): Promise<IRepositoryLayerResponse<INotification<NotificationTypeUnion> []>>;
    insertNotificationRecord(public_id: string, user_id: number, payload: NotificationTypeUnion, type: ENotificationType): Promise<IRepositoryLayerResponse<INotification<NotificationTypeUnion>>>;
    getNotificationCountByID(user_id : number) : Promise<IRepositoryLayerResponse<INotificaitonTypeCount>>
}