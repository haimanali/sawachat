import { IClient } from "../domain/IClient.js";
import { IMessage } from "../domain/IMessage.js";
import { IRoom } from "../domain/IRoom.js";
import { IClientPublic } from "../public/IClientPublic.js";
import { IMessagePublic } from "../public/IMessagePublic.js";
import { IRequestPublic } from "../public/IRequestPublic.js";
import { IRoomPublic } from "../public/IRoomPublic.js";
import { ILoginRequest, ISignUpRequest } from "../requestFormat.js";
import { IAppLayerResponse } from "../responseFormat.js";


export interface IApiApplication
{
    extendSession(user_id: number): Promise<IAppLayerResponse>;
    acceptRejoinRequest(req_public_id: string, username: string, my_user_id : number, request_verdict : boolean): Promise<IAppLayerResponse<IRoomPublic, {other_userid : number, room_id : number}>>;
    sendRejoinRequest(room_public_id: string, username: string, s_client : IClient): Promise<IAppLayerResponse<IRequestPublic, number>>;
    deleteContact(room_public_id : string, username : string) : Promise<IAppLayerResponse<void, {room_id : number, is_active: boolean}>>;
    deliverAllRecievedMessages(client : IClient) : Promise<IAppLayerResponse<void, IMessage[]>>
    deliverUserMessage(msg_public_id: string, room_public_id : string, s_username : string, is_delivered: boolean): Promise<IAppLayerResponse<void, number>>;
    authenticateBySessionID(session_id : string) : Promise<IAppLayerResponse<IClientPublic, IClient>>;
    authenticateByUsername(username : string) : Promise<IAppLayerResponse<IClientPublic>>;
    loginUser(req_body: ILoginRequest) : Promise<IAppLayerResponse<IClientPublic, { session_id : string }>>,
    registerUser(req_body: ISignUpRequest) : Promise<IAppLayerResponse<IClientPublic, { session_id : string }>>,
    logoutUser(session_id : string) : Promise<IAppLayerResponse>,

    sendContactRequest(r_username : string, s_client : IClient) : Promise<IAppLayerResponse<IRequestPublic, IClient>>
    acceptContactRequest(username : string, request_verdict : boolean, r_client : IClient) : Promise<IAppLayerResponse<{r_room : IRoomPublic, s_room : IRoomPublic}, {s_client : IClient, room : IRoom}>>;
    sendMessage(room_public_id : string, iv: string, content : string, s_client : IClient) : Promise<IAppLayerResponse<IMessagePublic, { room_id : number }>>;
    
    fetchUserRequests(client : IClient, cursor : Date | null) : Promise<IAppLayerResponse<IRequestPublic []>>;
    fetchUserRooms(client : IClient, cursor : Date | null) : Promise<IAppLayerResponse<IRoomPublic [], number[]>>;
    fetchUserMessages(room_public_id : string, cursor : Date | null) : Promise<IAppLayerResponse<IMessagePublic []>>;
}