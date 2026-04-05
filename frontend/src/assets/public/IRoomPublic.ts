export interface IRoomPublic
{
    enc_key : string,
    public_id : string,
    room_name : string,
    room_subname : string,
    created_at : Date,
    type : "private" | "group",
}