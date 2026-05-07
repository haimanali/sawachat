export enum ENotificationType
{
    RECEIVE_MESSAGE = "receive_message",
    RECEIVE_REQUEST = "receive_request",
    CREATE_CONTACT  = "create_contact",
}


export interface INotificaitonTypeCount {
    [ENotificationType.CREATE_CONTACT] : number,
    [ENotificationType.RECEIVE_REQUEST] : number,
}