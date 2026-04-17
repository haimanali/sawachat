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


