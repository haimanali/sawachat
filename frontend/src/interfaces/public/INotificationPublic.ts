import { ENotificationType } from "../UI/notificationFormat";

export interface INotificationPublic<T>
{
    public_id : string,
    type : ENotificationType,    
    created_at : Date,

    payload : T,
}