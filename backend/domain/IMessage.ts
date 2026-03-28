
export interface IMessage
{
    readonly message_id : number,
    public_id : string,
    readonly room_id : number,
    username : string,
    nickname : string, 
    content : string,
    created_at : Date, 
}