import { IRequest } from "../../domain/IRequest.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";

export interface IContactRepository
{
    insertContactRequest(public_id : string, r_user_id : number, s_user_id : number) : Promise<IRepositoryLayerResponse<IRequest>>;
    updateContactRequest(status : string, r_user_id : number, s_user_id : number) : Promise<IRepositoryLayerResponse>;
    insertContactRecord(r_user_id : number, s_user_id : number) : Promise<IRepositoryLayerResponse>
    isRequestPending(r_user_id : number, s_user_id : number) : Promise<IRepositoryLayerResponse<boolean>>;

    getRequestsByUserID(r_user_id: number, cursor : Date | null) : Promise<IRepositoryLayerResponse  <IRequest []>>
}