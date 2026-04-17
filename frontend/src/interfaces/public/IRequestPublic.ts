export interface IRequestPublic
{
    public_id : string, 
    username : string,
    nickname : string,
    created_at : Date,
    type : "contact" | "reactive",
}