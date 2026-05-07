import { IClient } from "../../domain/IClient.js";
import { IRequest } from "../../domain/IRequest.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";

export interface IContactRepository
{
    getContactsByUserId(user_id: number): Promise<IRepositoryLayerResponse<IClient []>>;
    removeReactive(room_id: number): Promise<IRepositoryLayerResponse>;
    getRequestsByPublicID(req_public_id: string): Promise<IRepositoryLayerResponse<IRequest>>;
    insertRejoinRequest(public_id : string, room_id: number, user_id: number, other_userid : number): Promise<IRepositoryLayerResponse<IRequest>>;
    removeRequest(user1: number, user2: number, type : string): Promise<IRepositoryLayerResponse>;
    removeContact(user1: number, user2: number): Promise<IRepositoryLayerResponse>;
    insertContactRequest(public_id : string, r_user_id : number, s_user_id : number) : Promise<IRepositoryLayerResponse<IRequest>>;
    updateContactRequest(status : string, r_user_id : number, s_user_id : number) : Promise<IRepositoryLayerResponse>;
    updateRejoinRequest(status : string, request_id : number) : Promise<IRepositoryLayerResponse<number>>
    insertContactRecord(r_user_id : number, s_user_id : number) : Promise<IRepositoryLayerResponse>
    isRequestPending(r_user_id : number, s_user_id : number, type : string) : Promise<IRepositoryLayerResponse<boolean>>;
    checkRequestLimit(user_id : number, type: "contact" | "reactive") : Promise<IRepositoryLayerResponse<boolean>>;

    getRequestsByUserID(r_user_id: number) : Promise<IRepositoryLayerResponse  <IRequest []>>
}