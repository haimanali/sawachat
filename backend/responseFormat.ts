export interface ILoginResponse
{
    success : boolean,
    username? : string,
    nickname? : string,    
    session_id? : string,
}

export interface IDBUpdate
{
    affectedRows : number, 
    insertId : any,
}

export interface IDBQuery<T> 
{
    data : T[],
    count : number
}