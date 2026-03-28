import { IMessage } from "../../domain/IMessage.js";
import { IServiceLayerResponse } from "../../responseFormat.js";

export interface IMessageService
{
    performSendMessage(message: string, s_user_id : number, room_id : number) : Promise<IServiceLayerResponse<IMessage>>;
    performLoadMessages(room_public_id : string, offset : number) : Promise<IServiceLayerResponse<IMessage []>>;
}