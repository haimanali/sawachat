export interface IPayloadInterface<T = void>
{
    success : boolean,
    log_message : string,
    data? : T,
}

export interface IAppLayerResponse<T = void, K = void>
{
    success : boolean,
    log_message : string,
    data? : T,
    internal? : K,
}

export interface IServiceLayerResponse<T = void>
{
    success : boolean,
    log_message : string,
    data? : T,
}

export interface IRepositoryLayerResponse<T = void>
{
    success : boolean,
    log_message : string,
    data? : T,
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