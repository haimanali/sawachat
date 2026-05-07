import { ENotificationType } from "../UI/notificationFormat";

export enum IPayloadRequestType
{
    EXTEND_SESSION = "extend_session",
    ONLINE_STATUS = "online_status",

    MESSAGE_RECEIVED = "message_received",
    SEND_MESSAGE = "send_message",
    UPDATE_LAST_READ = "update_last_read",
    SEND_REQUEST = "send_request",
    VERDICT_REQUEST = "verdict_request_create_room",
    VERDICT_REJOIN = "verdict_rejoin",
    LOAD_ROOMS = "load_rooms",
    LOAD_REQUESTS = "load_requests",
    LOAD_MESSAGES =  "load_messages",
    LOAD_NOTIFICATIONS = "load_notifications",
    LOAD_CONTACTS = "load_contacts",
    DELIVER_RECEIVED_MESSAGES = "deliver_received_messages",
    DELETE_CONTACT = "delete_contact",
    REJOIN_REQUEST = "rejoin_request",
    MARK_NOTIF_READ = "mark_notif_read",
    BULK_NOTIF_READ = "bulk_notif_read",
    LIMIT = 10,
}



export enum IPayloadResponseType
{
    ONONLINE_STATUS = "ononline_status",
    ONUPDATE_USER_ONLINE_STATUS = "onupdate_user_online_status",
    
    ONSEND_MESSAGE = "onsend_message",
    ONRECEIVE_MESSAGE = "onreceive_message",
    ONMESSAGE_RECEIVED = "onmessage_received",

    ONVERDICT_REQUEST = "onverdict_request_create_room",
    ONVERDICT_REJOIN = "onverdict_rejoin",
    ONCREATE_CONTACT = "oncreate_contact",
    ONDELETE_CONTACT = "ondelete_contact",
    ONDEACTIVATE_CONTACT = "ondeactivate_contact",
    ONACTIVATE_CONTACT = "onactivate_contact",

    ONSEND_REQUEST = "onsend_request",
    ONRECEIVE_REQUEST = "onreceive_request",

    ONLOAD_MESSAGES = "onload_messages",
    ONLOAD_REQUESTS = "onload_requests",
    ONLOAD_ROOMS = "onload_rooms",

    ONREJOIN_REQUEST = "onrejoin_request",
    ONRECEIVE_REJOIN = "onreceive_rejoin",

    ONTRIGGER_NOTIFICATION = "ontrigger_notification",
    ONLOAD_NOTIFICATIONS = "onload_notifications",
    ONREMOVE_CONTACT = "onremove_contact",

    ONLOAD_CONTACTS = "onload_contacts",
    ONAUTH_FAIL = "onauth_fail",
    ONDELETE_MESSAGE = "ondelete_message",
    MESSAGE_DELELTED = "message has been deleted",

}

export interface IPayloadInterface<T = void>
{
    success : boolean,
    log_message : string,
    data? : T,
}

//backend paylaod


//notif payload
export interface INotificaitonTypeCount {
    [ENotificationType.CREATE_CONTACT] : number,
    [ENotificationType.RECEIVE_REQUEST] : number,
}


