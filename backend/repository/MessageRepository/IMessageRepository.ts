import { IMessage } from "../../domain/IMessage.js";
import { IRepositoryLayerResponse, IServiceLayerResponse } from "../../responseFormat.js";

export interface IMessageRepository
{
    updateMessageIsDel(msg_public_id: string): Promise<IRepositoryLayerResponse<IMessage>>;
    updateMessagesReadInRoom(user_id: number, room_id: number): Promise<IRepositoryLayerResponse>;
    updateAllMessageDelivered(user_id: number): Promise<IRepositoryLayerResponse<IMessage []>>;
    updateMessageDeliverRecord(public_id: string, is_delivered: boolean): Promise<IRepositoryLayerResponse>;
    insertMessageRecord(public_id : string, iv: string, content : string, s_user_id : number, room_id : number) : Promise<IRepositoryLayerResponse<IMessage>>;
    getClientMessages (room_public_id : string, cursor : Date | null) : Promise<IRepositoryLayerResponse<IMessage []>>;
    getTotalUnread(user_id : number) : Promise<IServiceLayerResponse<number>>;
}