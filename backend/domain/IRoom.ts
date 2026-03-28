export interface IRoom
{
    readonly room_id : number,
    public_id : string,
    room_name : string,
    type : "private" | "group",
    created_at : Date,
}