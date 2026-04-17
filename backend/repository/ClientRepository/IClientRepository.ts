import { IClient } from "../../domain/IClient.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";


export interface IClientRepository
{
    extendSessionByUserID(user_id: number): Promise<IRepositoryLayerResponse>;
    getClientBySessionID(session_id : string) : Promise<IRepositoryLayerResponse<IClient>>;
    checkClientExist(username : string) : Promise<IRepositoryLayerResponse<IClient>>;
    removeClientSession(session_id : string) : Promise<IRepositoryLayerResponse>;
    
    validateClient(username : string, password : string) : Promise<IRepositoryLayerResponse<IClient>>;
    
    insertClientRecord(username : string, nickname : string ,password : string) : Promise<IRepositoryLayerResponse<IClient>>;
    insertClientSession(session_id: string, user_id: number, expire: Date): Promise<IRepositoryLayerResponse>;
}