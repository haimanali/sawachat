

export interface IClientRepository
{
    getUsername(session_id : string) : string;
    compare(session_id : string, username : string) : boolean;
}