import { IClient } from "../../domain/IClient.js";
import { IServiceLayerResponse } from "../../responseFormat.js";

export interface ISessionService
{
    performExtendSession(user_id: number): Promise<IServiceLayerResponse>;
    generateSessionID() : IServiceLayerResponse<string>;
    performVerifySession(session_id : string) : Promise<IServiceLayerResponse<IClient>>
    performVerifyUsername(username : string) : Promise<IServiceLayerResponse<IClient>>
    performLogOutSession(session_id : string) : Promise<IServiceLayerResponse>;
}