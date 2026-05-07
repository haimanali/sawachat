import { INotificationPublic } from "../public/INotificationPublic";
import { ENotificationType, NotificationTypeUnion } from "./notificationFormat";

export interface INotificationState
{
    [ENotificationType.CREATE_CONTACT] : Record<string, INotificationPublic<NotificationTypeUnion> >,
    [ENotificationType.RECEIVE_REQUEST] : Record<string, INotificationPublic<NotificationTypeUnion> >,
}