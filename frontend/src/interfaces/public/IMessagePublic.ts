export interface IMessagePublic
{
    public_id : string,
    iv : string,
    room_public_id : string,
    username : string,
    nickname : string,
    content : string,
    created_at : Date,
    is_sent : boolean,
    is_delivered : boolean,
    is_read : boolean
}