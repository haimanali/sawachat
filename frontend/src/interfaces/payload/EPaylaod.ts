export enum IPayloadRequestType
{
    MESSAGE_RECEIVED = "message_received",
    SEND_MESSAGE = "send_message",
    SEND_REQUEST = "send_request",
    VERDICT_REQUEST = "verdict_request_create_room",
    VERDICT_REJOIN = "verdict_rejoin",
    LOAD_ROOMS = "load_rooms",
    LOAD_REQUESTS = "load_requests",
    LOAD_MESSAGES =  "load_messages",
    DELIVER_RECEIVED_MESSAGES = "deliver_received_messages",
    DELETE_CONTACT = "delete_contact",
    REJOIN_REQUEST = "rejoin_request",
    LIMIT = 10,
}


export enum IPayloadResponseType
{
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
}


export interface IPayloadInterface<T = void>
{
    success : boolean,
    log_message : string,
    data? : T,
}