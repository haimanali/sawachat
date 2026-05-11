import { IClient } from "../../domain/IClient.js";
import { IServiceLayerResponse } from "../../responseFormat.js";

export interface ISessionService
{
    performExtendSession(user_id: number): Promise<IServiceLayerResponse>;
    generateSessionID() : IServiceLayerResponse<string>;

    performVerifySession(session_id : string) : Promise<IServiceLayerResponse<IClient>>
    performVerifyUsername(username : string) : Promise<IServiceLayerResponse<IClient>>
    performVerifyUserID (user_id : number) : Promise<IServiceLayerResponse<IClient>>

    performLogOutSession(session_id : string) : Promise<IServiceLayerResponse>;
    performUpdateNickname(user_id: number, nickname: string): Promise<IServiceLayerResponse>;
    performUpdateAvatar(user_id: number, avatar: string): Promise<IServiceLayerResponse>;

    performValidateUsernamePrompt(username : string) : IServiceLayerResponse;
    performValidateNicknamePrompt(nickname : string) : IServiceLayerResponse;
    performValidatePasswordPrompt(password : string) : IServiceLayerResponse;
    performtValidateRequestPrompt(prompt : string) : IServiceLayerResponse;
    performValidateMessagePrompt( prompt : string ) : IServiceLayerResponse;
    peformValidateAvatarPrompt (prompt : string ) : IServiceLayerResponse; 

}