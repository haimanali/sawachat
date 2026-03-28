export interface IRequestRecord
{
    request_id : number,
    public_id : string,
    sender_id : number, 
    receiver_id : number,
    status : string,
    created_at : Date,
}