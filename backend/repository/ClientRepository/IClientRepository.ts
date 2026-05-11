import { IClient } from "../../domain/IClient.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";


export interface IClientRepository
{
    banClient(user_id: number): Promise<IRepositoryLayerResponse>;
    getTotalStrike(user_id: number): Promise<IRepositoryLayerResponse<number>>;
    strikeClient(user_id: number): Promise<IRepositoryLayerResponse>;
    extendSessionByUserID(user_id: number): Promise<IRepositoryLayerResponse>;

    getClientByUserID(user_id: number) : Promise<IRepositoryLayerResponse<IClient>>;
    getClientBySessionID(session_id : string) : Promise<IRepositoryLayerResponse<IClient>>;
    checkClientExist(username : string) : Promise<IRepositoryLayerResponse<IClient>>;
    removeClientSession(session_id : string) : Promise<IRepositoryLayerResponse>;
    updateNickname(user_id: number, nickname: string): Promise<IRepositoryLayerResponse>;
    updateAvatar(user_id: number, avatar: string): Promise<IRepositoryLayerResponse>;
    
    validateClient(username : string, password : string) : Promise<IRepositoryLayerResponse<IClient>>;
    
    insertClientRecord(username : string, nickname : string ,password : string) : Promise<IRepositoryLayerResponse<IClient>>;
    insertClientSession(session_id: string, user_id: number, expire: Date): Promise<IRepositoryLayerResponse>;
}