export interface IRoomPublic
{
    public_id : string,
    room_name : string,
    created_at : Date,
    type : "private" | "group",
}