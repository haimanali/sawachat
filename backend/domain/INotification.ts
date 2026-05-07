import { INotificationPublic } from "../public/INotificationPublic.js";

export interface INotification<T> extends INotificationPublic<T>
{
    readonly notification_id : number,
    readonly user_id : number,
}