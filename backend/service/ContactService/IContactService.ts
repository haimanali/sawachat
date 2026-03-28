import { IRequest } from "../../domain/IRequest.js";
import { IServiceLayerResponse } from "../../responseFormat.js";

export interface IContactService
{
    performSendRequest(r_user_id : number, s_user_id : number) : Promise<IServiceLayerResponse<IRequest>>;
    performVerdictRequest(verdict : boolean, s_username : number, r_user_id : number) : Promise<IServiceLayerResponse>;
    performAddContact(s_user_id: number, r_user_id : number) : Promise<IServiceLayerResponse>;

    performLoadRequests(user_id: number, offset : number) : Promise<IServiceLayerResponse<IRequest []>>;
}