import { ENotificationType } from "../notificationFormat.js";

// this represents a system notification in the database
export interface INotification<T>
{
    public_id : string; // unique id for the notification
    type : ENotificationType;      // what kind of notification it is
    payload : T;       // the extra data for the notification
    created_at : Date; // when it happened
}