import { IMessage } from "../../domain/IMessage.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";

export interface IMessageRepository
{
    updateAllMessageDelivered(user_id: number): Promise<IRepositoryLayerResponse<IMessage []>>;
    updateMessageDeliverRecord(public_id: string, is_delivered: boolean): Promise<IRepositoryLayerResponse>;
    insertMessageRecord(public_id : string, iv: string, content : string, s_user_id : number, room_id : number) : Promise<IRepositoryLayerResponse<IMessage>>;
    getClientMessages (room_public_id : string, cursor : Date | null) : Promise<IRepositoryLayerResponse<IMessage []>>;
}