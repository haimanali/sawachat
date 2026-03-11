import { IClient } from "../domain/IClient";


export interface IClientRepository
{
    getUserBySessionID(session_id : string) : Promise<IClient | null>;
    checkUserInfo(username : string, password : string) : Promise<IClient | null>;
    insertUserRecord(username : string, nickname : string ,password : string) : Promise<void>;
    insertUserSession(session_id: string, user_id: number, expire: Date): Promise<void>;
}