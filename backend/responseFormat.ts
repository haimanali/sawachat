export enum IPayloadResponseType
{
    ONONLINE_STATUS = "ononline_status",
    ONUPDATE_USER_ONLINE_STATUS = "onupdate_user_online_status",

    ONSEND_MESSAGE = "onsend_message",
    ONRECEIVE_MESSAGE = "onreceive_message",
    ONMESSAGE_RECEIVED = "onmessage_received",
    ONMESSAGE_READ = "onmessage_read",
    ONUPDATE_NICKNAME = "onupdate_nickname",
    ONUPDATE_AVATAR = "onupdate_avatar",

    ONLOAD_CONTACTS = "onload_contacts",
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

    ONDELETE_MESSAGE = "ondelete_message",
    ONAUTH_FAIL = "onauth_fail",
    ONBAN = "onban",

    MESSAGE_DELETED = "message has been deleted",
    MAX_STRIKE = 3,
}

export interface IPayloadInterface<T = void>
{
    success : boolean,
    log_message : string,
    data? : T,
}

export interface IAppLayerResponse<T = void, K = void>
{
    success : boolean,
    log_message : string,
    data? : T,
    internal? : K,
}

export interface IServiceLayerResponse<T = void>
{
    success : boolean,
    log_message : string,
    data? : T,
}

export interface IRepositoryLayerResponse<T = void>
{
    success : boolean,
    log_message : string,
    data? : T,
}

export interface IDBUpdate
{
    affectedRows : number, 
    insertId : any,
}

export interface IDBQuery<T> 
{
    data : T[],
    count : number
}


