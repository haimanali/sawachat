import { IClient } from "../domain/IClient.js";
import { IRoom } from "../domain/IRoom.js";
import { IClientPublic } from "../public/IClientPublic.js";
import { IMessagePublic } from "../public/IMessagePublic.js";
import { IRequestPublic } from "../public/IRequestPublic.js";
import { IRoomPublic } from "../public/IRoomPublic.js";
import { ILoginRequest, ISignUpRequest } from "../requestFormat.js";
import { IAppLayerResponse } from "../responseFormat.js";


export interface IApiApplication
{
    authenticateBySessionID(session_id : string) : Promise<IAppLayerResponse<IClientPublic, IClient>>;
    authenticateByUsername(username : string) : Promise<IAppLayerResponse<IClientPublic>>;
    loginUser(req_body: ILoginRequest) : Promise<IAppLayerResponse<IClientPublic, { session_id : string }>>,
    registerUser(req_body: ISignUpRequest) : Promise<IAppLayerResponse<IClientPublic, { session_id : string }>>,
   
    sendContactRequest(r_username : string, s_user_id : number) : Promise<IAppLayerResponse<IRequestPublic, IClient>>
    acceptContactRequest(username : string, request_verdict : boolean, r_client : IClient) : Promise<IAppLayerResponse<{r_room : IRoomPublic, s_room : IRoomPublic}, {s_client : IClient, room? : IRoom}>>;
    sendMessage(room_public_id : string, content : string, s_client : IClient) : Promise<IAppLayerResponse<IMessagePublic, { room_id : number }>>;
    
    fetchUserRequests(client : IClient, offset : number) : Promise<IAppLayerResponse<IRequestPublic []>>;
    fetchUserRooms(client : IClient, offset : number) : Promise<IAppLayerResponse<IRoomPublic []>>;
    fetchUserMessages(room_public_id : string, offset: number) : Promise<IAppLayerResponse<IMessagePublic []>>;
}