import { IMessage } from "../../domain/IMessage.js";
import { IRepositoryLayerResponse } from "../../responseFormat.js";

export interface IMessageRepository
{
    insertMessageRecord(content : string, s_user_id : number, room_id : number) : Promise<IRepositoryLayerResponse<IMessage>>;
    getUserMessages (room_public_id : string, cursor : Date | null) : Promise<IRepositoryLayerResponse<IMessage []>>;
}