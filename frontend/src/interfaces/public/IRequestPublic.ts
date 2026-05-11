export interface IRequestPublic
{
    public_id : string, 
    username : string,
    nickname : string,
    avatar?: string,
    created_at : Date,
    type : "contact" | "reactive",
}