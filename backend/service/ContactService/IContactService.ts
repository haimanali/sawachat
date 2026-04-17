import { IRequest } from "../../domain/IRequest.js";
import { IRoom } from "../../domain/IRoom.js";
import { IServiceLayerResponse } from "../../responseFormat.js";

export interface IContactService
{
    performRemoveReactive(room_id : number): Promise<IServiceLayerResponse>;
    performVerdictRejoin(request: IRequest, request_verdict: boolean): Promise<IServiceLayerResponse<IRoom>>;
    performGetRequest(req_public_id: string): Promise<IServiceLayerResponse<IRequest>>;
    generatePublicID() : string;
    performSendRejoin(public_id : string, room_id: number, user_id: number): Promise<IServiceLayerResponse<{request : IRequest, other_client : number}>>;
    performRemoveContact(user1 : number, user2 : number): Promise<IServiceLayerResponse>;
    performRemoveRequest(user1 : number, user2 : number, type : string): Promise<IServiceLayerResponse>;
    performSendRequest(public_id : string, r_user_id : number, s_user_id : number) : Promise<IServiceLayerResponse<IRequest>>;
    performVerdictRequest(verdict : boolean, s_username : number, r_user_id : number) : Promise<IServiceLayerResponse>;
    performAddContact(s_user_id: number, r_user_id : number) : Promise<IServiceLayerResponse>;

    performLoadRequests(user_id: number,  cursor : Date | null) : Promise<IServiceLayerResponse<IRequest []>>;
}