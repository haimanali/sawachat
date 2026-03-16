import { IClient } from "../domain/IClient.js";


export interface IClientRepository
{
    getClientBySessionID(session_id : string) : Promise<IClient | null>;
    checkClientInfo(username : string, password : string) : Promise<IClient | null>;
    checkClientExist(username : string) : Promise<boolean>;
    insertClientRecord(username : string, nickname : string ,password : string) : Promise<void>;
    insertClientSession(session_id: string, user_id: number, expire: Date): Promise<void>;
}