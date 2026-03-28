import { IClient } from "../../domain/IClient.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";


export interface IClientRepository
{
    getClientBySessionID(session_id : string) : Promise<IRepositoryLayerResponse<IClient>>;
    checkClientExist(username : string) : Promise<IRepositoryLayerResponse<IClient>>;
    
    validateClient(username : string, password : string) : Promise<IRepositoryLayerResponse<IClient>>;
    
    insertClientRecord(username : string, nickname : string ,password : string) : Promise<IRepositoryLayerResponse>;
    insertClientSession(session_id: string, user_id: number, expire: Date): Promise<IRepositoryLayerResponse>;
}